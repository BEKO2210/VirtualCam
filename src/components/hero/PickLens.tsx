import { motion } from 'motion/react';
import { ArrowLeft, Plug, ShieldCheck } from 'lucide-react';
import { useCompatibleLenses, useResolvedSelection, useStudio } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LensCategory } from '@/types';

interface Props {
  onPicked: () => void;
  onBack: () => void;
}

const CATEGORY_ORDER: LensCategory[] = [
  'Ultra-Wide',
  'Wide',
  'Standard',
  'Portrait',
  'Telephoto',
  'Super-Telephoto',
  'Macro',
  'Cinema',
];

export function PickLens({ onPicked, onBack }: Props) {
  const { brand, lens, lensMountKey } = useResolvedSelection();
  const lenses = useCompatibleLenses();
  const setLens = useStudio((s) => s.setLens);

  if (!brand) return null;

  const byCat = new Map<LensCategory, typeof lenses>();
  for (const l of lenses) {
    let arr = byCat.get(l.category);
    if (!arr) byCat.set(l.category, (arr = []));
    arr.push(l);
  }
  const categories = CATEGORY_ORDER.filter((c) => byCat.has(c));

  return (
    <div className="space-y-3">
      <Header brand={brand.brand} count={lenses.length} onBack={onBack} />
      <div className="space-y-2.5">
        {categories.map((cat) => {
          const list = byCat.get(cat)!;
          return (
            <section key={cat}>
              <div className="px-1 mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/40 flex items-center gap-1.5">
                {cat}
                <span className="opacity-50">· {list.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {list.map((l, i) => {
                  const isActive = lens?.id === l.id && lensMountKey === l.mountKey;
                  const adapted = l.compat.status === 'adapted';
                  return (
                    <motion.button
                      key={`${l.id}-${l.mountKey}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.012 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLens(l.mountKey, l.id);
                        onPicked();
                      }}
                      className={cn(
                        'relative rounded-[var(--radius-sm)] p-2.5 text-left ring-focus transition-colors border bg-white/[0.02]',
                        isActive
                          ? 'border-[color-mix(in_oklch,var(--color-primary)_60%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_8px_24px_-12px_var(--color-primary)]'
                          : adapted
                            ? 'border-[color-mix(in_oklch,var(--color-warn)_45%,transparent)] hover:border-[color-mix(in_oklch,var(--color-warn)_70%,transparent)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <LensPictogram aperture={l.max_aperture} category={cat} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-semibold tracking-tight leading-tight line-clamp-1">
                            {l.name}
                          </div>
                          <div className="text-[10px] font-mono text-foreground/55 mt-0.5">
                            {l.focal_length} · {l.max_aperture}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <Badge variant={adapted ? 'warn' : 'success'} className="text-[9px] py-0 h-4">
                              {adapted ? <Plug className="size-2.5" /> : <ShieldCheck className="size-2.5" />}
                              {adapted ? 'Adapter' : 'Native'}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                              {l.mountLabel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Header({ brand, count, onBack }: { brand: string; count: number; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Zurück">
        <ArrowLeft className="size-4" />
      </Button>
      <div className="min-w-0">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/45">
          Schritt 3 · {count} Linsen für {brand}
        </div>
        <div className="text-[15px] font-semibold tracking-tight">Welches Objektiv?</div>
      </div>
    </div>
  );
}

function LensPictogram({ aperture, category }: { aperture: string; category: LensCategory }) {
  // Diameter scales (loosely) with aperture; cinema lenses get rectangular tag.
  const a = parseFloat(aperture.replace(/[^0-9.]/g, '')) || 2.8;
  const r = Math.max(8, 18 - a * 1.2);
  const isCinema = category === 'Cinema';
  return (
    <div className="size-12 shrink-0 grid place-items-center rounded-md bg-black/30 border border-white/5">
      <svg viewBox="0 0 40 40" className="w-full h-full p-1.5">
        <defs>
          <radialGradient id="lpg" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="oklch(0.55 0.05 240)" />
            <stop offset="0.6" stopColor="oklch(0.18 0.04 240)" />
            <stop offset="1" stopColor="oklch(0.10 0.02 240)" />
          </radialGradient>
        </defs>
        {isCinema ? (
          <>
            <rect x="6" y="14" width="28" height="12" rx="1.5" fill="oklch(0.22 0.014 270)" stroke="oklch(1 0 0 / 0.18)" />
            <rect x="9" y="16" width="22" height="2" fill="oklch(1 0 0 / 0.16)" />
            <rect x="9" y="22" width="22" height="2" fill="oklch(1 0 0 / 0.16)" />
          </>
        ) : (
          <>
            <circle cx="20" cy="20" r={r + 2} fill="oklch(0.22 0.014 270)" stroke="oklch(1 0 0 / 0.18)" />
            <circle cx="20" cy="20" r={r} fill="url(#lpg)" />
            <circle cx="20" cy="20" r={Math.max(2, r * 0.3)} fill="oklch(0.05 0 0)" />
          </>
        )}
      </svg>
    </div>
  );
}
