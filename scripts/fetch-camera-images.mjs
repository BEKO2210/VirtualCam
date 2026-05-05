#!/usr/bin/env node
/**
 * Build-time fetcher for Wikimedia Commons camera lead images.
 *
 * Runs in GitHub Actions before `vite build`. For each camera that has a
 * `wiki` field in cameras.json, it queries the MediaWiki API for the
 * page's lead image, downloads it to public/images/cameras/<id>.<ext>,
 * and writes attribution metadata to public/data/camera-images.json.
 *
 * The script is fault-tolerant: any camera without a Wikipedia article
 * (or without a lead image) is skipped and logged. The studio falls
 * back to the procedural rig for those cameras.
 *
 * License compliance: every downloaded image keeps its attribution
 * (artist, license shortname) in camera-images.json. The studio shows
 * a "Bildnachweise" sheet listing every credit so we honor CC-BY-SA's
 * "BY" clause.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'public', 'data');
const imagesDir = join(root, 'public', 'images', 'cameras');
mkdirSync(imagesDir, { recursive: true });

const UA = 'CameraPromptPro/1.0 (https://github.com/BEKO2210/VirtualCam; build-time fetch)';
const API = 'https://en.wikipedia.org/w/api.php';

const cameras = JSON.parse(readFileSync(join(dataDir, 'cameras.json'), 'utf-8'));
const allCameras = [];
for (const brand of Object.values(cameras)) {
  for (const m of brand.models) allCameras.push({ ...m, brandKey: brand.key });
}

async function api(params) {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const r = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

async function getPageImage(title) {
  // Step 1: pageimages → lead image filename
  const j1 = await api({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    pithumbsize: '800',
    redirects: '1',
  });
  const page = j1?.query?.pages?.[0];
  if (!page || page.missing) return null;
  const filename = page.pageimage;
  const thumb = page.thumbnail?.source;
  if (!filename || !thumb) return null;

  // Step 2: imageinfo for attribution
  const j2 = await api({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|user|extmetadata',
    iiurlheight: '800',
  });
  const ipage = j2?.query?.pages?.[0];
  const info = ipage?.imageinfo?.[0];
  const meta = info?.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? 'unknown';
  const artist = (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim() || info?.user || 'unknown';
  const sourceUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replace(/ /g, '_'))}`;

  return { thumb, filename, license, artist, sourceUrl };
}

async function download(url, dest) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

const credits = {};
let ok = 0;
let skipped = 0;

for (const cam of allCameras) {
  if (!cam.wiki) {
    console.log(`· ${cam.id}: no wiki title — skipped`);
    skipped++;
    continue;
  }
  try {
    const info = await getPageImage(cam.wiki);
    if (!info) {
      console.log(`✗ ${cam.id} (${cam.wiki}): no lead image`);
      skipped++;
      continue;
    }
    const ext = (info.thumb.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg').toLowerCase();
    const dest = join(imagesDir, `${cam.id}.${ext === 'jpeg' ? 'jpg' : ext}`);
    const size = await download(info.thumb, dest);
    credits[cam.id] = {
      file: `${cam.id}.${ext === 'jpeg' ? 'jpg' : ext}`,
      filename: info.filename,
      artist: info.artist,
      license: info.license,
      sourceUrl: info.sourceUrl,
    };
    console.log(`✓ ${cam.id}: ${info.filename} (${(size / 1024).toFixed(0)} kB, ${info.license})`);
    ok++;
    // Be polite to Wikimedia.
    await new Promise((res) => setTimeout(res, 250));
  } catch (e) {
    console.log(`✗ ${cam.id} (${cam.wiki}): ${e.message}`);
    skipped++;
  }
}

writeFileSync(
  join(dataDir, 'camera-images.json'),
  JSON.stringify({ generated_at: new Date().toISOString(), credits }, null, 2),
);

console.log(`\nDone — ${ok} ok, ${skipped} skipped. Credits written to camera-images.json.`);
if (existsSync(join(imagesDir, '.gitkeep'))) {
  // already tracked
}
