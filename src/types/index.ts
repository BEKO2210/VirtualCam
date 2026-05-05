export type BodyShape = 'mirrorless' | 'dslr' | 'medium-format' | 'cinema' | 'rangefinder';
export type SensorFormat =
  | 'Full-Frame'
  | 'APS-C'
  | 'Medium Format'
  | 'Super 35'
  | 'Micro Four Thirds'
  | 'Large Format';

export interface CameraModel {
  /** Slug used as URL/state id */
  id: string;
  name: string;
  sensor: string;
  /** "mirrorless", "dslr", etc. — drives rig silhouette */
  type: BodyShape;
  iso_range: [number, number];
  video: string;
  /** Optional release year for sorting and badges */
  year?: number;
  /** "flagship" | "pro" | "enthusiast" | "cine" */
  tier?: 'flagship' | 'pro' | 'enthusiast' | 'cine';
}

export interface CameraBrand {
  /** Slug (sony, canon, …) */
  key: string;
  brand: string;
  format: SensorFormat;
  /** Native mount key */
  mount: string;
  models: CameraModel[];
}

export type LensCategory =
  | 'Ultra-Wide'
  | 'Wide'
  | 'Standard'
  | 'Portrait'
  | 'Telephoto'
  | 'Super-Telephoto'
  | 'Macro'
  | 'Cinema';

export interface Lens {
  id: string;
  name: string;
  type: 'prime' | 'zoom' | 'cine-prime' | 'cine-zoom';
  focal_length: string;
  /** Numeric helpers populated by indexer */
  focal_min?: number;
  focal_max?: number;
  max_aperture: string;
  aperture_value?: number;
  category: LensCategory;
}

export interface LensMount {
  /** sony_e_mount, canon_rf, … */
  key: string;
  mount: string;
  brand: string;
  lenses: Lens[];
}

export interface GenreTemplate {
  key: string;
  name: string;
  description: string;
  template: string;
  defaults: Record<string, string>;
  recommended_lenses: string[];
  /** Hue rotation for genre mood card gradient (0-360) */
  hue?: number;
}

export interface PromptEntry {
  id: string;
  prompt: string;
  metadata: {
    genre: string;
    genre_name?: string;
    camera: string;
    camera_brand: string;
    camera_format?: string;
    lens: string;
    lens_category?: string;
    aperture?: string;
    iso?: string;
    shutter_speed?: string;
    resolution?: string;
    bit_depth?: string;
    aspect_ratio?: string;
    focus_mode?: string;
    generated_at?: string;
  };
}

export interface RawData {
  cameras: Record<string, CameraBrand>;
  lenses: Record<string, LensMount>;
  templates: Record<string, GenreTemplate>;
  prompts: PromptEntry[];
}

export type SettingsKey =
  | 'aperture'
  | 'iso'
  | 'shutterSpeed'
  | 'resolution'
  | 'bitDepth'
  | 'aspectRatio'
  | 'focusMode'
  | 'depthOfField'
  | 'colorProfile'
  | 'lightingStyle'
  | 'highlightTemp'
  | 'shadowTemp'
  | 'colorTone'
  | 'contrastCurve'
  | 'saturation'
  | 'grainSetting'
  | 'dynamicRange'
  | 'magnification'
  | 'negativeInstructions'
  | 'filterStyle'
  | 'skyTreatment'
  | 'interiorExterior'
  | 'perspectiveControl'
  | 'bgType'
  | 'lightingSetup'
  | 'bgBlur'
  | 'processingStyle'
  | 'colorCorrection'
  | 'tracker'
  | 'npf'
  | 'milkyWayColor'
  | 'stabilization'
  | 'filterSimulation'
  | 'monochromeProfile'
  | 'highlightHandling'
  | 'shadowHandling'
  | 'bokehShape';

export type Settings = Partial<Record<SettingsKey, string>>;

export interface MountCompat {
  status: 'native' | 'adapted' | 'incompatible';
  adapter?: string;
  note?: string;
}
