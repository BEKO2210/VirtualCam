/**
 * Hand-curated option lists for every settings field. Pure data so they
 * live outside the component tree and can be reused by the prompt
 * generator and the reconstruction template.
 */

import type { SettingsKey } from '@/types';

export const APERTURES = [
  'f/1.0', 'f/1.2', 'f/1.4', 'f/1.6', 'f/1.8', 'f/2', 'f/2.2',
  'f/2.5', 'f/2.8', 'f/3.2', 'f/3.5', 'f/4', 'f/4.5', 'f/5', 'f/5.6',
  'f/6.3', 'f/7.1', 'f/8', 'f/9', 'f/10', 'f/11', 'f/13', 'f/14',
  'f/16', 'f/18', 'f/20', 'f/22',
] as const;

export const ISOS = [
  '50', '64', '100', '125', '160', '200', '250', '320', '400', '500',
  '640', '800', '1000', '1250', '1600', '2000', '2500', '3200',
  '4000', '5000', '6400', '8000', '10000', '12800', '16000', '20000',
  '25600', '32000', '40000', '51200', '64000', '102400',
] as const;

export const SHUTTER_SPEEDS = [
  '30s', '15s', '8s', '4s', '2s', '1s', '1/2s', '1/4s', '1/8s',
  '1/15s', '1/30s', '1/60s', '1/100s', '1/125s', '1/160s', '1/200s',
  '1/250s', '1/320s', '1/400s', '1/500s', '1/640s', '1/800s',
  '1/1000s', '1/1250s', '1/1600s', '1/2000s', '1/2500s', '1/3200s',
  '1/4000s', '1/5000s', '1/6400s', '1/8000s',
] as const;

export const RESOLUTIONS = ['1080p', '4K', '5.7K', '6K', '8K'] as const;
export const BIT_DEPTHS = ['8-bit', '10-bit', '12-bit', '14-bit', '16-bit'] as const;
export const ASPECT_RATIOS = ['1:1', '4:3', '3:2', '16:9', '9:16', '2.35:1', '2.39:1', '65:24'] as const;

export const FOCUS_MODES = [
  'single-point AF',
  'continuous AF',
  'manual focus',
  'zone AF',
  'eye AF',
  'animal eye AF',
  'face detection AF',
  'focus stacking',
  'hyperfocal',
] as const;

export const DEPTH_OF_FIELD = [
  'razor-thin',
  'shallow',
  'medium',
  'professional',
  'deep, edge-to-edge sharpness',
  'hyperfocal',
] as const;

export const COLOR_PROFILES = [
  'neutral',
  'natural skin',
  'editorial',
  'cinematic',
  'vivid',
  'pastel',
  'film emulation',
  'Tri-X 400 emulation',
  'Acros emulation',
  'Vogue-grade contrast',
  'Adobe Standard',
  'Adobe Landscape',
  'D-Log to Rec.709',
  'monochrome',
] as const;

export const LIGHTING_STYLES = [
  'soft window light',
  'natural daylight',
  'soft neutral daylight',
  'golden hour',
  'blue hour',
  'overcast',
  'available light',
  'flash + ambient',
  'studio key + fill + rim',
  'beauty dish',
  'octabox',
  'high-key',
  'low-key',
  'rolling shot at dusk',
  'stadium lights',
  'stage LEDs',
] as const;

export const COLOR_TONES = [
  'natural',
  'warm',
  'cool',
  'neutral',
  'desaturated',
  'cinematic teal+orange',
  'pastel',
  'monochrome',
  'soft creams and warm whites',
  'magenta-and-cyan stage wash',
  'deep teal-and-orange',
] as const;

export const CONTRAST_CURVES = [
  'linear',
  'natural',
  'soft S-curve',
  'punchy',
  'high',
  'high local',
  'cinematic',
  'rolled-off',
  'stretched',
] as const;

export const SATURATIONS = [
  'low',
  'natural',
  '+5',
  '+10',
  '+15',
  'high',
  'desaturated',
] as const;

export const GRAIN_SETTINGS = [
  'none',
  'minimal grain',
  'fine 35mm-style grain',
  'subtle film grain',
  'pronounced silver-halide grain',
  'Tri-X grain',
  'ISO grain preserved',
  'negligible',
] as const;

export const HIGHLIGHT_TEMPS = ['warm', 'neutral', 'cool'] as const;
export const SHADOW_TEMPS = ['warm', 'neutral', 'cool'] as const;

export const BOKEH_SHAPES = ['round', 'cat-eye', 'octagonal', 'swirly', 'creamy', 'anamorphic oval'] as const;

export const BG_BLUR = ['none', 'subtle', 'shallow', 'creamy', 'extreme'] as const;
export const BG_TYPES = [
  'seamless gradient',
  'pure white',
  'pure black',
  'studio dark',
  'natural environment',
  'urban context',
  'foliage',
  'soft window light wall',
] as const;

export const LIGHTING_SETUPS = [
  'single key + fill',
  'key + fill + rim',
  'key + fill + rim, softbox + grid',
  'three-point classic',
  'huge north-facing window, no flash',
  'twin macro flash with diffusers',
  'Profoto B10 with beauty dish, gridded rim',
  'dual strobes, 8-inch dome port',
  'ambient + flash bracketing for windows',
  'single large diffuser overhead, foam-board fill',
] as const;

export const FILTER_STYLES = [
  'none',
  'polarizer',
  'graduated ND',
  'magenta filter',
  'yellow filter for tonal separation',
  'red filter',
  'soft mist',
  'black pro-mist 1/4',
] as const;

export const SKY_TREATMENTS = [
  'natural',
  'graduated ND, deep cyan sky',
  'dramatic clouds',
  'clear blue',
  'overcast diffuse',
  'starlit',
] as const;

export const PERSPECTIVE_CONTROLS = [
  'natural',
  'tilt-shift, perfectly vertical lines',
  'verticals corrected',
  'true top-down nadir',
  'wide-angle correction',
] as const;

export const NEGATIVE_INSTRUCTIONS = [
  'No artificial effects.',
  'No plastic skin, no oversharpening, no HDR look.',
  'Avoid HDR halos and oversaturation.',
  'No motion blur on the primary subject.',
  'No fake glow, no runway lighting, no over smoothing.',
  'No background change, no face morphing, no fake glow.',
  'No staging, no heavy color grading.',
  'No tinted color cast, pure neutral B&W.',
  'No backscatter particles, no green cast.',
] as const;

/* ──────────────────────────────────────────────────────────────
 * Field metadata — drives the SettingsDrawer rendering loop
 * ────────────────────────────────────────────────────────────── */

export type FieldKind = 'chips' | 'stops';

export interface SettingField {
  key: SettingsKey;
  label: string;
  kind: FieldKind;
  options: readonly string[];
  /** Optional sub-label below */
  hint?: string;
}

export const FIELD_GROUPS: Array<{ title: string; fields: SettingField[] }> = [
  {
    title: 'Belichtung',
    fields: [
      { key: 'aperture', label: 'Blende', kind: 'stops', options: APERTURES, hint: 'f-stop' },
      { key: 'iso', label: 'ISO', kind: 'stops', options: ISOS, hint: 'sensitivity' },
      { key: 'shutterSpeed', label: 'Belichtung', kind: 'stops', options: SHUTTER_SPEEDS, hint: 'shutter' },
    ],
  },
  {
    title: 'Format',
    fields: [
      { key: 'resolution', label: 'Auflösung', kind: 'chips', options: RESOLUTIONS },
      { key: 'bitDepth', label: 'Bit-Tiefe', kind: 'chips', options: BIT_DEPTHS },
      { key: 'aspectRatio', label: 'Format', kind: 'chips', options: ASPECT_RATIOS },
    ],
  },
  {
    title: 'Fokus & Tiefe',
    fields: [
      { key: 'focusMode', label: 'Fokus-Modus', kind: 'chips', options: FOCUS_MODES },
      { key: 'depthOfField', label: 'Tiefenschärfe', kind: 'chips', options: DEPTH_OF_FIELD },
      { key: 'bokehShape', label: 'Bokeh-Form', kind: 'chips', options: BOKEH_SHAPES },
      { key: 'bgBlur', label: 'BG Blur', kind: 'chips', options: BG_BLUR },
    ],
  },
  {
    title: 'Licht & Look',
    fields: [
      { key: 'lightingStyle', label: 'Lichtstil', kind: 'chips', options: LIGHTING_STYLES },
      { key: 'lightingSetup', label: 'Light Setup', kind: 'chips', options: LIGHTING_SETUPS },
      { key: 'highlightTemp', label: 'Highlight-Temp', kind: 'chips', options: HIGHLIGHT_TEMPS },
      { key: 'shadowTemp', label: 'Shadow-Temp', kind: 'chips', options: SHADOW_TEMPS },
    ],
  },
  {
    title: 'Farbe',
    fields: [
      { key: 'colorProfile', label: 'Color Profile', kind: 'chips', options: COLOR_PROFILES },
      { key: 'colorTone', label: 'Color Tone', kind: 'chips', options: COLOR_TONES },
      { key: 'contrastCurve', label: 'Kontrastkurve', kind: 'chips', options: CONTRAST_CURVES },
      { key: 'saturation', label: 'Sättigung', kind: 'chips', options: SATURATIONS },
      { key: 'grainSetting', label: 'Korn / Grain', kind: 'chips', options: GRAIN_SETTINGS },
    ],
  },
  {
    title: 'Szene',
    fields: [
      { key: 'bgType', label: 'Hintergrund', kind: 'chips', options: BG_TYPES },
      { key: 'skyTreatment', label: 'Himmel', kind: 'chips', options: SKY_TREATMENTS },
      { key: 'filterStyle', label: 'Filter', kind: 'chips', options: FILTER_STYLES },
      { key: 'perspectiveControl', label: 'Perspektive', kind: 'chips', options: PERSPECTIVE_CONTROLS },
    ],
  },
  {
    title: 'Negatives',
    fields: [
      { key: 'negativeInstructions', label: 'Negative Instructions', kind: 'chips', options: NEGATIVE_INSTRUCTIONS },
    ],
  },
];
