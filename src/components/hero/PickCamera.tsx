import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useResolvedSelection, useStudio } from '@/lib/store';
import { CameraGlyph } from '@/components/icons/CameraGlyph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onPicked: () => void;
  onBack: () => void;
}

export function PickCamera({ onPicked, onBack }: Props) {
  const { brand, camera } = useResolvedSelection();
  const setCamera = useStudio((s) => s.setCamera);

  if (!brand) return null;

  return (
    <div className="space-y-3">
      <Header brand={brand.brand} onBack={onBack} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {brand.models.map((m, i) => {
          const isActive = camera?.id === m.id;
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.025 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCamera(m.id);
                onPicked();
              }}
              className={cn(
                'relative rounded-[var(--radius)] p-3 text-left ring-focus transition-colors',
                'border bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06]',
                isActive
                  ? 'border-[color-mix(in_oklch,var(--color-primary)_60%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_8px_24px_-12px_var(--color-primary)]'
                  : 'border-[var(--color-border)]',
              )}
            >
              <div className="flex items-stretch gap-3">
                <div className="shrink-0 w-[120px] h-[78px] rounded-md overflow-hidden bg-black/30 border border-white/[0.04] grid place-items-center relative">
                  <CameraGlyph camera={m} format={brand.format} className="w-full h-full p-1.5" />
                  {m.tier === 'flagship' && (
                    <div
                      className="absolute top-1 right-1 size-1.5 rounded-full"
                      style={{
                        background: 'var(--color-primary)',
                        boxShadow: '0 0 8px var(--color-primary)',
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="text-[13px] font-semibold tracking-tight leading-snug line-clamp-2">
                    {m.name}
                  </div>
                  <div className="text-[10.5px] text-foreground/55 font-mono mt-1 line-clamp-1">
                    {m.sensor}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {m.tier && (
                      <Badge
                        variant={m.tier === 'flagship' ? 'primary' : 'outline'}
                        className="text-[9px] py-0 h-4"
                      >
                        {m.tier}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                      ISO {m.iso_range[1].toLocaleString()}
                    </Badge>
                    {m.year && (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                        {m.year}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Header({ brand, onBack }: { brand: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Zurück">
        <ArrowLeft className="size-4" />
      </Button>
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/45">
          Schritt 2 · {brand}
        </div>
        <div className="text-[15px] font-semibold tracking-tight">Welcher Body?</div>
      </div>
    </div>
  );
}
