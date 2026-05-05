#!/usr/bin/env node
/**
 * Build-time fetcher for Wikimedia Commons camera lead images.
 *
 * Runs in GitHub Actions before `vite build`. For each camera that has
 * a `wiki` field in cameras.json (Wikipedia article title) — or a
 * `wikiFile` override (direct Commons File: title) — it resolves the
 * best available product image and downloads it to
 * public/images/cameras/<id>.<ext>.
 *
 * Design notes
 * - Resolution order:
 *     1. `wikiFile` if present  (manual override, e.g. when an article
 *        has no pageimage or a logo as pageimage).
 *     2. Wikipedia article `pageimages` lookup, *rejecting SVG* (Wikipedia
 *        often picks brand logos which are SVGs — we want photographs).
 *     3. Fallback to scanning the article's `images` list for the first
 *        non-icon JPG/PNG.
 * - Each Wikimedia call retries up to 3 times on HTTP 429 with
 *   exponential backoff (1.5 s, 4 s, 9 s).
 * - Inter-camera delay is 800 ms (was 250 ms — too aggressive, got us
 *   rate-limited in production).
 *
 * License compliance: every downloaded image keeps its attribution
 * (artist + license shortname) in camera-images.json. The studio shows
 * a "Bildnachweise" sheet listing every credit.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'public', 'data');
const imagesDir = join(root, 'public', 'images', 'cameras');
mkdirSync(imagesDir, { recursive: true });

const UA = 'CameraPromptPro/1.0 (https://github.com/BEKO2210/VirtualCam; build-time fetch)';
const API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

const cameras = JSON.parse(readFileSync(join(dataDir, 'cameras.json'), 'utf-8'));
const allCameras = [];
for (const brand of Object.values(cameras)) {
  for (const m of brand.models) allCameras.push({ ...m, brandKey: brand.key });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, init = {}, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...(init.headers ?? {}) }, ...init });
  if (r.status === 429 && attempt < 3) {
    const wait = [1500, 4000, 9000][attempt];
    console.log(`  · 429, backing off ${wait}ms`);
    await sleep(wait);
    return fetchWithRetry(url, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r;
}

async function api(endpoint, params) {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const r = await fetchWithRetry(`${endpoint}?${qs}`);
  return r.json();
}

const isImage = (filename) => /\.(jpe?g|png|webp)$/i.test(filename);
const isLogoLike = (filename) => /\b(logo|wordmark|icon|symbol)\b/i.test(filename);

/** Resolve File: → { thumb, filename, license, artist, sourceUrl } */
async function resolveFile(filename) {
  const j = await api(COMMONS_API, {
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|user|extmetadata|size',
    iiurlheight: '900',
  });
  const ipage = j?.query?.pages?.[0];
  const info = ipage?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? 'unknown';
  const artist = (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim() || info.user || 'unknown';
  const sourceUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replace(/ /g, '_'))}`;
  // Prefer thumburl when available (smaller), else url.
  const thumb = info.thumburl ?? info.url;
  return { thumb, filename, license, artist, sourceUrl };
}

/**
 * Try resolution chain:
 *   1. wikiFile override
 *   2. Wikipedia pageimage (reject .svg)
 *   3. Wikipedia article images list — first non-logo jpg/png
 */
async function resolveCameraImage(cam) {
  if (cam.wikiFile) {
    return await resolveFile(cam.wikiFile);
  }
  if (!cam.wiki) return null;

  // Step 1: pageimages
  const j1 = await api(API, {
    action: 'query',
    titles: cam.wiki,
    prop: 'pageimages',
    pithumbsize: '900',
    redirects: '1',
  });
  const page = j1?.query?.pages?.[0];
  if (!page || page.missing) return null;
  const filename = page.pageimage;
  if (filename && isImage(filename) && !isLogoLike(filename)) {
    return await resolveFile(filename);
  }

  // Step 2: scan article images for the first non-logo JPG/PNG
  const j2 = await api(API, {
    action: 'query',
    titles: cam.wiki,
    prop: 'images',
    imlimit: '50',
    redirects: '1',
  });
  const list = j2?.query?.pages?.[0]?.images ?? [];
  for (const it of list) {
    const t = (it.title ?? '').replace(/^File:/, '');
    if (isImage(t) && !isLogoLike(t)) {
      const resolved = await resolveFile(t);
      if (resolved) return resolved;
    }
  }
  return null;
}

async function downloadTo(url, dest) {
  const r = await fetchWithRetry(url);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

/**
 * Try to remove the white/near-white studio background from a downloaded
 * camera photo using ImageMagick. Most product shots on Wikimedia have
 * white or near-white backgrounds; we replace those with transparency
 * and trim the canvas to the subject.
 *
 * Returns { processed: boolean, ext: 'png' | original }. If ImageMagick
 * fails (not installed, weird format, etc.), we keep the original file.
 */
function processBackground(srcPath, destPngPath) {
  // Pre-flight: pick the magick binary that's available on the runner.
  // GitHub Actions ubuntu-latest ships with ImageMagick 6 ("convert").
  const candidates = ['magick', 'convert'];
  let bin = null;
  for (const c of candidates) {
    try {
      execFileSync(c, ['-version'], { stdio: 'ignore' });
      bin = c;
      break;
    } catch {
      /* try next */
    }
  }
  if (!bin) return { processed: false, ext: null };

  // Strategy: replace pixels within 14% of pure white with transparency,
  // then crop the canvas to the non-transparent bounding box.
  //
  // We tried the more sophisticated connected-flood-fill approach
  // (-draw 'alpha X,Y floodfill') first but it failed silently on the
  // ubuntu-latest IM6 build — likely a policy.xml restriction on the
  // -draw operator. The blunt `-transparent white` version is more
  // permissive and still produces clean cutouts because Wikimedia
  // studio shots almost never have pure-white elements inside the
  // camera body.
  const args = [
    srcPath,
    '-alpha', 'set',
    '-fuzz', '14%',
    '-transparent', 'white',
    '-trim',
    '+repage',
    destPngPath,
  ];

  try {
    execFileSync(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    return { processed: true, ext: 'png' };
  } catch (e) {
    const stderr = e?.stderr?.toString?.() ?? '';
    console.log(`  ! ImageMagick (${bin}) failed: ${e?.message?.split('\n')[0] ?? ''}`);
    if (stderr) console.log(`    ${stderr.split('\n').slice(0, 3).join(' | ')}`);
    return { processed: false, ext: null, error: e?.message };
  }
}

const credits = {};
let ok = 0;
let skipped = 0;

for (const cam of allCameras) {
  if (!cam.wiki && !cam.wikiFile) {
    console.log(`· ${cam.id}: no wiki title — skipped`);
    skipped++;
    continue;
  }
  try {
    const info = await resolveCameraImage(cam);
    if (!info) {
      console.log(`✗ ${cam.id} (${cam.wiki ?? cam.wikiFile}): no usable image`);
      skipped++;
      await sleep(800);
      continue;
    }
    const origExt = (info.filename.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg').toLowerCase();
    const tmpFile = join(tmpdir(), `cpp-${cam.id}.${origExt === 'jpeg' ? 'jpg' : origExt}`);
    const origSize = await downloadTo(info.thumb, tmpFile);

    // Try background removal → PNG. Fall back to keeping the original.
    const pngDest = join(imagesDir, `${cam.id}.png`);
    const result = processBackground(tmpFile, pngDest);
    let file;
    let finalSize;
    if (result.processed) {
      file = `${cam.id}.png`;
      finalSize = readFileSync(pngDest).length;
    } else {
      // Move original into place
      const fallbackExt = origExt === 'jpeg' ? 'jpg' : origExt;
      file = `${cam.id}.${fallbackExt}`;
      writeFileSync(join(imagesDir, file), readFileSync(tmpFile));
      finalSize = origSize;
    }
    try { unlinkSync(tmpFile); } catch { /* ignore */ }

    credits[cam.id] = {
      file,
      filename: info.filename,
      artist: info.artist,
      license: info.license,
      sourceUrl: info.sourceUrl,
      bgRemoved: result.processed,
    };
    console.log(
      `✓ ${cam.id}: ${info.filename} (${(finalSize / 1024).toFixed(0)} kB, ${info.license}${
        result.processed ? ', bg removed' : ', bg kept'
      })`,
    );
    ok++;
  } catch (e) {
    console.log(`✗ ${cam.id} (${cam.wiki ?? cam.wikiFile}): ${e.message}`);
    skipped++;
  }
  // Be polite to Wikimedia.
  await sleep(800);
}

writeFileSync(
  join(dataDir, 'camera-images.json'),
  JSON.stringify({ generated_at: new Date().toISOString(), credits }, null, 2),
);

console.log(`\nDone — ${ok} ok, ${skipped} skipped. Credits written to camera-images.json.`);
