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
 *
 * Result is memoized on the (brand, mount) tuple so consumers calling this
 * inside a useShallow selector get a stable reference and don't trigger
 * infinite re-renders.
 */
const compatCache = new Map<string, MountCompat>();
export function checkMountCompat(brandKey: string, lensMountKey: string): MountCompat {
  const k = `${brandKey}:${lensMountKey}`;
  const hit = compatCache.get(k);
  if (hit) return hit;
  const native = nativeMounts[brandKey] ?? [];
  let res: MountCompat;
  if (native[0] === lensMountKey) {
    res = { status: 'native' };
  } else if (native.includes(lensMountKey)) {
    res = { status: 'native', note: 'First-party mount' };
  } else {
    const adapter = adapterMatrix[brandKey]?.[lensMountKey];
    if (adapter && !/no native adapter/i.test(adapter) && !/mismatch/i.test(adapter)) {
      res = { status: 'adapted', adapter };
    } else {
      res = {
        status: 'incompatible',
        adapter,
        note: adapter ?? 'Mechanically incompatible — flange distance / data pin mismatch',
      };
    }
  }
  compatCache.set(k, res);
  return res;
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

/**
 * Memoized on (brandKey, raw) — same RawData reference yields same array
 * reference, so React.useMemo / shallow consumers stay stable.
 */
const annotationCache = new WeakMap<RawData, Map<string, AnnotatedLens[]>>();
export function annotateLensesForBrand(brandKey: string, raw: RawData): AnnotatedLens[] {
  let perRaw = annotationCache.get(raw);
  if (!perRaw) annotationCache.set(raw, (perRaw = new Map()));
  const cached = perRaw.get(brandKey);
  if (cached) return cached;

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
  perRaw.set(brandKey, out);
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

export type PromptMode = 'reconstruction' | 'generation';

export interface GenerateInput {
  brand: CameraBrand | null;
  camera: CameraModel | null;
  lens: Lens | null;
  genre: GenreTemplate | null;
  settings: Settings;
  /** "reconstruction" emits an image-edit/restore prompt that aggressively
   * preserves the source image. "generation" emits the current
   * genre-template style (creative new image). Default reconstruction. */
  mode?: PromptMode;
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
  const { brand, camera, lens, genre, settings: s, mode = 'reconstruction' } = input;
  if (!brand || !camera || !lens || !genre) return { text: '', tokens: [] };
  if (mode === 'reconstruction') {
    return buildReconstructionPrompt(input);
  }

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

/* ──────────────────────────────────────────────────────────────
 * Reconstruction prompt builder
 *
 * AI image models default to "create a new image" when given a
 * descriptive prompt. The reconstruction template aggressively pins
 * the model to "edit/restore the uploaded image, preserve identity,
 * preserve background, only enhance" — exactly the behaviour @beko
 * needs for portrait restoration with a virtual lens upgrade.
 *
 * The template is one fixed scaffold that interpolates the picked
 * camera, lens, and settings. We don't branch on genre because the
 * scaffold is genre-agnostic — the genre still influences the
 * default settings (aperture, ISO, lighting style) so each setup
 * still feels distinct.
 * ────────────────────────────────────────────────────────────── */

const RECON_FALLBACKS: Record<string, string> = {
  resolution: '4K',
  bit_depth: '10-bit',
  aspect_ratio: '3:2',
  focus_mode: 'eye AF',
  depth_of_field: 'shallow',
  bokeh: 'round, natural, realistic',
  color_profile: 'natural skin',
  lighting_style: 'soft neutral daylight',
  highlight_temp: 'warm',
  shadow_temp: 'cool',
  color_tone: 'natural',
  contrast_curve: 'soft S-curve',
  saturation: 'natural',
  grain: 'fine 35mm-style grain',
};

function buildReconstructionPrompt(input: GenerateInput): GenerateResult {
  const { brand, camera, lens, genre, settings: s } = input;
  if (!brand || !camera || !lens || !genre) return { text: '', tokens: [] };
  const d = genre.defaults || {};

  // Resolve every variable once (with the same precedence the legacy
  // generator uses: explicit setting → genre default → reconstruction fallback).
  const v = {
    camera: camera.name,
    lens: lens.name,
    format: brand.format,
    aperture: s.aperture || d.aperture || lens.max_aperture || 'f/2',
    iso: s.iso || formatIso(d.iso || '200'),
    shutter: s.shutterSpeed || d.shutter_speed || '1/250s',
    resolution: s.resolution || d.resolution || RECON_FALLBACKS.resolution,
    bit_depth: s.bitDepth || d.bit_depth || RECON_FALLBACKS.bit_depth,
    aspect_ratio: s.aspectRatio || d.aspect_ratio || RECON_FALLBACKS.aspect_ratio,
    focus_mode: s.focusMode || d.focus_mode || RECON_FALLBACKS.focus_mode,
    depth_of_field: s.depthOfField || d.depth_of_field || RECON_FALLBACKS.depth_of_field,
    bokeh: s.bokehShape || d.bokeh_shape || RECON_FALLBACKS.bokeh,
    color_profile: s.colorProfile || d.color_profile || RECON_FALLBACKS.color_profile,
    lighting_style: s.lightingStyle || d.lighting_style || RECON_FALLBACKS.lighting_style,
    highlight_temp: s.highlightTemp || d.highlight_temp || RECON_FALLBACKS.highlight_temp,
    shadow_temp: s.shadowTemp || d.shadow_temp || RECON_FALLBACKS.shadow_temp,
    color_tone: s.colorTone || d.color_tone || RECON_FALLBACKS.color_tone,
    contrast_curve: s.contrastCurve || d.contrast_curve || RECON_FALLBACKS.contrast_curve,
    saturation: s.saturation || d.saturation || RECON_FALLBACKS.saturation,
    grain: s.grainSetting || d.grain_setting || RECON_FALLBACKS.grain,
    negative: s.negativeInstructions || d.negative_instructions || 'No fake glow, no plastic skin, no over-smoothing.',
  };

  // Build the prompt as a list of (literal, key?) chunks so we can
  // record token spans for the live-diff highlight in the UI.
  const chunks: Array<{ text: string; key?: string }> = [
    { text: 'STRICT IMAGE RECONSTRUCTION TASK\n\n' },
    { text: 'Use the uploaded image as a hard reference. The output must be an enhanced reconstruction of the SAME image — not a reinterpretation.\n\n' },
    { text: 'NON-NEGOTIABLE RULES:\n' },
    { text: '- Keep the exact same composition, framing, and camera angle\n' },
    { text: '- Preserve 100% of the background, environment, and object placement\n' },
    { text: '- Do NOT change pose, proportions, or facial structure\n' },
    { text: '- Do NOT stylize or reimagine the scene\n' },
    { text: '- Identity must remain identical (no AI face drift)\n\n' },
    { text: 'ALLOWED CHANGES ONLY:\n' },
    { text: '- Subtle skin cleanup (remove minor blemishes, keep real texture)\n' },
    { text: '- Improve sharpness on subject (natural, no oversharpening)\n' },
    { text: '- Enhance dynamic range (recover highlights/shadows)\n' },
    { text: '- Refine color grading (natural skin tones, no HDR look)\n' },
    { text: '- Slight micro-contrast boost\n' },
    { text: '- Add very fine film grain\n\n' },
    { text: 'CAMERA & LOOK (MANDATORY):\n' },
    { text: '- ' }, { text: v.camera, key: 'camera' }, { text: ' ' },
    { text: v.format, key: 'format' }, { text: ' look\n' },
    { text: '- ' }, { text: v.lens, key: 'lens' }, { text: '\n' },
    { text: '- Aperture ' }, { text: v.aperture, key: 'aperture' },
    { text: ' → ' }, { text: v.depth_of_field, key: 'depth_of_field' }, { text: ' depth of field\n' },
    { text: '- Bokeh: ' }, { text: v.bokeh, key: 'bokeh' }, { text: '\n' },
    { text: '- ISO ' }, { text: v.iso, key: 'iso' }, { text: ', ' },
    { text: v.shutter, key: 'shutter' }, { text: ' look\n' },
    { text: '- Lighting: ' }, { text: v.lighting_style, key: 'lighting_style' }, { text: '\n' },
    { text: '- Focus: ' }, { text: v.focus_mode, key: 'focus_mode' }, { text: '\n\n' },
    { text: 'COLOR:\n' },
    { text: '- Profile: ' }, { text: v.color_profile, key: 'color_profile' }, { text: '\n' },
    { text: '- Tone: ' }, { text: v.color_tone, key: 'color_tone' },
    { text: ' (' }, { text: v.highlight_temp, key: 'highlight_temp' }, { text: ' highlights, ' },
    { text: v.shadow_temp, key: 'shadow_temp' }, { text: ' shadows)\n' },
    { text: '- Contrast: ' }, { text: v.contrast_curve, key: 'contrast_curve' }, { text: '\n' },
    { text: '- Saturation: ' }, { text: v.saturation, key: 'saturation' }, { text: '\n' },
    { text: '- Grain: ' }, { text: v.grain, key: 'grain' }, { text: '\n' },
    { text: '- No oversaturation, no artificial glow, no plastic skin\n\n' },
    { text: 'OUTPUT:\n' },
    { text: '- ' }, { text: v.resolution, key: 'resolution' }, { text: ' ' },
    { text: v.bit_depth, key: 'bit_depth' }, { text: ', aspect ' },
    { text: v.aspect_ratio, key: 'aspect_ratio' }, { text: '\n' },
    { text: '- Photorealistic, editorial-quality upgrade\n' },
    { text: '- Must look like the original photo, just taken with a high-end lens and perfect exposure\n\n' },
    { text: 'NEGATIVE INSTRUCTIONS:\n' },
    { text: v.negative, key: 'negative_instructions' },
  ];

  let text = '';
  const tokens: GenerateResult['tokens'] = [];
  for (const c of chunks) {
    if (!c.text) continue;
    if (c.key && c.text) {
      tokens.push({ start: text.length, end: text.length + c.text.length, key: c.key, value: c.text });
    }
    text += c.text;
  }
  return { text: text.trim(), tokens };
}

export type { CameraBrand, CameraModel, GenreTemplate, Lens, LensMount, PromptEntry, RawData };
