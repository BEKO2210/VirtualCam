import { motion, LayoutGroup } from 'motion/react';
import { useRaw, useSelection, useStudio } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Horizontally scrollable rail with brand chips on top and
 * genre mood-cards below. Mobile-first; uses scroll-snap.
 */
export function QuickRail() {
  const raw = useRaw();
  const sel = useSelection();
  const setBrand = useStudio((s) => s.setBrand);
  const setGenre = useStudio((s) => s.setGenre);

  if (!raw) return null;

  const brands = Object.values(raw.cameras);
  const genres = Object.values(raw.templates);

  return (
    <div className="space-y-3">
      {/* Brand row */}
      <LayoutGroup id="brand-rail">
        <Section label="Marke">
          <div className="flex gap-2 overflow-x-auto no-scrollbar mask-fade-x px-1 -mx-1 snap-x snap-mandatory pb-1">
            {brands.map((b) => {
              const active = sel.brandKey === b.key;
              return (
                <button
                  key={b.key}
                  onClick={() => setBrand(b.key)}
                  className={cn(
                    'relative shrink-0 snap-start h-12 px-3.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ring-focus',
                    active
                      ? 'text-foreground'
                      : 'text-foreground/60 hover:text-foreground/90',
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-brand-pill"
                      className="absolute inset-0 rounded-full bg-[color-mix(in_oklch,var(--color-primary)_22%,transparent)] border border-[color-mix(in_oklch,var(--color-primary)_45%,transparent)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative tracking-tight">{b.brand}</span>
                  <span className="relative text-[10px] font-mono text-foreground/45">{b.format}</span>
                </button>
              );
            })}
          </div>
        </Section>
      </LayoutGroup>

      {/* Genre mood cards */}
      <Section label="Genre">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar mask-fade-x px-1 -mx-1 snap-x snap-mandatory pb-1">
          {genres.map((g) => {
            const active = sel.genreKey === g.key;
            const hue = g.hue ?? 30;
            return (
              <button
                key={g.key}
                onClick={() => setGenre(g.key)}
                className={cn(
                  'relative shrink-0 snap-start w-[180px] sm:w-[210px] h-[88px] rounded-[var(--radius-sm)] overflow-hidden text-left ring-focus transition-transform',
                  active ? 'scale-[1.02] ring-2 ring-[var(--color-primary)]' : 'hover:scale-[1.01]',
                )}
              >
                {/* Mood gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg,
                      oklch(0.42 0.18 ${hue}) 0%,
                      oklch(0.22 0.10 ${(hue + 40) % 360}) 65%,
                      oklch(0.14 0.04 ${(hue + 80) % 360}) 100%)`,
                  }}
                />
                <div className="absolute inset-0 grid-paper opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative h-full p-3 flex flex-col justify-between">
                  <Badge variant="outline" className="bg-black/30 backdrop-blur-sm w-fit border-white/10">
                    {g.recommended_lenses[0]?.split(' ')[0] ?? 'Genre'}
                  </Badge>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-white drop-shadow-md">
                      {g.name}
                    </div>
                    <div className="text-[10px] text-white/70 line-clamp-1 mt-0.5">{g.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-1 mb-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
        {label}
      </div>
      {children}
    </div>
  );
}
