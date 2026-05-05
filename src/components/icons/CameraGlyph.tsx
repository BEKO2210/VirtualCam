import { useState } from 'react';
import type { CameraModel, SensorFormat } from '@/types';
import { bodyGeometry } from '@/lib/rig-geometry';
import { useCameraImageUrl } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Props {
  camera: CameraModel | null;
  format: SensorFormat | null;
  /** CSS-variable accent color for the body grip and dial highlights. */
  accent?: string;
  className?: string;
  /** Force the procedural rendering even when an image is available. */
  forceProcedural?: boolean;
}

const VIEW_W = 220;
const VIEW_H = 130;

/**
 * Camera mini-render for tile cards.
 *
 * If a Wikimedia product image was downloaded by the CI fetch step
 * (camera-images.json) we render that. Otherwise we fall back to the
 * procedural body silhouette — same engine as the hero rig — so the
 * tile shape still reads at any size.
 */
export function CameraGlyph({ camera, format, accent = 'var(--color-primary)', className, forceProcedural }: Props) {
  const imgUrl = useCameraImageUrl(camera?.id);
  const [imgFailed, setImgFailed] = useState(false);

  if (camera && imgUrl && !imgFailed && !forceProcedural) {
    return (
      <div
        className={cn('relative w-full h-full', className)}
        style={{
          background:
            'radial-gradient(70% 60% at 50% 60%, color-mix(in oklch, white 6%, transparent), transparent 70%)',
        }}
      >
        <img
          src={imgUrl}
          alt={camera.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
        />
      </div>
    );
  }

  // Procedural fallback
  const body = bodyGeometry(camera, format);
  const bodyX = (VIEW_W - body.w) / 2 + 4;
  const bodyY = (VIEW_H - body.h) / 2 + 4;
  const cx = bodyX + body.w * 0.32 + 26;
  const cy = bodyY + body.h / 2;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="cgBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.32 0.012 270)" />
          <stop offset="1" stopColor="oklch(0.16 0.012 270)" />
        </linearGradient>
        <radialGradient id="cgLens" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="oklch(0.55 0.05 240)" />
          <stop offset="0.6" stopColor="oklch(0.18 0.04 240)" />
          <stop offset="1" stopColor="oklch(0.10 0.02 240)" />
        </radialGradient>
      </defs>

      <BodyShape body={body} x={bodyX} y={bodyY} accent={accent} />

      <g>
        <rect x={cx - 16} y={cy - 14} width={28} height={28} rx={3} fill="url(#cgBody)" stroke="oklch(1 0 0 / 0.12)" />
        <circle cx={cx + 4} cy={cy} r={11} fill="url(#cgLens)" stroke="oklch(1 0 0 / 0.18)" />
        <circle cx={cx + 4} cy={cy} r={4} fill="oklch(0.05 0 0)" />
      </g>
    </svg>
  );
}

interface BodyShapeProps {
  body: ReturnType<typeof bodyGeometry>;
  x: number;
  y: number;
  accent: string;
}

function BodyShape({ body, x, y, accent }: BodyShapeProps) {
  const r = 8;
  const right = x + body.w;
  const bottom = y + body.h;
  const humpW = body.silhouette === 'rangefinder' ? 0 : body.silhouette === 'medium-format' ? 28 : 50;
  const humpStartX = x + body.w * 0.32;
  const humpEndX = humpStartX + humpW;
  const humpY = y - body.humpH;

  const d = humpW
    ? `M ${x + r} ${y}
       L ${humpStartX} ${y}
       Q ${humpStartX + humpW * 0.15} ${humpY} ${humpStartX + humpW * 0.35} ${humpY}
       L ${humpEndX - humpW * 0.35} ${humpY}
       Q ${humpEndX - humpW * 0.15} ${humpY} ${humpEndX} ${y}
       L ${right - body.gripW - r} ${y}
       Q ${right - body.gripW} ${y} ${right - body.gripW} ${y + r}
       L ${right - r} ${y + 6}
       Q ${right} ${y + 6} ${right} ${y + 6 + r}
       L ${right} ${bottom - r}
       Q ${right} ${bottom} ${right - r} ${bottom}
       L ${x + r} ${bottom}
       Q ${x} ${bottom} ${x} ${bottom - r}
       L ${x} ${y + r}
       Q ${x} ${y} ${x + r} ${y} Z`
    : `M ${x + r} ${y}
       L ${right - r} ${y}
       Q ${right} ${y} ${right} ${y + r}
       L ${right} ${bottom - r}
       Q ${right} ${bottom} ${right - r} ${bottom}
       L ${x + r} ${bottom}
       Q ${x} ${bottom} ${x} ${bottom - r}
       L ${x} ${y + r}
       Q ${x} ${y} ${x + r} ${y} Z`;

  return (
    <g>
      <ellipse cx={x + body.w / 2} cy={bottom + 6} rx={body.w * 0.42} ry={4} fill="black" opacity="0.4" />
      <path d={d} fill="url(#cgBody)" stroke="oklch(1 0 0 / 0.12)" strokeWidth="1" />
      {humpW > 0 && (
        <rect x={humpStartX + humpW / 2 - 12} y={humpY + 1} width={24} height={4} rx={1} fill="oklch(0.30 0.012 270)" stroke="oklch(1 0 0 / 0.12)" />
      )}
      {body.silhouette !== 'cinema' && (
        <>
          <circle cx={right - body.gripW - 14} cy={y + 6} r={5} fill="oklch(0.42 0.012 270)" stroke={accent} strokeWidth="0.8" opacity="0.9" />
          <circle cx={right - body.gripW - 14} cy={y + 6} r={2} fill={accent} />
        </>
      )}
      <rect x={right - body.gripW + 1} y={y + 10} width={body.gripW - 4} height={body.h - 20} rx={2} fill="oklch(0.13 0.008 270)" stroke="oklch(1 0 0 / 0.08)" />
      <rect x={x + 12} y={bottom - 10} width={body.w * 0.36} height={1.5} rx={1} fill={accent} opacity="0.5" />
    </g>
  );
}
