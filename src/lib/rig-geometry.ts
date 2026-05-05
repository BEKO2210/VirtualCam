import type { CameraModel, Lens, SensorFormat } from '@/types';

/**
 * Pure functions that translate camera + lens data into SVG geometry
 * for the procedural rig.
 */

export const formatWidth: Record<SensorFormat, number> = {
  'Micro Four Thirds': 130,
  'APS-C': 150,
  'Full-Frame': 170,
  'Super 35': 175,
  'Medium Format': 195,
  'Large Format': 210,
};

export interface BodyGeometry {
  /** Total body width (px in viewBox) */
  w: number;
  /** Body height */
  h: number;
  /** Grip width on the right */
  gripW: number;
  /** Top hump (mirrorless = small, dslr = pronounced) */
  humpH: number;
  /** Body silhouette type */
  silhouette: 'mirrorless' | 'dslr' | 'medium-format' | 'cinema' | 'rangefinder';
}

export function bodyGeometry(camera: CameraModel | null, format: SensorFormat | null): BodyGeometry {
  const fmt = format ?? 'Full-Frame';
  const w = formatWidth[fmt] ?? 170;
  const silhouette: BodyGeometry['silhouette'] = camera?.type ?? 'mirrorless';
  const baseH =
    silhouette === 'cinema' ? 130 :
    silhouette === 'medium-format' ? 130 :
    silhouette === 'dslr' ? 110 :
    silhouette === 'rangefinder' ? 88 :
    100; // mirrorless
  return {
    w,
    h: baseH,
    gripW: silhouette === 'rangefinder' ? 12 : silhouette === 'cinema' ? 30 : 22,
    humpH: silhouette === 'dslr' ? 24 : silhouette === 'medium-format' ? 16 : silhouette === 'rangefinder' ? 6 : 12,
    silhouette,
  };
}

export interface LensGeometry {
  /** Lens length along the optical axis */
  length: number;
  /** Front element diameter */
  diameter: number;
  /** Rear element diameter (mount-side) */
  rearDiameter: number;
  /** Number of barrel rings */
  rings: number;
  /** Hood (sun shade) length */
  hood: number;
  /** Type-specific style */
  isCinema: boolean;
  isPrime: boolean;
}

export function lensGeometry(lens: Lens | null): LensGeometry {
  if (!lens) {
    return { length: 70, diameter: 60, rearDiameter: 54, rings: 1, hood: 0, isCinema: false, isPrime: true };
  }
  const focals = parseFocalRange(lens.focal_length);
  const longest = Math.max(...focals);
  const aperture = lens.aperture_value ?? parseAperture(lens.max_aperture);

  // Length: log scale so 600mm doesn't break the layout.
  const length = Math.round(40 + 90 * Math.log10(1 + longest / 12));
  // Diameter: faster aperture → fatter glass.
  const diameter = Math.round(50 + Math.max(0, 4.0 - aperture) * 12 + (focals[1] - focals[0]) / 6);
  const rearDiameter = Math.round(diameter * 0.85);
  const isCinema = lens.type.startsWith('cine');
  const isPrime = lens.type === 'prime' || lens.type === 'cine-prime';
  const rings = isCinema ? 4 : isPrime ? 2 : 3;
  const hood = isCinema ? 18 : longest > 100 ? 22 : 8;
  return { length, diameter, rearDiameter, rings, hood, isCinema, isPrime };
}

export function parseFocalRange(focal: string): [number, number] {
  // Examples: "85mm", "24-70mm", "100-400mm"
  const nums = focal.replace(/mm/gi, '').split(/[-–]/).map((s) => parseFloat(s.trim())).filter(Number.isFinite);
  if (nums.length === 0) return [50, 50];
  if (nums.length === 1) return [nums[0], nums[0]];
  return [nums[0], nums[1]];
}

export function parseAperture(a: string): number {
  if (!a) return 2.8;
  if (a.startsWith('T/')) return parseFloat(a.slice(2)) || 2.8;
  const part = a.split(/[-–]/)[0];
  return parseFloat(part.replace('f/', '').replace(',', '.')) || 2.8;
}
