import type { ReactElement, SVGProps } from 'react';

/**
 * Distinctive (non-trademark) brand glyphs. Each brand gets a unique
 * geometric mark inspired by its identity but not copying its logo.
 * Drawn into a 64×64 viewBox so they scale crisp at any tile size.
 */

interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number;
}

const Frame = ({
  size = 64,
  children,
  className,
  ...rest
}: GlyphProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    role="img"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const BrandGlyphSony = (p: GlyphProps) => (
  <Frame {...p}>
    <defs>
      <linearGradient id="sg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#f5a623" />
        <stop offset="1" stopColor="#e85d04" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="22" fill="none" stroke="url(#sg)" strokeWidth="2.4" />
    <path
      d="M32 12 L32 22 M52 32 L42 32 M32 52 L32 42 M12 32 L22 32"
      stroke="url(#sg)"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="32" cy="32" r="4" fill="url(#sg)" />
  </Frame>
);

export const BrandGlyphCanon = (p: GlyphProps) => (
  <Frame {...p}>
    <circle cx="32" cy="32" r="22" fill="none" stroke="#ef4444" strokeWidth="3" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ef4444" strokeWidth="1.6" opacity="0.6" />
    <rect x="22" y="11" width="20" height="6" rx="2" fill="#ef4444" />
  </Frame>
);

export const BrandGlyphNikon = (p: GlyphProps) => (
  <Frame {...p}>
    <rect x="8" y="8" width="48" height="48" rx="10" fill="none" stroke="#f6c34a" strokeWidth="2.4" />
    <path
      d="M19 44 L19 20 L45 44 L45 20"
      fill="none"
      stroke="#f6c34a"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Frame>
);

export const BrandGlyphFujifilm = (p: GlyphProps) => (
  <Frame {...p}>
    <rect x="8" y="8" width="48" height="48" rx="6" fill="none" stroke="#22c55e" strokeWidth="2" />
    <path
      d="M16 16 L48 48 M48 16 L16 48"
      stroke="#22c55e"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="32" cy="32" r="5" fill="#0a0a0c" stroke="#22c55e" strokeWidth="2" />
  </Frame>
);

export const BrandGlyphPanasonic = (p: GlyphProps) => (
  <Frame {...p}>
    <rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <path
      d="M14 50 L32 14 L50 50 Z"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="40" r="3.5" fill="#3b82f6" />
  </Frame>
);

export const BrandGlyphLeica = (p: GlyphProps) => (
  <Frame {...p}>
    <circle cx="32" cy="32" r="24" fill="#0a0a0c" stroke="#ef4444" strokeWidth="2.4" />
    <circle cx="32" cy="32" r="10" fill="#ef4444" />
    <text
      x="32"
      y="36"
      textAnchor="middle"
      fontFamily="ui-monospace,monospace"
      fontSize="9"
      fontWeight="700"
      fill="#0a0a0c"
    >
      M
    </text>
  </Frame>
);

export const BrandGlyphHasselblad = (p: GlyphProps) => (
  <Frame {...p}>
    <rect x="6" y="14" width="52" height="36" rx="3" fill="none" stroke="#d4d4d8" strokeWidth="2.2" />
    <path
      d="M22 22 L22 42 M22 32 L42 32 M42 22 L42 42"
      stroke="#d4d4d8"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path d="M28 6 L36 6 L34 12 L30 12 Z" fill="#d4d4d8" opacity="0.7" />
  </Frame>
);

export const BrandGlyphPhaseOne = (p: GlyphProps) => (
  <Frame {...p}>
    <path
      d="M32 6 L58 32 L32 58 L6 32 Z"
      fill="none"
      stroke="#06b6d4"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path
      d="M32 16 L48 32 L32 48 L16 32 Z"
      fill="none"
      stroke="#06b6d4"
      strokeWidth="1.4"
      opacity="0.6"
    />
    <circle cx="32" cy="32" r="5" fill="#06b6d4" />
  </Frame>
);

export const BrandGlyphBlackmagic = (p: GlyphProps) => (
  <Frame {...p}>
    <path
      d="M22 8 L42 8 L56 22 L56 42 L42 56 L22 56 L8 42 L8 22 Z"
      fill="none"
      stroke="#f97316"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="32" r="9" fill="#f97316" />
  </Frame>
);

export const BrandGlyphRED = (p: GlyphProps) => (
  <Frame {...p}>
    <rect x="8" y="22" width="48" height="20" rx="4" fill="#ef4444" />
    <circle cx="20" cy="32" r="6" fill="#0a0a0c" />
    <circle cx="44" cy="32" r="6" fill="#0a0a0c" />
    <text
      x="32"
      y="36"
      textAnchor="middle"
      fontFamily="ui-monospace,monospace"
      fontSize="10"
      fontWeight="800"
      fill="#0a0a0c"
    >
      R
    </text>
  </Frame>
);

export const BrandGlyphARRI = (p: GlyphProps) => (
  <Frame {...p}>
    <rect x="10" y="14" width="44" height="36" rx="3" fill="none" stroke="#d4d4d8" strokeWidth="2.4" />
    <path
      d="M16 50 L24 22 L32 50 M22 40 L26 40"
      fill="none"
      stroke="#d4d4d8"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M36 50 L36 22 L48 22 L48 38 L36 38"
      fill="none"
      stroke="#d4d4d8"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Frame>
);

const REGISTRY: Record<string, (p: GlyphProps) => ReactElement> = {
  sony: BrandGlyphSony,
  canon: BrandGlyphCanon,
  nikon: BrandGlyphNikon,
  fujifilm: BrandGlyphFujifilm,
  panasonic: BrandGlyphPanasonic,
  leica: BrandGlyphLeica,
  hasselblad: BrandGlyphHasselblad,
  phase_one: BrandGlyphPhaseOne,
  blackmagic: BrandGlyphBlackmagic,
  red: BrandGlyphRED,
  arri: BrandGlyphARRI,
};

export function BrandGlyph({ brandKey, ...rest }: GlyphProps & { brandKey: string }) {
  const C = REGISTRY[brandKey];
  if (!C) {
    return (
      <Frame {...rest}>
        <rect x="6" y="6" width="52" height="52" rx="10" fill="none" stroke="currentColor" strokeWidth="2" />
      </Frame>
    );
  }
  return <C {...rest} />;
}
