import {
  siBlackmagicdesign,
  siFujifilm,
  siLeica,
  siNikon,
  siPanasonic,
  siRed,
  siSony,
} from 'simple-icons';
import {
  BrandGlyphARRI,
  BrandGlyphCanon,
  BrandGlyphHasselblad,
  BrandGlyphPhaseOne,
} from './brands';

/**
 * Real brand logos via simple-icons (CC0 SVG paths) where available;
 * fallback to our polished custom glyphs for brands not in the set.
 */

interface SiIcon {
  title: string;
  hex: string;
  path: string;
}

const SI_REGISTRY: Record<string, SiIcon> = {
  sony: { title: siSony.title, hex: '#' + siSony.hex, path: siSony.path },
  nikon: { title: siNikon.title, hex: '#' + siNikon.hex, path: siNikon.path },
  fujifilm: { title: siFujifilm.title, hex: '#' + siFujifilm.hex, path: siFujifilm.path },
  panasonic: { title: siPanasonic.title, hex: '#' + siPanasonic.hex, path: siPanasonic.path },
  leica: { title: siLeica.title, hex: '#' + siLeica.hex, path: siLeica.path },
  blackmagic: {
    title: siBlackmagicdesign.title,
    hex: '#' + siBlackmagicdesign.hex,
    path: siBlackmagicdesign.path,
  },
  red: { title: siRed.title, hex: '#' + siRed.hex, path: siRed.path },
};

interface Props {
  brandKey: string;
  size?: number;
  className?: string;
  /** When true, render a tile-friendly chip (rounded background + accent border) */
  chip?: boolean;
}

export function BrandLogo({ brandKey, size = 44, className, chip = true }: Props) {
  const si = SI_REGISTRY[brandKey];
  if (si) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          ...(chip && {
            display: 'grid',
            placeItems: 'center',
            background: `color-mix(in oklch, ${si.hex} 14%, oklch(0.20 0.012 270))`,
            border: `1px solid color-mix(in oklch, ${si.hex} 30%, transparent)`,
            borderRadius: 12,
          }),
        }}
        aria-label={si.title}
        role="img"
      >
        <svg
          viewBox="0 0 24 24"
          width={chip ? Math.round(size * 0.6) : size}
          height={chip ? Math.round(size * 0.6) : size}
          fill={si.hex}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={si.path} />
        </svg>
      </div>
    );
  }

  // Fallback: hand-drawn polished glyph for brands not in simple-icons
  const Glyph =
    brandKey === 'canon'
      ? BrandGlyphCanon
      : brandKey === 'hasselblad'
        ? BrandGlyphHasselblad
        : brandKey === 'phase_one'
          ? BrandGlyphPhaseOne
          : brandKey === 'arri'
            ? BrandGlyphARRI
            : null;

  const accentByKey: Record<string, string> = {
    canon: '#ef4444',
    hasselblad: '#d4d4d8',
    phase_one: '#06b6d4',
    arri: '#d4d4d8',
  };
  const accent = accentByKey[brandKey] ?? '#f5a623';

  if (!Glyph) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          background: 'oklch(0.20 0.012 270)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        ...(chip && {
          display: 'grid',
          placeItems: 'center',
          background: `color-mix(in oklch, ${accent} 12%, oklch(0.20 0.012 270))`,
          border: `1px solid color-mix(in oklch, ${accent} 28%, transparent)`,
          borderRadius: 12,
        }),
      }}
      aria-hidden="true"
    >
      <Glyph size={chip ? Math.round(size * 0.7) : size} />
    </div>
  );
}

export function brandAccent(brandKey: string): string {
  const si = SI_REGISTRY[brandKey];
  if (si) return si.hex;
  const fallback: Record<string, string> = {
    canon: '#ef4444',
    hasselblad: '#d4d4d8',
    phase_one: '#06b6d4',
    arri: '#d4d4d8',
  };
  return fallback[brandKey] ?? '#f5a623';
}
