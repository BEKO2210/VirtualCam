import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera as CameraIcon, AlertTriangle, ShieldCheck, Plug } from 'lucide-react';
import type { CameraModel, Lens, MountCompat, SensorFormat } from '@/types';
import { mountColorVar } from '@/lib/engine';
import { useCameraImageUrl } from '@/lib/store';
import { bodyGeometry, parseAperture, parseFocalRange } from '@/lib/rig-geometry';

interface CameraRigProps {
  brand: { brand: string; format: SensorFormat; mount: string } | null;
  camera: CameraModel | null;
  lens: Lens | null;
  lensMountKey: string | null;
  compat: MountCompat | null;
}

/**
 * 480×300 viewBox — 1.6:1 aspect. The body sits right of center
 * (x ≈ 200..420), the lens sticks out to the left (x ≈ 20..200).
 *
 * All measurements are in viewBox units. The container scales the SVG
 * to fit, so on a 360px-wide phone the rig renders at ~225 px tall.
 */
const VIEW_W = 480;
const VIEW_H = 300;
const AXIS_Y = 168; // optical axis Y position (slightly below center for shadow room)

export function CameraRig({ brand, camera, lens, lensMountKey, compat }: CameraRigProps) {
  const fmt = brand?.format ?? 'Full-Frame';
  const body = bodyGeometry(camera, fmt);
  const photoUrl = useCameraImageUrl(camera?.id);
  const [photoFailed, setPhotoFailed] = useState(false);
  const usePhoto = !!(camera && photoUrl && !photoFailed);

  const compatStatus = compat?.status ?? 'native';
  const isAdapted = compatStatus === 'adapted';
  const isIncompat = compatStatus === 'incompatible';
  const mountColor = lensMountKey ? mountColorVar[lensMountKey] : 'var(--color-mount-e)';

  // Body positioning: right-of-center so the lens has room to extend left.
  const scale = 1.2;
  const bodyW = Math.round(body.w * scale);
  const bodyH = Math.round(body.h * scale);
  const bodyX = 200; // mount edge sits here — must be > max lens length
  const bodyY = AXIS_Y - bodyH / 2;
  const humpH = Math.round(body.humpH * scale);

  // Lens metrics derived directly so we control proportions tightly.
  const lensMetrics = lens ? lensMetricsOf(lens, body.silhouette) : null;

  return (
    <div className="space-y-2">
      <div className="relative w-full overflow-hidden rounded-[var(--radius-lg)] glass-strong grid-paper" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        {/* Ambient amber wash from the bottom right */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 60% at 60% 70%, color-mix(in oklch, var(--color-primary) 10%, transparent), transparent 70%)',
          }}
        />
        {/* Cool key-light from the top-left for depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(50% 40% at 25% 20%, color-mix(in oklch, oklch(0.7 0.06 240) 6%, transparent), transparent 70%)',
          }}
        />

        {/* Real product photo when available (Wikimedia CC-licensed via CI fetch) */}
        {usePhoto && (
          <motion.div
            key={`photo-${camera?.id}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            <img
              src={photoUrl!}
              alt={camera!.name}
              loading="eager"
              decoding="async"
              onError={() => setPhotoFailed(true)}
              className="max-h-[88%] max-w-[88%] object-contain"
              style={{
                filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                mixBlendMode: 'normal',
              }}
            />
          </motion.div>
        )}

        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="absolute inset-0 h-full w-full"
          aria-label={camera ? `Camera rig: ${camera.name} with ${lens?.name ?? 'no lens'}` : 'Empty rig'}
        >
          <defs>
            {/* Body — vertical metal/plastic gradient with a subtle highlight strip */}
            <linearGradient id="bodyTop" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#3b3d44" />
              <stop offset="0.45" stopColor="#2a2c33" />
              <stop offset="1" stopColor="#15171c" />
            </linearGradient>
            <linearGradient id="bodyHighlight" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Lens — horizontal gradient with center highlight */}
            <linearGradient id="lensBarrel" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#42454d" />
              <stop offset="0.5" stopColor="#23252b" />
              <stop offset="1" stopColor="#0d0e12" />
            </linearGradient>
            <linearGradient id="lensRingMetal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#4a4d55" />
              <stop offset="0.5" stopColor="#1d1f24" />
              <stop offset="1" stopColor="#0a0a0c" />
            </linearGradient>
            {/* Front glass — deep blue with a sharp highlight */}
            <radialGradient id="glassDeep" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#7390b8" />
              <stop offset="0.35" stopColor="#1f3458" />
              <stop offset="0.7" stopColor="#0a1428" />
              <stop offset="1" stopColor="#040814" />
            </radialGradient>
            <radialGradient id="glassSheen" cx="0.35" cy="0.30" r="0.18">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glassRing" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0.55" stopColor="transparent" />
              <stop offset="0.65" stopColor="#9aa6c0" stopOpacity="0.12" />
              <stop offset="0.85" stopColor="transparent" />
            </radialGradient>
            {/* LCD — back screen */}
            <linearGradient id="lcd" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0a141f" />
              <stop offset="0.5" stopColor="#0d2238" />
              <stop offset="1" stopColor="#04080f" />
            </linearGradient>
            {/* Mount glow filter */}
            <filter id="mountGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Body shadow on the floor (procedural mode only) */}
          {camera && !usePhoto && (
            <ellipse
              cx={bodyX + bodyW / 2 - 10}
              cy={bodyY + bodyH + 14}
              rx={(bodyW + (lensMetrics?.length ?? 0) * 0.5) * 0.45}
              ry={5}
              fill="black"
              opacity="0.45"
            />
          )}

          {/* ── Body — procedural (only when no real photo available) */}
          {!usePhoto && (
            <motion.g
              initial={false}
              animate={{ opacity: camera ? 1 : 0.25 }}
              transition={{ duration: 0.35 }}
            >
              <BodySVG
                x={bodyX}
                y={bodyY}
                w={bodyW}
                h={bodyH}
                gripW={Math.round(body.gripW * scale * 1.1)}
                humpH={humpH}
                type={body.silhouette}
                brand={brand?.brand}
                cameraName={camera?.name}
              />
            </motion.g>
          )}

          {/* ── Lens — procedural (skipped when photo mode; lens info still in spec strip) */}
          {!usePhoto && (
            <AnimatePresence>
              {lens && lensMetrics && (
                <motion.g
                  key={lens.id}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -60, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                >
                  <LensSVG metrics={lensMetrics} mountX={bodyX} centerY={AXIS_Y} />
                </motion.g>
              )}
            </AnimatePresence>
          )}

          {/* ── Mount-rim glow (color-coded; pulses on adapter/incompat). Only in procedural mode. */}
          {camera && !usePhoto && (
            <motion.circle
              cx={bodyX}
              cy={AXIS_Y}
              r={(lensMetrics?.rearDiameter ?? 56) / 2 + 5}
              fill="none"
              stroke={isIncompat ? 'var(--color-warn)' : mountColor}
              strokeWidth={isAdapted || isIncompat ? 3.2 : 2.2}
              filter="url(#mountGlow)"
              animate={{
                opacity: isAdapted || isIncompat ? [0.55, 1, 0.55] : 0.85,
              }}
              transition={{
                duration: 1.6,
                repeat: isAdapted || isIncompat ? Infinity : 0,
              }}
            />
          )}

          {/* ── Format ribbon (top right corner) */}
          {camera && (
            <g transform={`translate(${VIEW_W - 92}, 14)`}>
              <rect width="80" height="20" rx="10" fill="oklch(0 0 0 / 0.55)" stroke="oklch(1 0 0 / 0.10)" />
              <text
                x="40"
                y="13.5"
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="var(--font-mono)"
                fill="oklch(1 0 0 / 0.82)"
                letterSpacing="0.08em"
              >
                {fmt.toUpperCase()}
              </text>
            </g>
          )}
        </svg>

        {!camera && !lens && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center text-foreground/50 text-sm">
              <CameraIcon className="size-8 mx-auto mb-2 opacity-50" />
              Wähle eine Marke und ein Modell, um das Rig zu konfigurieren.
            </div>
          </div>
        )}
      </div>

      {/* Mount-compat banner */}
      {lens && compat && compat.status !== 'native' && (
        <div
          className={
            'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border ' +
            (compat.status === 'adapted'
              ? 'bg-[color-mix(in_oklch,var(--color-warn)_14%,transparent)] border-[color-mix(in_oklch,var(--color-warn)_40%,transparent)] text-[color-mix(in_oklch,var(--color-warn)_92%,white)]'
              : 'bg-[color-mix(in_oklch,var(--color-danger)_14%,transparent)] border-[color-mix(in_oklch,var(--color-danger)_40%,transparent)] text-[color-mix(in_oklch,var(--color-danger)_92%,white)]')
          }
        >
          {compat.status === 'adapted' ? (
            <Plug className="size-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="size-3.5 shrink-0" />
          )}
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] shrink-0">
            {compat.status === 'adapted' ? 'Adapter' : 'Mismatch'}
          </div>
          <div className="text-[12px] font-mono opacity-90 truncate">
            {compat.adapter ?? compat.note ?? 'required'}
          </div>
        </div>
      )}

      {camera && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white/[0.02] divide-y divide-[var(--color-border)] sm:divide-y-0 sm:divide-x sm:flex">
          <SpecCell label="Body" value={camera.name} hint={brand?.brand} />
          <SpecCell
            label="Sensor"
            value={camera.sensor.split(' ').slice(0, 2).join(' ')}
            hint={`ISO ${camera.iso_range[0]}–${camera.iso_range[1].toLocaleString()}`}
          />
          {lens && (
            <SpecCell
              label="Lens"
              value={`${lens.focal_length} · ${lens.max_aperture}`}
              hint={(() => {
                const fr = parseFocalRange(lens.focal_length);
                const fov = Math.round(2 * Math.atan(36 / (2 * fr[0])) * (180 / Math.PI));
                return `${fov}° FOV`;
              })()}
            />
          )}
        </div>
      )}

      {lens && (
        <div className="text-[12px] text-foreground/65 font-mono px-1 truncate flex items-center gap-2">
          {compat?.status === 'native' && (
            <ShieldCheck className="size-3 text-[var(--color-success)] shrink-0" />
          )}
          <span className="truncate">{lens.name}</span>
        </div>
      )}
    </div>
  );
}

function SpecCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-3 py-2 flex-1 min-w-0">
      <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-foreground/40 mb-0.5">
        {label}
      </div>
      <div className="text-[12.5px] font-semibold tracking-tight truncate">{value}</div>
      {hint && (
        <div className="text-[10px] text-foreground/55 font-mono mt-0.5 truncate">{hint}</div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Body — side-view silhouette, lens-mount on the LEFT
 * ────────────────────────────────────────────────────────────── */

interface BodyProps {
  x: number;
  y: number;
  w: number;
  h: number;
  gripW: number;
  humpH: number;
  type: 'mirrorless' | 'dslr' | 'medium-format' | 'cinema' | 'rangefinder';
  brand?: string;
  cameraName?: string;
}

function BodySVG({ x, y, w, h, gripW, humpH, type, brand }: BodyProps) {
  const right = x + w;
  const bottom = y + h;
  const r = 12;

  // Hump (viewfinder housing) sits roughly centered-front
  const humpW = type === 'rangefinder' ? 0 : type === 'medium-format' ? 36 : type === 'cinema' ? 24 : 56;
  const humpStartX = x + w * 0.18;
  const humpEndX = humpStartX + humpW;
  const humpY = y - humpH;

  const grip = `M ${right - gripW} ${y + 12}
                L ${right - gripW + 2} ${y + 4}
                L ${right - 4} ${y - 2}
                Q ${right + 4} ${y + 2} ${right + 4} ${y + 12}
                L ${right + 4} ${bottom - 16}
                Q ${right + 6} ${bottom - 4} ${right} ${bottom - 4}
                L ${right - gripW + 6} ${bottom - 4}
                Z`;

  const bodyPath = humpW
    ? `M ${x + r} ${y}
       L ${humpStartX} ${y}
       Q ${humpStartX + humpW * 0.18} ${humpY} ${humpStartX + humpW * 0.38} ${humpY}
       L ${humpEndX - humpW * 0.38} ${humpY}
       Q ${humpEndX - humpW * 0.18} ${humpY} ${humpEndX} ${y}
       L ${right - gripW - r} ${y}
       Q ${right - gripW} ${y} ${right - gripW} ${y + r}
       L ${right - gripW} ${bottom - r}
       Q ${right - gripW} ${bottom} ${right - gripW + r} ${bottom}
       L ${x + r} ${bottom}
       Q ${x} ${bottom} ${x} ${bottom - r}
       L ${x} ${y + r}
       Q ${x} ${y} ${x + r} ${y} Z`
    : `M ${x + r} ${y}
       L ${right - gripW - r} ${y}
       Q ${right - gripW} ${y} ${right - gripW} ${y + r}
       L ${right - gripW} ${bottom - r}
       Q ${right - gripW} ${bottom} ${right - gripW + r} ${bottom}
       L ${x + r} ${bottom}
       Q ${x} ${bottom} ${x} ${bottom - r}
       L ${x} ${y + r}
       Q ${x} ${y} ${x + r} ${y} Z`;

  return (
    <g>
      {/* Main body */}
      <path d={bodyPath} fill="url(#bodyTop)" stroke="oklch(1 0 0 / 0.16)" strokeWidth="1" />
      {/* Top highlight strip */}
      <path
        d={`M ${x + r} ${y + 1} L ${right - gripW - r} ${y + 1}`}
        stroke="url(#bodyHighlight)"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />

      {/* Grip — separate piece for depth */}
      <path d={grip} fill="oklch(0.10 0.005 270)" stroke="oklch(1 0 0 / 0.10)" strokeWidth="1" />
      {/* Grip texture stripes */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={i}
          x1={right - gripW + 4}
          y1={y + 16 + i * 9}
          x2={right + 1}
          y2={y + 16 + i * 9}
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Viewfinder hump details */}
      {humpW > 0 && (
        <>
          {/* Hot shoe */}
          <rect
            x={humpStartX + humpW / 2 - 14}
            y={humpY + 2}
            width={28}
            height={5}
            rx={1}
            fill="oklch(0.13 0.005 270)"
            stroke="oklch(1 0 0 / 0.18)"
          />
          {/* Hot shoe contacts */}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={humpStartX + humpW / 2 - 10 + i * 7}
              y={humpY + 4}
              width={2}
              height={1.5}
              fill="oklch(0.7 0.06 60)"
            />
          ))}
        </>
      )}

      {/* Mode dial (top-right of the body, before the grip) */}
      {type !== 'cinema' && (
        <g>
          <circle
            cx={right - gripW - 18}
            cy={y + 11}
            r={9}
            fill="oklch(0.35 0.012 270)"
            stroke="oklch(1 0 0 / 0.18)"
            strokeWidth="1"
          />
          <circle
            cx={right - gripW - 18}
            cy={y + 11}
            r={6}
            fill="oklch(0.18 0.008 270)"
          />
          {/* tick marks */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const x1 = right - gripW - 18 + Math.cos(a) * 7.5;
            const y1 = y + 11 + Math.sin(a) * 7.5;
            const x2 = right - gripW - 18 + Math.cos(a) * 9;
            const y2 = y + 11 + Math.sin(a) * 9;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(1 0 0 / 0.35)" strokeWidth="0.6" />
            );
          })}
          {/* indicator */}
          <circle cx={right - gripW - 18} cy={y + 5.5} r={1.2} fill="var(--color-primary)" />
        </g>
      )}

      {/* LCD / back screen — visible because we view from the side, the screen is a thin strip on the back */}
      {type !== 'cinema' && type !== 'rangefinder' && (
        <rect
          x={right - gripW - 4}
          y={y + 30}
          width={3}
          height={h - 50}
          rx={1}
          fill="url(#lcd)"
          stroke="oklch(1 0 0 / 0.16)"
        />
      )}

      {/* Cinema rosette */}
      {type === 'cinema' && (
        <>
          <circle
            cx={right - gripW - 18}
            cy={y + h / 2}
            r={9}
            fill="none"
            stroke="oklch(1 0 0 / 0.25)"
            strokeDasharray="1.5 2.5"
          />
          <circle cx={right - gripW - 18} cy={y + h / 2} r={3} fill="oklch(0.20 0.012 270)" stroke="oklch(1 0 0 / 0.25)" />
        </>
      )}

      {/* Brand name (vertical, near front) */}
      {brand && (
        <text
          x={x + 14}
          y={y + h / 2 + 4}
          fontSize="10"
          fontFamily="var(--font-sans)"
          fontWeight="700"
          fill="oklch(1 0 0 / 0.50)"
          letterSpacing="0.08em"
        >
          {brand.toUpperCase()}
        </text>
      )}

      {/* Model strip — small accent at the bottom front */}
      <rect
        x={x + 14}
        y={bottom - 14}
        width={Math.min(64, w * 0.4)}
        height={2.5}
        rx={1}
        fill="var(--color-primary)"
        opacity="0.5"
      />

      {/* Front-edge mount platform — the lens attaches here */}
      <rect
        x={x - 10}
        y={y + h * 0.18}
        width={12}
        height={h * 0.64}
        rx={2}
        fill="oklch(0.18 0.008 270)"
        stroke="oklch(1 0 0 / 0.10)"
      />
    </g>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Lens — cylindrical side-view, attaches at mountX
 * ────────────────────────────────────────────────────────────── */

interface LensMetrics {
  /** Total length from front (with hood) to mount flange */
  length: number;
  /** Hood length (0 if no hood) */
  hoodLength: number;
  /** Outer diameter at the front (with hood removed = barrel diameter) */
  diameter: number;
  /** Diameter at the mount (rear) */
  rearDiameter: number;
  /** Front element (glass) diameter */
  glassDiameter: number;
  /** True for cinema lenses (rectangular knobs etc) */
  isCinema: boolean;
  /** True for prime lenses (one focus ring), false for zooms (zoom + focus) */
  isPrime: boolean;
}

function lensMetricsOf(lens: Lens, _bodyType: string): LensMetrics {
  const focals = parseFocalRange(lens.focal_length);
  const longest = Math.max(...focals);
  const shortest = Math.min(...focals);
  const aperture = parseAperture(lens.max_aperture);

  // Length: log-scaled so 14mm and 600mm both fit on screen.
  // Tuned so 50mm primes feel "compact" and 70-200mm feels "long".
  const length = Math.round(58 + 56 * Math.log10(1 + longest / 12));

  // Diameter: faster lenses are fatter (lower aperture = bigger glass).
  // Zooms with bigger range are also slightly fatter.
  const fastFactor = Math.max(0, 4.5 - aperture) * 6;
  const zoomFactor = Math.min(20, (longest - shortest) / 8);
  const diameter = Math.round(54 + fastFactor + zoomFactor);
  const rearDiameter = Math.round(diameter * 0.78);
  const glassDiameter = Math.round(diameter * 0.86);
  const isCinema = lens.type === 'cine-prime' || lens.type === 'cine-zoom';
  const isPrime = lens.type === 'prime' || lens.type === 'cine-prime';
  const hoodLength = isCinema ? 24 : longest > 100 ? 22 : longest > 50 ? 14 : 10;

  return {
    // Cap so the lens always fits within the bodyX margin (200) with breathing room.
    length: Math.min(180, length),
    hoodLength,
    diameter: Math.min(78, diameter),
    rearDiameter: Math.min(70, rearDiameter),
    glassDiameter: Math.min(64, glassDiameter),
    isCinema,
    isPrime,
  };
}

function LensSVG({ metrics, mountX, centerY }: { metrics: LensMetrics; mountX: number; centerY: number }) {
  const { length, hoodLength, diameter, rearDiameter, glassDiameter, isCinema, isPrime } = metrics;

  // X coords (left to right): hoodFront, hoodEnd/glassFront, barrelStart, barrelMid, barrelEnd/mount
  const hoodFrontX = mountX - length;
  const hoodEndX = hoodFrontX + hoodLength;
  const mountAttachX = mountX;

  // Y coords (top/bottom of barrel)
  const barrelTop = centerY - diameter / 2;
  const barrelBottom = centerY + diameter / 2;
  const hoodTop = centerY - diameter / 2 - 3;
  const hoodBottom = centerY + diameter / 2 + 3;
  const rearTop = centerY - rearDiameter / 2;

  // Ring layout — focus + zoom (or just focus for primes)
  const barrelLength = mountAttachX - hoodEndX;
  const focusRingX = hoodEndX + barrelLength * 0.35;
  const zoomRingX = hoodEndX + barrelLength * 0.62;
  const focusRingW = isCinema ? 22 : 18;
  const zoomRingW = isCinema ? 26 : 22;

  // Bayonet flange (narrower section right at the mount)
  const flangeW = 6;

  return (
    <g>
      {/* Lens shadow */}
      <ellipse cx={hoodEndX + barrelLength / 2} cy={barrelBottom + 12} rx={length * 0.4} ry={4} fill="black" opacity="0.4" />

      {/* Hood — slightly flared trapezoid */}
      {hoodLength > 0 && (
        <path
          d={`M ${hoodFrontX} ${hoodTop}
              L ${hoodEndX} ${barrelTop}
              L ${hoodEndX} ${barrelBottom}
              L ${hoodFrontX} ${hoodBottom} Z`}
          fill={isCinema ? 'oklch(0.13 0.005 270)' : 'oklch(0.10 0.008 270)'}
          stroke="oklch(1 0 0 / 0.16)"
          strokeWidth="1"
        />
      )}

      {/* Barrel — cylinder. Tapers slightly at the mount end. */}
      <path
        d={`M ${hoodEndX} ${barrelTop}
            L ${mountAttachX - flangeW} ${barrelTop + (diameter - rearDiameter) * 0.3}
            L ${mountAttachX - flangeW} ${barrelBottom - (diameter - rearDiameter) * 0.3}
            L ${hoodEndX} ${barrelBottom} Z`}
        fill="url(#lensBarrel)"
        stroke="oklch(1 0 0 / 0.16)"
        strokeWidth="1"
      />

      {/* Top highlight — runs along the barrel for that "polished metal" feel */}
      <line
        x1={hoodEndX + 4}
        y1={barrelTop + 3}
        x2={mountAttachX - flangeW - 4}
        y2={barrelTop + 3 + (diameter - rearDiameter) * 0.3}
        stroke="oklch(1 0 0 / 0.22)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Bottom shadow */}
      <line
        x1={hoodEndX + 4}
        y1={barrelBottom - 3}
        x2={mountAttachX - flangeW - 4}
        y2={barrelBottom - 3 - (diameter - rearDiameter) * 0.3}
        stroke="oklch(0 0 0 / 0.45)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Focus ring — knurled grooves */}
      <RingBand
        cx={focusRingX}
        cy={centerY}
        width={focusRingW}
        height={diameter + 4}
        knurls={isCinema ? 8 : 14}
      />

      {/* Zoom ring (only on zooms) — wider, marker line */}
      {!isPrime && (
        <RingBand
          cx={zoomRingX}
          cy={centerY}
          width={zoomRingW}
          height={diameter + 6}
          knurls={isCinema ? 6 : 10}
          marker
        />
      )}

      {/* Bayonet flange — light metal collar at the mount */}
      <rect
        x={mountAttachX - flangeW}
        y={rearTop}
        width={flangeW}
        height={rearDiameter}
        fill="oklch(0.45 0.012 270)"
        stroke="oklch(1 0 0 / 0.20)"
      />
      {/* Mount index dot */}
      <circle cx={mountAttachX - flangeW / 2} cy={rearTop + 6} r={1.6} fill="oklch(0.85 0.05 60)" />

      {/* Front element: deep blue glass with a sheen */}
      <ellipse
        cx={hoodEndX + 1}
        cy={centerY}
        rx={4}
        ry={glassDiameter / 2}
        fill="url(#glassDeep)"
        stroke="oklch(1 0 0 / 0.28)"
        strokeWidth="1"
      />
      {/* AR-coating concentric ring (subtle) */}
      <ellipse
        cx={hoodEndX + 1}
        cy={centerY}
        rx={2.4}
        ry={glassDiameter / 2 - 4}
        fill="url(#glassRing)"
        opacity="0.7"
      />
      {/* Specular highlight */}
      <ellipse
        cx={hoodEndX + 0.5}
        cy={centerY - glassDiameter * 0.18}
        rx={1.6}
        ry={glassDiameter * 0.18}
        fill="white"
        opacity="0.55"
      />
    </g>
  );
}

function RingBand({
  cx,
  cy,
  width,
  height,
  knurls,
  marker,
}: {
  cx: number;
  cy: number;
  width: number;
  height: number;
  knurls: number;
  marker?: boolean;
}) {
  const left = cx - width / 2;
  const top = cy - height / 2;
  return (
    <g>
      {/* Ring base */}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        fill="url(#lensRingMetal)"
        stroke="oklch(1 0 0 / 0.18)"
        strokeWidth="1"
      />
      {/* Knurl grooves */}
      {Array.from({ length: knurls }).map((_, i) => {
        const x = left + 2 + ((width - 4) / knurls) * i;
        return (
          <line
            key={i}
            x1={x}
            y1={top + 3}
            x2={x}
            y2={top + height - 3}
            stroke="oklch(1 0 0 / 0.18)"
            strokeWidth="0.8"
          />
        );
      })}
      {/* Edge highlights */}
      <line x1={left} y1={top} x2={left + width} y2={top} stroke="oklch(1 0 0 / 0.28)" strokeWidth="1" />
      <line
        x1={left}
        y1={top + height}
        x2={left + width}
        y2={top + height}
        stroke="oklch(0 0 0 / 0.6)"
        strokeWidth="1"
      />
      {/* Optional zoom-marker (white index line + small dot) */}
      {marker && (
        <>
          <line
            x1={cx}
            y1={top - 2}
            x2={cx}
            y2={top + 4}
            stroke="white"
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
          <circle cx={cx} cy={top - 4} r="1.4" fill="var(--color-primary)" />
        </>
      )}
    </g>
  );
}
