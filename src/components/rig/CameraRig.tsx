import { motion, AnimatePresence } from 'motion/react';
import { Camera as CameraIcon, AlertTriangle, ShieldCheck, Plug } from 'lucide-react';
import type { CameraModel, Lens, MountCompat, SensorFormat } from '@/types';
import { mountColorVar } from '@/lib/engine';
import { bodyGeometry, lensGeometry, parseFocalRange } from '@/lib/rig-geometry';
import { Badge } from '@/components/ui/badge';

interface CameraRigProps {
  brand: { brand: string; format: SensorFormat; mount: string } | null;
  camera: CameraModel | null;
  lens: Lens | null;
  lensMountKey: string | null;
  compat: MountCompat | null;
}

const VIEW_W = 600;
const VIEW_H = 280;

export function CameraRig({ brand, camera, lens, lensMountKey, compat }: CameraRigProps) {
  const fmt = brand?.format ?? 'Full-Frame';
  const body = bodyGeometry(camera, fmt);
  const ls = lensGeometry(lens);

  // Mount glow color (drives the rim around the bayonet)
  const compatStatus = compat?.status ?? 'native';
  const isAdapted = compatStatus === 'adapted';
  const isIncompat = compatStatus === 'incompatible';
  const mountColor = lensMountKey ? mountColorVar[lensMountKey] : 'var(--color-mount-e)';

  // Layout positions
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2 + 6;
  const bodyX = cx - body.w / 2 + 28; // shifted right so the lens fits to its left
  const bodyY = cy - body.h / 2;

  // Lens sits flush against the left of the body
  const lensRearX = bodyX;
  const lensRearY = cy - ls.rearDiameter / 2;
  const lensFrontX = lensRearX - ls.length;

  return (
    <div className="relative w-full">
      <div className="relative aspect-[600/280] w-full overflow-hidden rounded-[var(--radius-lg)] glass-strong grid-paper">
        {/* Subtle ambient light */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 60%, color-mix(in oklch, var(--color-primary) 8%, transparent), transparent 70%)',
          }}
        />

        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="absolute inset-0 h-full w-full"
          aria-label={camera ? `Camera rig: ${camera.name} with ${lens?.name ?? 'no lens'}` : 'Empty rig'}
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="oklch(0.30 0.012 270)" />
              <stop offset="1" stopColor="oklch(0.16 0.012 270)" />
            </linearGradient>
            <linearGradient id="lensGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="oklch(0.22 0.014 270)" />
              <stop offset="0.5" stopColor="oklch(0.32 0.014 270)" />
              <stop offset="1" stopColor="oklch(0.20 0.014 270)" />
            </linearGradient>
            <radialGradient id="frontGlass" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="oklch(0.55 0.05 240)" />
              <stop offset="0.5" stopColor="oklch(0.18 0.04 240)" />
              <stop offset="1" stopColor="oklch(0.10 0.02 240)" />
            </radialGradient>
            <filter id="mountGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="warnGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ─── Body ─── */}
          <motion.g
            initial={false}
            animate={{ opacity: camera ? 1 : 0.35 }}
            transition={{ duration: 0.35 }}
          >
            <BodySilhouette
              x={bodyX}
              y={bodyY}
              w={body.w}
              h={body.h}
              gripW={body.gripW}
              humpH={body.humpH}
              type={body.silhouette}
            />
          </motion.g>

          {/* ─── Lens (snaps to body) ─── */}
          <AnimatePresence>
            {lens && (
              <motion.g
                key={lens.id}
                initial={{ x: -120, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              >
                <LensSilhouette
                  rearX={lensRearX}
                  rearY={lensRearY}
                  length={ls.length}
                  diameter={ls.diameter}
                  rearDiameter={ls.rearDiameter}
                  rings={ls.rings}
                  hood={ls.hood}
                  isCinema={ls.isCinema}
                  centerY={cy}
                  frontX={lensFrontX}
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ─── Mount ring (color-coded, pulses on adapter) ─── */}
          {camera && (
            <motion.circle
              cx={bodyX}
              cy={cy}
              r={ls.rearDiameter / 2 + 4}
              fill="none"
              stroke={isIncompat ? 'var(--color-warn)' : mountColor}
              strokeWidth={isAdapted || isIncompat ? 3 : 2}
              filter="url(#mountGlow)"
              animate={{
                opacity: isAdapted || isIncompat ? [0.55, 1, 0.55] : 0.85,
              }}
              transition={{ duration: 1.6, repeat: isAdapted || isIncompat ? Infinity : 0 }}
            />
          )}

          {/* Optical axis line */}
          {lens && (
            <line
              x1={lensFrontX - 16}
              y1={cy}
              x2={bodyX}
              y2={cy}
              stroke="oklch(1 0 0 / 0.08)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          )}

          {/* Sensor diagonal indicator (data tag) */}
          {camera && (
            <g transform={`translate(${bodyX + body.w - 96}, ${bodyY + body.h - 20})`}>
              <rect width="92" height="18" rx="9" fill="oklch(1 0 0 / 0.06)" stroke="oklch(1 0 0 / 0.08)" />
              <text
                x="46"
                y="12"
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="oklch(1 0 0 / 0.7)"
                letterSpacing="0.04em"
              >
                {fmt.toUpperCase()}
              </text>
            </g>
          )}
        </svg>

        {/* ─── Compat overlay ─── */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {brand && (
            <Badge variant="outline" className="bg-black/30 backdrop-blur">
              <CameraIcon className="size-3" />
              {brand.brand}
            </Badge>
          )}
          {camera && (
            <Badge variant="default" className="bg-black/30 backdrop-blur normal-case tracking-normal text-xs">
              {camera.name}
            </Badge>
          )}
        </div>

        {/* Mount-compat badge bottom-left */}
        <div className="absolute left-3 bottom-3 flex flex-wrap gap-2 max-w-[80%]">
          {lens && compat && (
            <Badge
              variant={
                compat.status === 'native' ? 'success' : compat.status === 'adapted' ? 'warn' : 'danger'
              }
              className="backdrop-blur"
            >
              {compat.status === 'native' ? (
                <ShieldCheck className="size-3" />
              ) : compat.status === 'adapted' ? (
                <Plug className="size-3" />
              ) : (
                <AlertTriangle className="size-3" />
              )}
              {compat.status === 'native'
                ? 'Native Mount'
                : compat.status === 'adapted'
                  ? `Adapter: ${compat.adapter ?? 'required'}`
                  : 'Mount mismatch'}
            </Badge>
          )}
          {lens && (
            <Badge variant="outline" className="bg-black/30 backdrop-blur normal-case">
              {lens.name}
            </Badge>
          )}
        </div>

        {!camera && !lens && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center text-foreground/50 text-sm">
              <CameraIcon className="size-8 mx-auto mb-2 opacity-50" />
              Wähle eine Marke und ein Modell, um das Rig zu konfigurieren.
            </div>
          </div>
        )}

        {/* Spec strip */}
        {camera && (
          <div className="absolute right-3 top-3 max-w-[55%]">
            <div className="rounded-md bg-black/30 backdrop-blur border border-white/5 px-3 py-2 text-[11px] font-mono text-foreground/70 leading-relaxed">
              <div>{camera.sensor}</div>
              <div className="opacity-70">
                ISO {camera.iso_range[0]}–{camera.iso_range[1].toLocaleString()}
              </div>
              {lens && (
                <div className="opacity-70">
                  {lens.focal_length} · {lens.max_aperture}
                  {(() => {
                    const fr = parseFocalRange(lens.focal_length);
                    const fov = Math.round(2 * Math.atan(36 / (2 * fr[0])) * (180 / Math.PI));
                    return ` · ${fov}° FOV`;
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Body silhouettes
 * ────────────────────────────────────────────────────────────── */

interface BodyProps {
  x: number;
  y: number;
  w: number;
  h: number;
  gripW: number;
  humpH: number;
  type: 'mirrorless' | 'dslr' | 'medium-format' | 'cinema' | 'rangefinder';
}

function BodySilhouette({ x, y, w, h, gripW, humpH, type }: BodyProps) {
  // Build a rounded path with hump
  const r = 10;
  const right = x + w;
  const bottom = y + h;
  const humpW = type === 'rangefinder' ? 0 : type === 'medium-format' ? 36 : 60;
  const humpStartX = x + w * 0.32;
  const humpEndX = humpStartX + humpW;
  const humpY = y - humpH;

  const d = humpW
    ? `M ${x + r} ${y}
       L ${humpStartX} ${y}
       Q ${humpStartX + humpW * 0.15} ${humpY} ${humpStartX + humpW * 0.35} ${humpY}
       L ${humpEndX - humpW * 0.35} ${humpY}
       Q ${humpEndX - humpW * 0.15} ${humpY} ${humpEndX} ${y}
       L ${right - gripW - r} ${y}
       Q ${right - gripW} ${y} ${right - gripW} ${y + r}
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
      {/* Body shadow */}
      <ellipse
        cx={x + w / 2}
        cy={bottom + 10}
        rx={w * 0.45}
        ry={6}
        fill="black"
        opacity="0.45"
      />
      <path d={d} fill="url(#bodyGrad)" stroke="oklch(1 0 0 / 0.12)" strokeWidth="1" />

      {/* Top dial (PASM/ISO) */}
      {type !== 'cinema' && (
        <>
          <circle cx={right - gripW - 18} cy={y + 8} r={6} fill="oklch(0.42 0.012 270)" stroke="oklch(1 0 0 / 0.1)" />
          <circle cx={right - gripW - 18} cy={y + 8} r={2.5} fill="oklch(0.55 0.012 270)" />
        </>
      )}

      {/* Hot shoe */}
      {humpW > 0 && (
        <rect
          x={(x + (x + w * 0.32) + humpW * 0.4) / 2 - 18}
          y={humpY + 2}
          width={36}
          height={6}
          rx={1}
          fill="oklch(0.30 0.012 270)"
          stroke="oklch(1 0 0 / 0.12)"
        />
      )}

      {/* Grip texture stripe */}
      <rect
        x={right - gripW + 2}
        y={y + 14}
        width={gripW - 6}
        height={h - 28}
        rx={3}
        fill="oklch(0.13 0.008 270)"
        stroke="oklch(1 0 0 / 0.08)"
      />

      {/* Cinema rosette (only for cinema bodies) */}
      {type === 'cinema' && (
        <circle cx={right - gripW / 2} cy={y + h / 2} r={5} fill="none" stroke="oklch(1 0 0 / 0.18)" strokeDasharray="1 2" />
      )}

      {/* Brand strip */}
      <rect
        x={x + 16}
        y={bottom - 14}
        width={w * 0.42}
        height={2}
        rx={1}
        fill="oklch(1 0 0 / 0.08)"
      />
    </g>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Lens silhouette
 * ────────────────────────────────────────────────────────────── */

interface LensProps {
  rearX: number;
  rearY: number;
  frontX: number;
  length: number;
  diameter: number;
  rearDiameter: number;
  rings: number;
  hood: number;
  isCinema: boolean;
  centerY: number;
}

function LensSilhouette({
  rearX,
  frontX,
  length,
  diameter,
  rearDiameter,
  rings,
  hood,
  isCinema,
  centerY,
}: LensProps) {
  const top = centerY - diameter / 2;
  const rearTop = centerY - rearDiameter / 2;
  const totalLength = length - hood;

  // Trapezoid path from front (large) → rear (small)
  const barrelX1 = frontX + hood;
  const barrelX2 = rearX;
  const path = `M ${barrelX1} ${top}
                L ${barrelX2} ${rearTop}
                L ${barrelX2} ${rearTop + rearDiameter}
                L ${barrelX1} ${top + diameter}
                Z`;

  // Hood
  const hoodPath = hood > 0
    ? `M ${frontX} ${centerY - diameter / 2 - 4}
       L ${frontX + hood} ${centerY - diameter / 2}
       L ${frontX + hood} ${centerY + diameter / 2}
       L ${frontX} ${centerY + diameter / 2 + 4}
       Z`
    : '';

  // Aperture/focus rings
  const ringSpan = totalLength * 0.7;
  const ringStart = barrelX1 + (totalLength - ringSpan) / 2;
  const ringStep = ringSpan / Math.max(1, rings - 1);

  return (
    <g>
      {/* Lens shadow */}
      <ellipse cx={(frontX + rearX) / 2} cy={centerY + diameter / 2 + 8} rx={length * 0.45} ry={5} fill="black" opacity="0.35" />

      {/* Hood */}
      {hoodPath && <path d={hoodPath} fill={isCinema ? 'oklch(0.18 0.005 270)' : 'oklch(0.14 0.008 270)'} stroke="oklch(1 0 0 / 0.1)" />}

      {/* Barrel */}
      <path d={path} fill="url(#lensGrad)" stroke="oklch(1 0 0 / 0.12)" />

      {/* Rings */}
      {Array.from({ length: rings }).map((_, i) => {
        const x = ringStart + i * ringStep;
        const lerp = (x - barrelX1) / Math.max(1, totalLength);
        const yTopLerp = top + (rearTop - top) * lerp;
        const yBotLerp = top + diameter + ((rearTop + rearDiameter) - (top + diameter)) * lerp;
        return (
          <line
            key={i}
            x1={x}
            y1={yTopLerp - 2}
            x2={x}
            y2={yBotLerp + 2}
            stroke="oklch(1 0 0 / 0.18)"
            strokeWidth={isCinema ? 2 : 1.4}
          />
        );
      })}

      {/* Front element */}
      <ellipse
        cx={frontX + hood + 2}
        cy={centerY}
        rx={Math.max(4, diameter * 0.18)}
        ry={diameter / 2 - 6}
        fill="url(#frontGlass)"
        stroke="oklch(1 0 0 / 0.18)"
      />

      {/* Tiny mount marker on the rear */}
      <circle cx={rearX - 1} cy={centerY} r={2} fill="oklch(0.85 0.05 60)" />
    </g>
  );
}
