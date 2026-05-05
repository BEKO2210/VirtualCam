import type {
  CameraBrand,
  CameraModel,
  GenreTemplate,
  Lens,
  LensMount,
  MountCompat,
  PromptEntry,
  RawData,
  Settings,
} from '@/types';

/* ──────────────────────────────────────────────────────────────
 * Mount compatibility
 * ────────────────────────────────────────────────────────────── */

/** Native + first-party mounts per brand. */
export const nativeMounts: Record<string, string[]> = {
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

/**
 * Adapter graph: { brandKey: { mountKey: adapterName } }.
 * If a lens lives on a non-native mount, we surface this as a Pro hint
 * rather than hiding it.
 */
export const adapterMatrix: Record<string, Record<string, string>> = {
  sony: {
    ef_mount: 'Sigma MC-11 / Metabones EF→E',
    canon_rf: 'No native adapter (RF closed)',
    nikon_z: 'No native adapter',
    f_mount: 'TechArt TZE-01',
    pl_mount: 'Cine PL→E adapter',
    fujifilm_x: 'Mount mismatch',
  },
  canon: {
    ef_mount: 'Canon EF→RF Adapter',
    f_mount: 'Fotodiox Pro F→RF',
    pl_mount: 'PL→RF Cine Adapter',
    sony_e_mount: 'No native adapter',
  },
  nikon: {
    f_mount: 'Nikon FTZ II',
    ef_mount: 'Megadap EFTZ21',
    pl_mount: 'PL→Z Cine Adapter',
  },
  fujifilm: {
    fujifilm_g: 'GF→X requires technical adapter',
    fujifilm_x: 'X→G requires technical adapter',
    ef_mount: 'Fringer EF-FX Pro',
    f_mount: 'Fringer F-FX',
  },
  panasonic: {
    mft: 'Panasonic MFT→L (cine workflow)',
    panasonic_l: 'Native L-Mount',
    ef_mount: 'Sigma MC-21 EF→L',
    pl_mount: 'PL→L adapter',
  },
  leica: {
    panasonic_l: 'L-Mount Alliance native',
    ef_mount: 'Novoflex EF→L',
  },
  hasselblad: {
    hasselblad_xcd: 'Native XCD',
    ef_mount: 'Hasselblad H→V→XCD chain',
  },
  phase_one: {
    hasselblad_xcd: 'Cross-system adapter',
  },
  blackmagic: {
    panasonic_l: 'Native L (BMPCC 6K G2)',
    ef_mount: 'Native EF (BMPCC 6K)',
    pl_mount: 'PL Mount Pro',
    sony_e_mount: 'No native adapter',
  },
  red: {
    canon_rf: 'RED RF Mount',
    ef_mount: 'RED EF Mount',
    pl_mount: 'RED PL Mount',
  },
  arri: {
    pl_mount: 'Native PL',
    ef_mount: 'ARRI EF Mount',
  },
};

/** Mount color codes for the rig (CSS variables defined in index.css). */
export const mountColorVar: Record<string, string> = {
  sony_e_mount: 'var(--color-mount-e)',
  canon_rf: 'var(--color-mount-rf)',
  ef_mount: 'var(--color-mount-rf)',
  nikon_z: 'var(--color-mount-z)',
  f_mount: 'var(--color-mount-z)',
  fujifilm_x: 'var(--color-mount-x)',
  fujifilm_g: 'var(--color-mount-x)',
  panasonic_l: 'var(--color-mount-l)',
  mft: 'var(--color-mount-mft)',
  hasselblad_xcd: 'var(--color-mount-pl)',
  pl_mount: 'var(--color-mount-pl)',
};

/**
 * Returns mount compatibility verdict for a (brand, lens-mount) pair.
 * Never hides – returns adapter info for Pro display.
 */
export function checkMountCompat(brandKey: string, lensMountKey: string): MountCompat {
  const native = nativeMounts[brandKey] ?? [];
  if (native[0] === lensMountKey) return { status: 'native' };
  if (native.includes(lensMountKey)) {
    return { status: 'native', note: 'First-party mount' };
  }
  const adapter = adapterMatrix[brandKey]?.[lensMountKey];
  if (adapter && !/no native adapter/i.test(adapter) && !/mismatch/i.test(adapter)) {
    return { status: 'adapted', adapter };
  }
  return {
    status: 'incompatible',
    adapter,
    note: adapter ?? 'Mechanically incompatible — flange distance / data pin mismatch',
  };
}

/* ──────────────────────────────────────────────────────────────
 * Lens helpers
 * ────────────────────────────────────────────────────────────── */

/** All lenses across mounts, annotated with their mount key. */
export interface AnnotatedLens extends Lens {
  mountKey: string;
  mountLabel: string;
  brandLabel: string;
  compat: MountCompat;
}

export function annotateLensesForBrand(brandKey: string, raw: RawData): AnnotatedLens[] {
  const out: AnnotatedLens[] = [];
  for (const [mountKey, mount] of Object.entries(raw.lenses)) {
    const compat = checkMountCompat(brandKey, mountKey);
    if (compat.status === 'incompatible') continue; // hide hard-impossible mounts
    for (const l of mount.lenses) {
      out.push({
        ...l,
        mountKey,
        mountLabel: mount.mount,
        brandLabel: mount.brand,
        compat,
      });
    }
  }
  // Native first, then adapted
  out.sort((a, b) => {
    if (a.compat.status !== b.compat.status) {
      return a.compat.status === 'native' ? -1 : 1;
    }
    return categoryOrder(a.category) - categoryOrder(b.category);
  });
  return out;
}

const categoryOrder = (c: Lens['category']): number =>
  ({
    'Ultra-Wide': 0,
    Wide: 1,
    Standard: 2,
    Portrait: 3,
    Telephoto: 4,
    'Super-Telephoto': 5,
    Macro: 6,
    Cinema: 7,
  }[c] ?? 9);

/* ──────────────────────────────────────────────────────────────
 * Aperture, ISO formatters
 * ────────────────────────────────────────────────────────────── */

export function getApertureForLens(maxAperture: string, bias: number = 0.5): string {
  if (maxAperture.includes('T/')) {
    const tVal = parseFloat(maxAperture.replace('T/', ''));
    const opts = [tVal, tVal + 0.3, tVal + 0.7, tVal + 1.0];
    const pick = Math.random() < bias ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
    return `T/${pick.toFixed(1)}`;
  }
  if (!maxAperture.includes('f/')) return 'f/2.8';
  const fPart = maxAperture.split('-')[0];
  const fVal = parseFloat(fPart.replace('f/', '').replace(',', '.')) || 2.8;
  let opts: number[];
  if (fVal <= 1.4) opts = [fVal, fVal + 0.3, fVal + 0.7, fVal + 1.0, fVal + 1.7, fVal + 2.3];
  else if (fVal <= 2.8) opts = [fVal, fVal + 0.7, fVal + 1.4, fVal + 2.1, fVal + 2.8, fVal + 4.0];
  else opts = [fVal, fVal + 1.0, fVal + 2.0, fVal + 3.0, fVal + 4.0, fVal + 5.0];
  opts = opts.map((o) => Math.max(1.0, Math.min(22, o)));
  const pick = Math.random() < bias ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
  return `f/${pick.toFixed(1)}`.replace('.0', '');
}

export function formatIso(iso: number | string): string {
  const v = typeof iso === 'string' ? parseInt(iso) || 100 : iso;
  return v >= 1000 ? v.toLocaleString('de-DE') : String(v);
}

/* ──────────────────────────────────────────────────────────────
 * Prompt generation
 * ────────────────────────────────────────────────────────────── */

const FALLBACKS: Record<string, string> = {
  resolution: '4K',
  bit_depth: '10-bit',
  aspect_ratio: '3:2',
  focus_mode: 'single-point AF',
  depth_of_field: 'professional',
  color_profile: 'neutral',
  lighting_style: 'natural',
  highlight_temp: 'warm',
  shadow_temp: 'cool',
  color_tone: 'neutral',
  contrast_curve: 'natural',
  saturation: 'natural',
  grain_setting: 'subtle film grain',
  dynamic_range: '14',
  magnification: 'standard',
  negative_instructions: 'No artificial effects.',
};

export interface GenerateInput {
  brand: CameraBrand | null;
  camera: CameraModel | null;
  lens: Lens | null;
  genre: GenreTemplate | null;
  settings: Settings;
}

/**
 * Returns the generated prompt, plus a list of token spans
 * (start..end indices) that point at variable substitutions –
 * used for live diff/animation in the UI.
 */
export interface GenerateResult {
  text: string;
  /** Sorted, non-overlapping ranges of substituted tokens. */
  tokens: Array<{ start: number; end: number; key: string; value: string }>;
}

export function generatePrompt(input: GenerateInput): GenerateResult {
  const { brand, camera, lens, genre, settings: s } = input;
  if (!brand || !camera || !lens || !genre) return { text: '', tokens: [] };

  const d = genre.defaults || {};
  const variables: Record<string, string> = {
    camera: camera.name,
    lens: lens.name,
    aperture: s.aperture || d.aperture || lens.max_aperture || 'f/2.8',
    iso: s.iso || formatIso(d.iso || '100'),
    shutter_speed: s.shutterSpeed || d.shutter_speed || '1/125s',
    format: brand.format,
    resolution: s.resolution || d.resolution || FALLBACKS.resolution,
    bit_depth: s.bitDepth || d.bit_depth || FALLBACKS.bit_depth,
    aspect_ratio: s.aspectRatio || d.aspect_ratio || FALLBACKS.aspect_ratio,
    focus_mode: s.focusMode || d.focus_mode || FALLBACKS.focus_mode,
    depth_of_field: s.depthOfField || d.depth_of_field || FALLBACKS.depth_of_field,
    color_profile: s.colorProfile || d.color_profile || FALLBACKS.color_profile,
    lighting_style: s.lightingStyle || d.lighting_style || FALLBACKS.lighting_style,
    highlight_temp: s.highlightTemp || d.highlight_temp || FALLBACKS.highlight_temp,
    shadow_temp: s.shadowTemp || d.shadow_temp || FALLBACKS.shadow_temp,
    color_tone: s.colorTone || d.color_tone || FALLBACKS.color_tone,
    contrast_curve: s.contrastCurve || d.contrast_curve || FALLBACKS.contrast_curve,
    saturation: s.saturation || d.saturation || FALLBACKS.saturation,
    grain_setting: s.grainSetting || d.grain_setting || FALLBACKS.grain_setting,
    dynamic_range: s.dynamicRange || d.dynamic_range || FALLBACKS.dynamic_range,
    magnification: s.magnification || d.magnification || FALLBACKS.magnification,
    negative_instructions:
      s.negativeInstructions || d.negative_instructions || FALLBACKS.negative_instructions,
    filter_style: s.filterStyle || d.filter_style || '',
    sky_treatment: s.skyTreatment || d.sky_treatment || '',
    interior_exterior: s.interiorExterior || d.interior_exterior || '',
    perspective_control: s.perspectiveControl || d.perspective_control || '',
    bg_type: s.bgType || d.bg_type || '',
    lighting_setup: s.lightingSetup || d.lighting_setup || '',
    bg_blur: s.bgBlur || d.bg_blur || '',
    processing_style: s.processingStyle || d.processing_style || '',
    color_correction: s.colorCorrection || d.color_correction || '',
    tracker: s.tracker || d.tracker || '',
    npf: s.npf || d.npf || '',
    milky_way_color: s.milkyWayColor || d.milky_way_color || '',
    stabilization: s.stabilization || d.stabilization || '',
    filter_simulation: s.filterSimulation || d.filter_simulation || '',
    monochrome_profile: s.monochromeProfile || d.monochrome_profile || '',
    highlight_handling: s.highlightHandling || d.highlight_handling || '',
    shadow_handling: s.shadowHandling || d.shadow_handling || '',
    bokeh_shape: s.bokehShape || d.bokeh_shape || '',
  };

  // Single-pass substitution that records ranges for the UI.
  const placeholderRe = /\{(\w+)\}/g;
  const out: string[] = [];
  const tokens: GenerateResult['tokens'] = [];
  let lastIdx = 0;
  let cursor = 0;
  const tpl = genre.template;
  let m: RegExpExecArray | null;
  while ((m = placeholderRe.exec(tpl)) !== null) {
    const literal = tpl.slice(lastIdx, m.index);
    out.push(literal);
    cursor += literal.length;
    const key = m[1];
    const value = (variables[key] ?? '').toString();
    if (value) {
      tokens.push({ start: cursor, end: cursor + value.length, key, value });
    }
    out.push(value);
    cursor += value.length;
    lastIdx = m.index + m[0].length;
  }
  out.push(tpl.slice(lastIdx));

  // Clean dangling colons / empty bullet lines.
  const raw = out.join('');
  const cleaned = raw
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (t.endsWith(': .') || t.endsWith(':  .')) return false;
      if (t.endsWith(':') && t.length < 40) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Token offsets shift after cleaning – recompute by searching values.
  // (Cheap because tokens are short and unique-ish per render.)
  const finalTokens: GenerateResult['tokens'] = [];
  let scanFrom = 0;
  for (const t of tokens) {
    const i = cleaned.indexOf(t.value, scanFrom);
    if (i >= 0) {
      finalTokens.push({ ...t, start: i, end: i + t.value.length });
      scanFrom = i + t.value.length;
    }
  }
  return { text: cleaned, tokens: finalTokens };
}

/* ──────────────────────────────────────────────────────────────
 * Randomize a full setup
 * ────────────────────────────────────────────────────────────── */

export function pickRandomSetup(raw: RawData): {
  brandKey: string;
  cameraId: string;
  lensId: string;
  lensMountKey: string;
  genreKey: string;
} {
  const brands = Object.values(raw.cameras);
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const camera = brand.models[Math.floor(Math.random() * brand.models.length)];
  const lenses = annotateLensesForBrand(brand.key, raw).filter(
    (l) => l.compat.status === 'native',
  );
  const lens = lenses[Math.floor(Math.random() * lenses.length)];
  const genres = Object.values(raw.templates);
  const genre = genres[Math.floor(Math.random() * genres.length)];
  return {
    brandKey: brand.key,
    cameraId: camera.id,
    lensId: lens.id,
    lensMountKey: lens.mountKey,
    genreKey: genre.key,
  };
}

/* ──────────────────────────────────────────────────────────────
 * Lookup helpers
 * ────────────────────────────────────────────────────────────── */

export function findCamera(raw: RawData, brandKey: string, cameraId: string): CameraModel | null {
  return raw.cameras[brandKey]?.models.find((m) => m.id === cameraId) ?? null;
}

export function findLens(raw: RawData, mountKey: string, lensId: string): Lens | null {
  return raw.lenses[mountKey]?.lenses.find((l) => l.id === lensId) ?? null;
}

export function findLensAcrossMounts(raw: RawData, lensId: string): { mountKey: string; lens: Lens } | null {
  for (const [mountKey, m] of Object.entries(raw.lenses)) {
    const lens = m.lenses.find((l) => l.id === lensId);
    if (lens) return { mountKey, lens };
  }
  return null;
}

export type { CameraBrand, CameraModel, GenreTemplate, Lens, LensMount, PromptEntry, RawData };
