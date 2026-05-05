CameraPrompt Pro — Complete Rebuild Specification

PROJECT OVERVIEW
Build a React + TypeScript + Tailwind CSS + shadcn/ui web application called "CameraPrompt Pro". It is an interactive modular camera prompt generator for AI image generation tools. The app contains:
- 101 professional camera models across 11 brands
- 489+ lenses across 12 mount systems  
- 21 photography genre templates
- 10,500+ pre-generated prompt combinations
- Interactive prompt builder with live preview
- Searchable prompt browser

TECH STACK (MANDATORY)
- React 19 + TypeScript + Vite
- Tailwind CSS v3.4.19
- shadcn/ui components (40+ pre-installed)
- Lucide React icons
- All data served as static JSON in /public/data/

---

STEP 1: INITIALIZE
Use webapp-building skill. Run:

```bash
bash scripts/init-webapp.sh "CameraPrompt Pro"
cd /mnt/agents/output/app
```

---

STEP 2: DIRECTORY STRUCTURE

```
/mnt/agents/output/app/
├── public/
│   ├── data/
│   │   ├── cameras.json
│   │   ├── lenses.json
│   │   ├── templates.json
│   │   └── 10000_camera_prompts.json
│   └── images/
│       ├── brands/ (11 logos: sony.png, canon.png, nikon.png, fujifilm.png, panasonic.png, leica.png, hasselblad.png, phase_one.png, blackmagic.png, red.png, arri.png)
│       └── cameras/ (product photos per brand)
├── src/
│   ├── context/AppContext.tsx
│   ├── lib/engine.ts
│   ├── components/selectors.tsx
│   ├── types/index.ts
│   ├── App.tsx
│   └── main.tsx
```

---

STEP 3: TYPES (src/types/index.ts)

```typescript
export interface CameraModel {
  name: string;
  sensor: string;
  type: string;
  iso_range: [number, number];
  video: string;
}

export interface CameraBrand {
  brand: string;
  format: string;
  mount: string;
  models: CameraModel[];
}

export interface Lens {
  name: string;
  type: string;
  focal_length: string;
  max_aperture: string;
  category: string;
}

export interface LensMount {
  mount: string;
  brand: string;
  lenses: Lens[];
}

export interface GenreTemplate {
  name: string;
  description: string;
  template: string;
  defaults: Record<string, string>;
  recommended_lenses: string[];
}

export interface AppData {
  rawData: {
    cameras: Record<string, CameraBrand>;
    lenses: Record<string, LensMount>;
    templates: Record<string, GenreTemplate>;
  } | null;
  brand: string;
  camera: CameraModel | null;
  lens: Lens | null;
  genre: string;
  settings: Record<string, string>;
}
```

---

STEP 4: DATA FILES

The cameras.json, lenses.json, templates.json, and 10000_camera_prompts.json must be placed in /public/data/. Their exact contents are available in the source project files. Key structures:

cameras.json: 11 brand keys (sony, canon, nikon, fujifilm, panasonic, leica, hasselblad, phase_one, blackmagic, red, arri). Each has brand name, format, mount, and 5-12 models with name, sensor, type, iso_range [min, max], video.

lenses.json: 12 mount keys (sony_e_mount: 73 lenses, canon_rf: 58 lenses, nikon_z: 54 lenses, fujifilm_x: 46 lenses, fujifilm_g: 15 lenses, panasonic_l: 55 lenses, hasselblad_xcd: 14 lenses, mft: 46 lenses, ef_mount: 53 lenses, f_mount: 53 lenses, pl_mount: 67 cinema lenses). Each lens has name, type, focal_length, max_aperture, category.

templates.json: 21 genre keys. Each has name, description, template (string with {placeholders}), defaults (Record<string,string>), and recommended_lenses (string[]). Genres: portrait, landscape, street, macro, wildlife, architecture, astrophotography, sports_action, product, wedding, food, fashion_editorial, documentary, black_white, underwater, drone_aerial, automotive, concert_event, real_estate, night_city, newborn_baby.

10000_camera_prompts.json: Contains metadata object and prompts array with 10,500+ entries. Each entry: id, prompt (full text), metadata (genre, genre_name, camera, camera_brand, camera_format, lens, lens_category, aperture, iso, shutter_speed, resolution, bit_depth, aspect_ratio, focus_mode, generated_at).

---

STEP 5: ENGINE (src/lib/engine.ts)

```typescript
import type { Lens } from '@/types';

export const mountCompatibility: Record<string, string[]> = {
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

export interface LensEntry { lenses: Lens[]; }
export interface LensMap { [key: string]: LensEntry; }

export function getCompatibleLenses(brandKey: string, rawData: { lenses: LensMap } | null): Lens[] {
  if (!rawData) return [];
  const mounts = mountCompatibility[brandKey] || [];
  const compatible: Lens[] = [];
  for (const mount of mounts) {
    if (rawData.lenses[mount]) compatible.push(...rawData.lenses[mount].lenses);
  }
  return compatible;
}

export function getApertureForLens(maxAperture: string, bias: number = 0.5): string {
  if (maxAperture.includes('T/')) {
    const tVal = parseFloat(maxAperture.replace('T/', ''));
    const options = [ `T/${tVal.toFixed(1)}`, `T/${(tVal + 0.3).toFixed(1)}`, `T/${(tVal + 0.7).toFixed(1)}`, `T/${(tVal + 1.0).toFixed(1)}` ];
    return Math.random() < bias ? options[0] : options[Math.floor(Math.random() * options.length)];
  }
  if (!maxAperture.includes('f/')) return 'f/2.8';
  const fPart = maxAperture.split('-')[0];
  let fVal = parseFloat(fPart.replace('f/', '').replace(',', '.')) || 2.8;
  let options: number[];
  if (fVal <= 1.4) options = [fVal, fVal + 0.3, fVal + 0.7, fVal + 1.0, fVal + 1.7, fVal + 2.3];
  else if (fVal <= 2.8) options = [fVal, fVal + 0.7, fVal + 1.4, fVal + 2.1, fVal + 2.8, fVal + 4.0];
  else options = [fVal, fVal + 1.0, fVal + 2.0, fVal + 3.0, fVal + 4.0, fVal + 5.0];
  options = options.map(o => Math.max(1.0, Math.min(22, o)));
  if (Math.random() < bias) return `f/${options[0].toFixed(1)}`.replace('.0', '');
  const pick = options[Math.floor(Math.random() * options.length)];
  return `f/${pick.toFixed(1)}`.replace('.0', '');
}

export function formatIso(isoVal: number | string): string {
  const val = typeof isoVal === 'string' ? parseInt(isoVal) || 100 : isoVal;
  return val >= 1000 ? val.toLocaleString('de-DE') : String(val);
}

export interface CameraModel { name: string; sensor: string; type: string; iso_range: [number, number]; video: string; }
export interface GenreDefaults { template: string; defaults: Record<string, string>; }
export interface GenreMap { [key: string]: GenreDefaults; }
export interface CameraMap { [key: string]: { brand: string; format: string; models: CameraModel[] }; }

export function generatePromptText(data: {
  camera: CameraModel | null; lens: Lens | null; genre: string;
  rawData: { templates: GenreMap } | null; brand: string; settings: Record<string, string>;
}): string {
  if (!data.camera || !data.lens || !data.genre || !data.rawData) return '';
  const template = data.rawData.templates[data.genre];
  if (!template) return '';
  const defaults = template.defaults || {};
  const brandData = data.rawData as any;
  const cameraFormat = brandData.cameras?.[data.brand]?.format || 'Full-Frame';
  const s = data.settings;
  const variables: Record<string, string> = {
    camera: data.camera.name, lens: data.lens.name,
    aperture: s.aperture || defaults.aperture || 'f/2.8',
    iso: s.iso || formatIso(defaults.iso || '100'),
    shutter_speed: s.shutterSpeed || defaults.shutter_speed || '1/125s',
    format: cameraFormat, resolution: s.resolution || '4K',
    bit_depth: s.bitDepth || '10-bit', aspect_ratio: s.aspectRatio || '3:2',
    focus_mode: s.focusMode || 'single-point AF',
    depth_of_field: s.depthOfField || defaults.depth_of_field || 'professional',
    color_profile: s.colorProfile || defaults.color_profile || 'neutral',
    lighting_style: s.lightingStyle || defaults.lighting_style || 'natural',
    highlight_temp: s.highlightTemp || defaults.highlight_temp || 'warm',
    shadow_temp: s.shadowTemp || defaults.shadow_temp || 'cool',
    color_tone: s.colorTone || defaults.color_tone || 'neutral',
    contrast_curve: s.contrastCurve || defaults.contrast_curve || 'natural',
    saturation: s.saturation || defaults.saturation || 'natural',
    grain_setting: s.grainSetting || defaults.grain_setting || 'subtle film grain',
    dynamic_range: s.dynamicRange || defaults.dynamic_range || '14',
    magnification: s.magnification || defaults.magnification || 'standard',
    negative_instructions: s.negativeInstructions || defaults.negative_instructions || 'No artificial effects.',
    filter_style: s.filterStyle || defaults.filter_style || '',
    sky_treatment: s.skyTreatment || defaults.sky_treatment || '',
    interior_exterior: s.interiorExterior || defaults.interior_exterior || '',
    perspective_control: s.perspectiveControl || defaults.perspective_control || '',
    bg_type: s.bgType || defaults.bg_type || '',
    lighting_setup: s.lightingSetup || defaults.lighting_setup || '',
    bg_blur: s.bgBlur || defaults.bg_blur || '',
    processing_style: s.processingStyle || defaults.processing_style || '',
    color_correction: s.colorCorrection || defaults.color_correction || '',
    tracker: s.tracker || defaults.tracker || '',
    npf: s.npf || defaults.npf || '',
    milky_way_color: s.milkyWayColor || defaults.milky_way_color || '',
    stabilization: s.stabilization || defaults.stabilization || '',
    filter_simulation: s.filterSimulation || defaults.filter_simulation || '',
    monochrome_profile: s.monochromeProfile || defaults.monochrome_profile || '',
    highlight_handling: s.highlightHandling || defaults.highlight_handling || '',
    shadow_handling: s.shadowHandling || defaults.shadow_handling || '',
    bokeh_shape: s.bokehShape || defaults.bokeh_shape || '',
  };
  let prompt = template.template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\{${key}\}`, 'g'), value);
  }
  const lines = prompt.split('\n');
  const cleaned: string[] = [];
  for (const line of lines) {
    const stripped = line.trim();
    if (stripped.endsWith(': .') || stripped.endsWith(':  .') || (stripped.endsWith(':') && stripped.length < 40)) continue;
    cleaned.push(line);
  }
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
```

---

STEP 6: CONTEXT (src/context/AppContext.tsx)

Create React context that:
1. Loads all 3 JSON files on mount via fetch
2. Stores: rawData, brand (string), camera (CameraModel | null), lens (Lens | null), genre (string), settings (Record<string, string>)
3. Exports: setBrand, setCamera, setLens, setGenre, setSettings (merges partial), generate (calls generatePromptText), randomize (picks random brand/camera/lens/genre), loading (boolean)
4. When setLens is called, auto-compute aperture using getApertureForLens with genre bias
5. When setGenre is called, auto-populate all settings from template defaults
6. Default settings object must have all 35+ keys initialized to empty strings

---

STEP 7: COMPONENTS (src/components/selectors.tsx)

Export these 6 components using shadcn/ui (Card, CardContent, Badge, Input, Button, Alert, AlertTitle, AlertDescription) and Lucide icons:

1. BrandSelector: Grid of 11 brand cards. Each shows `/images/brands/{key}.png` logo + brand name. Clicking calls setBrand(). Active brand gets ring-2 ring-primary bg-primary/10.

2. CameraSelector: Shows brand header with logo + format + mount. Grid of all models for selected brand. Each card shows camera image `/images/cameras/{brand}.png`, name, sensor, type badge, ISO range badge, video badge. Clicking calls setCamera(). Active gets ring styling.

3. LensSelector: Groups compatible lenses by category (Ultra-Wide, Wide, Standard, Portrait, Telephoto, Macro, Cinema). Each lens card shows Aperture icon, name, focal_length, max_aperture. Clicking calls setLens(). Active gets ring styling.

4. GenreSelector: Grid of 21 genre cards. Each shows name, description, and up to 3 recommended lens badges. Clicking calls setGenre(). Active gets ring styling.

5. SettingsPanel: Two-column card layout. Left: Technische Einstellungen — inputs for aperture, iso, shutterSpeed, resolution, colorProfile (each with template default as placeholder). Right: Licht & Look — inputs for lightingStyle, highlightTemp, shadowTemp, colorTone (each with template default as placeholder). All inputs call setSettings({key: value}) on change.

6. PromptOutput: Shows copy button (with Check/Copy icons and "Kopiert!" state), download button (saves as .txt file). Displays generated prompt in a Card with preformatted text. Shows alert if not all selections made.

7. PromptBrowser: Searchable browser for 10000_camera_prompts.json. Has search input with Search icon, genre dropdown filter. Shows count "Zeige X von Y Prompts". Displays up to 50 matching prompts as cards with genre badge, camera, lens, and Copy button. Lazy load or paginate.

---

STEP 8: APP LAYOUT (src/App.tsx)

Structure:
1. Header (sticky, z-50): App title "CameraPrompt Pro" with Sparkles icon + subtitle "10.000+ Modulare Kamera-Setup Prompts". Right side: "Zufälliges Setup" button with Dices icon. Below title row: summary badge bar showing currently selected Marke, Kamera, Objektiv, Genre (or "—" if not selected).

2. Tabs (2 tabs):
   - Tab "Prompt Builder" (SlidersHorizontal icon): Shows the 6-step wizard as stacked cards:
     1. Marke wählen (numbered circle "1")
     2. Kamera wählen (only if brand selected)
     3. Objektiv wählen (only if camera selected)
     4. Genre wählen (only if lens selected)
     5. Technische Einstellungen (only if genre selected)
     6. Generierter Prompt (border-primary card, only if all selected)
   - Tab "10K+ Prompts" (FileText icon): Shows PromptBrowser component

3. Footer: Centered text "CameraPrompt Pro · 101 Kameras · 489+ Objektive · 21 Genres · 10.500+ Prompts"

Loading state: Show centered spinner with "Lade Kamera-Datenbank..." and stats.

---

STEP 9: ASSETS

Search and download brand logos for: sony, canon, nikon, fujifilm, panasonic, leica, hasselblad, phase_one, blackmagic, red, arri. Save as /public/images/brands/{key}.png.

Search and download camera product photos (at least one representative per brand). Save as /public/images/cameras/{key}.png.

---

STEP 10: BUILD & DEPLOY

```bash
cd /mnt/agents/output/app && npm run build
```

Deploy the dist/ folder using the deploy_website tool.

---

KEY BEHAVIORS TO PRESERVE

1. Progressive disclosure: Steps 2-6 only appear after previous step is completed
2. Auto-populate defaults: When genre or lens is selected, all settings auto-fill from template defaults
3. Smart aperture: getApertureForLens considers lens max aperture AND genre preference bias
4. Live prompt generation: Any settings change immediately regenerates the prompt
5. Copy/Download: One-click copy to clipboard, one-click .txt download
6. 10K browser: Search across all pre-generated prompts, filter by genre, copy individual prompts
7. Randomize: Single button generates complete random setup across all dimensions
8. German UI: All labels, buttons, and helper text in German
9. Responsive: Grid columns adapt: 2 on mobile, 3 on md, 4 on lg, 6 on xl for brands

---

EXAMPLE PROMPT TEMPLATE VARIABLES

The portrait template uses these placeholders:
{camera}, {lens}, {aperture}, {iso}, {shutter_speed}, {depth_of_field}, {color_profile}, {lighting_style}, {highlight_temp}, {shadow_temp}, {color_tone}, {contrast_curve}, {saturation}, {grain_setting}, {resolution}, {bit_depth}, {aspect_ratio}, {negative_instructions}, {format}

All 21 templates follow this pattern but with genre-specific language, defaults, and negative instructions.
