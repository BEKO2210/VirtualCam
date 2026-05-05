#!/usr/bin/env node
/**
 * Generates PWA icons + Open Graph social card from inline SVG templates.
 * Runs in CI before vite build, but also locally via `npm run build:pwa`.
 *
 * Output:
 *   public/icons/icon-192.png            (PWA standard)
 *   public/icons/icon-512.png            (PWA standard)
 *   public/icons/icon-maskable-512.png   (PWA maskable, 80% safe area)
 *   public/icons/apple-touch-icon.png    (iOS, 180×180, opaque)
 *   public/social/og.png                 (Open Graph card, 1200×630)
 *
 * Why inline SVG: keeps the asset pipeline self-contained — no Figma
 * exports, no binary blobs in git, easy to tweak colours via env.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
const socialDir = join(root, 'public', 'social');
mkdirSync(iconsDir, { recursive: true });
mkdirSync(socialDir, { recursive: true });

const PRIMARY = '#f5a623';
const ACCENT = '#e85d04';
const BASE = '#0a0a0c';

/* ──────────────────────────────────────────────────────────────
 * App icon (square) — round-rect + aperture mark
 * ────────────────────────────────────────────────────────────── */
const iconSvg = ({ size = 512, padding = 0 } = {}) => {
  // padding is the safe-area inset for maskable icons (rendered on a
  // larger canvas; the device crops to the visible area).
  const r = size * 0.22;
  const inner = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const apertureR = inner * 0.30;
  const sparkleX = cx + apertureR * 0.86;
  const sparkleY = cy - apertureR * 0.86;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#15171c"/>
      <stop offset="1" stop-color="${BASE}"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${PRIMARY}"/>
      <stop offset="1" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <!-- Aperture body -->
  <circle cx="${cx}" cy="${cy}" r="${apertureR}"
          fill="none" stroke="url(#ring)" stroke-width="${size * 0.03}"/>
  <!-- 6 aperture blades (radial slits) -->
  ${Array.from({ length: 6 })
    .map((_, i) => {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + Math.cos(angle) * apertureR * 0.18;
      const y1 = cy + Math.sin(angle) * apertureR * 0.18;
      const x2 = cx + Math.cos(angle) * apertureR * 0.92;
      const y2 = cy + Math.sin(angle) * apertureR * 0.92;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#ring)" stroke-width="${size * 0.025}" stroke-linecap="round"/>`;
    })
    .join('\n  ')}
  <!-- Center dot -->
  <circle cx="${cx}" cy="${cy}" r="${apertureR * 0.18}" fill="url(#ring)"/>
  <!-- Sparkle accent -->
  <g transform="translate(${sparkleX}, ${sparkleY})">
    <path d="M 0 ${-size * 0.05} L ${size * 0.012} ${-size * 0.012} L ${size * 0.05} 0 L ${size * 0.012} ${size * 0.012} L 0 ${size * 0.05} L ${-size * 0.012} ${size * 0.012} L ${-size * 0.05} 0 L ${-size * 0.012} ${-size * 0.012} Z"
          fill="${ACCENT}"/>
  </g>
</svg>`;
};

/* ──────────────────────────────────────────────────────────────
 * Open Graph social card (1200×630)
 * ────────────────────────────────────────────────────────────── */
const ogSvg = () => {
  const W = 1200;
  const H = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0d0e12"/>
      <stop offset="1" stop-color="#15171c"/>
    </linearGradient>
    <radialGradient id="amber" cx="0.78" cy="0.85" r="0.6">
      <stop offset="0" stop-color="${PRIMARY}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${PRIMARY}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cool" cx="0.18" cy="0.18" r="0.5">
      <stop offset="0" stop-color="#3b82f6" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${PRIMARY}"/>
      <stop offset="1" stop-color="${ACCENT}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#amber)"/>
  <rect width="${W}" height="${H}" fill="url(#cool)"/>

  <!-- Aperture mark (left) -->
  <g transform="translate(160, 280)">
    <circle cx="0" cy="0" r="76" fill="none" stroke="url(#ring)" stroke-width="6"/>
    ${Array.from({ length: 6 })
      .map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.cos(angle) * 14;
        const y1 = Math.sin(angle) * 14;
        const x2 = Math.cos(angle) * 70;
        const y2 = Math.sin(angle) * 70;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#ring)" stroke-width="5" stroke-linecap="round"/>`;
      })
      .join('\n    ')}
    <circle cx="0" cy="0" r="14" fill="url(#ring)"/>
    <path d="M 64 -64 L 70 -56 L 78 -54 L 70 -50 L 64 -42 L 60 -50 L 52 -54 L 60 -56 Z" fill="${ACCENT}"/>
  </g>

  <!-- Wordmark + tagline -->
  <text x="280" y="240" font-family="'Inter', system-ui, sans-serif" font-size="84" font-weight="700"
        fill="#f4f4f5" letter-spacing="-2">CameraPrompt</text>
  <text x="280" y="320" font-family="'Inter', system-ui, sans-serif" font-size="84" font-weight="700"
        fill="url(#ring)" letter-spacing="-2">Pro</text>
  <text x="282" y="370" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="22"
        fill="rgba(244,244,245,0.6)" letter-spacing="4">PROCEDURAL · STUDIO · MODULAR</text>

  <!-- Stat strip -->
  <g transform="translate(280, 460)">
    <rect x="-8" y="-30" width="780" height="76" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
    <text font-family="'JetBrains Mono', ui-monospace, monospace" font-size="14"
          fill="rgba(244,244,245,0.45)" letter-spacing="3">
      <tspan x="20" y="-4">CAMERAS</tspan>
      <tspan x="220" y="-4">LENSES</tspan>
      <tspan x="400" y="-4">GENRES</tspan>
      <tspan x="570" y="-4">PROMPTS</tspan>
    </text>
    <text font-family="'Inter', system-ui, sans-serif" font-size="32" font-weight="700"
          fill="#f4f4f5">
      <tspan x="20" y="32">36</tspan>
      <tspan x="220" y="32">80+</tspan>
      <tspan x="400" y="32">21</tspan>
      <tspan x="570" y="32">462</tspan>
    </text>
  </g>

  <!-- Domain badge bottom right -->
  <g transform="translate(${W - 320}, ${H - 60})">
    <rect x="0" y="-26" width="280" height="40" rx="20" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)"/>
    <text x="20" y="0" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="14"
          fill="rgba(244,244,245,0.7)" letter-spacing="2">beko2210.github.io/VirtualCam</text>
  </g>
</svg>`;
};

async function svgToPng(svg, dest, { density = 384, opaque = false } = {}) {
  let pipeline = sharp(Buffer.from(svg), { density });
  if (opaque) pipeline = pipeline.flatten({ background: BASE });
  await pipeline.png({ compressionLevel: 9 }).toFile(dest);
}

async function svgToJpeg(svg, dest, { density = 192, quality = 88 } = {}) {
  await sharp(Buffer.from(svg), { density })
    .flatten({ background: BASE })
    .jpeg({ quality, mozjpeg: true })
    .toFile(dest);
}

console.log('› Building PWA assets…');

// Standard PWA icons (transparent background — host UI provides backdrop)
await svgToPng(iconSvg({ size: 512 }), join(iconsDir, 'icon-512.png'), { density: 384 });
await svgToPng(iconSvg({ size: 192 }), join(iconsDir, 'icon-192.png'), { density: 384 });
console.log('  ✓ icon-192.png + icon-512.png');

// Maskable icon — 80% safe area, render at 512 with a 50px inset so the
// device can crop to circle/squircle without clipping the mark.
await svgToPng(iconSvg({ size: 512, padding: 52 }), join(iconsDir, 'icon-maskable-512.png'), {
  density: 384,
});
console.log('  ✓ icon-maskable-512.png');

// Apple touch icon — opaque (iOS pre-13 doesn't honor transparency well)
await svgToPng(iconSvg({ size: 180 }), join(iconsDir, 'apple-touch-icon.png'), {
  density: 384,
  opaque: true,
});
console.log('  ✓ apple-touch-icon.png (180×180, opaque)');

// Open Graph social card — JPEG for smaller payload (~80 KB vs ~500 KB PNG)
await svgToJpeg(ogSvg(), join(socialDir, 'og.jpg'), { density: 192, quality: 88 });
console.log('  ✓ social/og.jpg (1200×630)');

console.log('Done.');
