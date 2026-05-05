#!/usr/bin/env node
/**
 * Synthesizes a high-quality starter set of prompts (~250 entries) from the
 * cameras/lenses/templates JSON files. Pluggable later with the real 10k
 * dataset by replacing public/data/prompts.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'public', 'data');

const cameras = JSON.parse(readFileSync(join(dataDir, 'cameras.json'), 'utf-8'));
const lenses = JSON.parse(readFileSync(join(dataDir, 'lenses.json'), 'utf-8'));
const templates = JSON.parse(readFileSync(join(dataDir, 'templates.json'), 'utf-8'));

const nativeMounts = {
  sony: ['sony_e_mount'],
  canon: ['canon_rf', 'ef_mount'],
  nikon: ['nikon_z', 'f_mount'],
  fujifilm: ['fujifilm_x', 'fujifilm_g'],
  panasonic: ['panasonic_l', 'mft'],
  leica: ['panasonic_l'],
  hasselblad: ['hasselblad_xcd'],
  phase_one: ['hasselblad_xcd'],
  blackmagic: ['panasonic_l', 'ef_mount', 'pl_mount'],
  red: ['canon_rf', 'ef_mount', 'pl_mount'],
  arri: ['pl_mount'],
};

function applyTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v ?? '');
  }
  return out
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (t.endsWith(': .')) return false;
      if (t.endsWith(':') && t.length < 40) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xc0ffee); // deterministic seed
const prompts = [];

// Strategy: for every (genre, brand) pair, generate ~2 entries with diverse cams/lenses.
const allBrands = Object.values(cameras);
const allGenres = Object.values(templates);

let counter = 0;
for (const genre of allGenres) {
  for (const brand of allBrands) {
    const camera = pick(brand.models, rng);
    const lensMounts = nativeMounts[brand.key] ?? [];
    const candidateLenses = [];
    for (const mk of lensMounts) {
      if (lenses[mk]) candidateLenses.push(...lenses[mk].lenses);
    }
    if (candidateLenses.length === 0) continue;

    for (let n = 0; n < 2; n++) {
      const lens = pick(candidateLenses, rng);
      const d = genre.defaults || {};
      const vars = {
        camera: camera.name,
        lens: lens.name,
        format: brand.format,
        aperture: d.aperture || lens.max_aperture || 'f/2.8',
        iso: d.iso || '200',
        shutter_speed: d.shutter_speed || '1/250s',
        resolution: d.resolution || '4K',
        bit_depth: d.bit_depth || '10-bit',
        aspect_ratio: d.aspect_ratio || '3:2',
        focus_mode: d.focus_mode || 'single-point AF',
        depth_of_field: d.depth_of_field || 'professional',
        color_profile: d.color_profile || 'neutral',
        lighting_style: d.lighting_style || 'natural',
        highlight_temp: d.highlight_temp || 'warm',
        shadow_temp: d.shadow_temp || 'cool',
        color_tone: d.color_tone || 'neutral',
        contrast_curve: d.contrast_curve || 'natural',
        saturation: d.saturation || 'natural',
        grain_setting: d.grain_setting || 'subtle film grain',
        magnification: d.magnification || 'standard',
        negative_instructions: d.negative_instructions || 'No artificial effects.',
        sky_treatment: d.sky_treatment || '',
        filter_style: d.filter_style || '',
        interior_exterior: d.interior_exterior || '',
        perspective_control: d.perspective_control || '',
        bg_type: d.bg_type || '',
        lighting_setup: d.lighting_setup || '',
        bg_blur: d.bg_blur || '',
        processing_style: d.processing_style || '',
        color_correction: d.color_correction || '',
        tracker: d.tracker || '',
        npf: d.npf || '',
        milky_way_color: d.milky_way_color || '',
        stabilization: d.stabilization || '',
        filter_simulation: d.filter_simulation || '',
        monochrome_profile: d.monochrome_profile || '',
        highlight_handling: d.highlight_handling || '',
        shadow_handling: d.shadow_handling || '',
        bokeh_shape: d.bokeh_shape || '',
        dynamic_range: d.dynamic_range || '14',
      };
      const prompt = applyTemplate(genre.template, vars);
      prompts.push({
        id: `seed-${(counter++).toString(36).padStart(4, '0')}`,
        prompt,
        metadata: {
          genre: genre.key,
          genre_name: genre.name,
          camera: camera.name,
          camera_brand: brand.brand,
          camera_format: brand.format,
          lens: lens.name,
          lens_category: lens.category,
          aperture: vars.aperture,
          iso: vars.iso,
          shutter_speed: vars.shutter_speed,
          resolution: vars.resolution,
          bit_depth: vars.bit_depth,
          aspect_ratio: vars.aspect_ratio,
          focus_mode: vars.focus_mode,
          generated_at: new Date().toISOString(),
        },
      });
    }
  }
}

const output = {
  metadata: {
    source: 'CameraPrompt Pro starter dataset',
    count: prompts.length,
    generated_at: new Date().toISOString(),
    note: 'Synthesized starter set. Replace this file with the full 10k dataset when available.',
  },
  prompts,
};

writeFileSync(join(dataDir, 'prompts.json'), JSON.stringify(output, null, 2));
console.log(`Wrote ${prompts.length} prompts → public/data/prompts.json`);
