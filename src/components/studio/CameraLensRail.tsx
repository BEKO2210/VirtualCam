import { motion, LayoutGroup } from 'motion/react';
import { Plug, ShieldCheck } from 'lucide-react';
import {
  useCompatibleLenses,
  useResolvedSelection,
  useStudio,
} from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CameraLensRail() {
  const { brand, camera, lens, lensMountKey } = useResolvedSelection();
  const setCamera = useStudio((s) => s.setCamera);
  const setLens = useStudio((s) => s.setLens);
  const compatLenses = useCompatibleLenses();

  if (!brand) return null;

  const lensesByCategory = new Map<string, typeof compatLenses>();
  for (const l of compatLenses) {
    let arr = lensesByCategory.get(l.category);
    if (!arr) lensesByCategory.set(l.category, (arr = []));
    arr.push(l);
  }

  return (
    <div className="space-y-3">
      {/* Camera bodies */}
      <LayoutGroup id="camera-rail">
        <Section label={`${brand.brand} · Bodies`}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mask-fade-x px-1 -mx-1 snap-x snap-mandatory pb-1">
            {brand.models.map((m) => {
              const active = camera?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setCamera(m.id)}
                  className={cn(
                    'relative shrink-0 snap-start min-w-[170px] h-[78px] rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors ring-focus',
                    active
                      ? 'text-foreground'
                      : 'text-foreground/70 hover:text-foreground',
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-camera-card"
                      className="absolute inset-0 rounded-[var(--radius-sm)] bg-white/5 border border-[color-mix(in_oklch,var(--color-primary)_40%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_8px_24px_-12px_var(--color-primary)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {!active && (
                    <div className="absolute inset-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white/[0.02]" />
                  )}
                  <div className="relative">
                    <div className="text-[13px] font-semibold leading-tight truncate">{m.name}</div>
                    <div className="text-[10px] font-mono text-foreground/50 mt-0.5 truncate">
                      {m.sensor}
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {m.tier && (
                        <Badge variant={m.tier === 'flagship' ? 'primary' : 'outline'} className="text-[9px] py-0 h-4">
                          {m.tier}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                        ISO {m.iso_range[1].toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
      </LayoutGroup>

      {/* Lenses by category */}
      <LayoutGroup id="lens-rail">
        <Section label={`Objektive · ${compatLenses.length} verfügbar`}>
          <div className="space-y-2.5">
            {[
              'Ultra-Wide',
              'Wide',
              'Standard',
              'Portrait',
              'Telephoto',
              'Super-Telephoto',
              'Macro',
              'Cinema',
            ]
              .filter((c) => lensesByCategory.has(c))
              .map((cat) => {
                const list = lensesByCategory.get(cat)!;
                return (
                  <div key={cat}>
                    <div className="px-1 mb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-foreground/35">
                      {cat}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mask-fade-x px-1 -mx-1 snap-x pb-1">
                      {list.map((l) => {
                        const active = lens?.id === l.id && lensMountKey === l.mountKey;
                        const adapted = l.compat.status === 'adapted';
                        return (
                          <button
                            key={l.id + l.mountKey}
                            onClick={() => setLens(l.mountKey, l.id)}
                            className={cn(
                              'relative shrink-0 snap-start min-w-[200px] h-[68px] rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors ring-focus',
                              active ? 'text-foreground' : 'text-foreground/70 hover:text-foreground',
                            )}
                          >
                            {active && (
                              <motion.div
                                layoutId="active-lens-card"
                                className="absolute inset-0 rounded-[var(--radius-sm)] bg-white/5 border border-[color-mix(in_oklch,var(--color-primary)_50%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_8px_24px_-12px_var(--color-primary)]"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                            {!active && (
                              <div
                                className={cn(
                                  'absolute inset-0 rounded-[var(--radius-sm)] border bg-white/[0.02]',
                                  adapted
                                    ? 'border-[color-mix(in_oklch,var(--color-warn)_40%,transparent)]'
                                    : 'border-[var(--color-border)]',
                                )}
                              />
                            )}
                            <div className="relative">
                              <div className="text-[12px] font-semibold leading-tight line-clamp-1">
                                {l.name}
                              </div>
                              <div className="text-[10px] font-mono text-foreground/55 mt-0.5">
                                {l.focal_length} · {l.max_aperture}
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant={adapted ? 'warn' : 'success'} className="text-[9px] py-0 h-4">
                                  {adapted ? <Plug className="size-2.5" /> : <ShieldCheck className="size-2.5" />}
                                  {adapted ? 'Adapter' : 'Native'}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                                  {l.mountLabel}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </Section>
      </LayoutGroup>
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
