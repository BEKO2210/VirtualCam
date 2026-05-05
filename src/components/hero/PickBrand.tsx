import { motion } from 'motion/react';
import { useRaw, useStudio } from '@/lib/store';
import { BrandLogo, brandAccent } from '@/components/icons/BrandLogo';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  active: string | null;
  onPicked: (brandKey: string) => void;
}

export function PickBrand({ active, onPicked }: Props) {
  const raw = useRaw();
  const setBrand = useStudio((s) => s.setBrand);
  if (!raw) return null;
  const brands = Object.values(raw.cameras);

  return (
    <div className="space-y-3">
      <Header />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {brands.map((b, i) => {
          const isActive = active === b.key;
          const accent = brandAccent(b.key);
          return (
            <motion.button
              key={b.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setBrand(b.key);
                onPicked(b.key);
              }}
              className={cn(
                'relative rounded-[var(--radius)] p-3.5 text-left ring-focus min-h-[120px] flex flex-col gap-3 transition-colors',
                'border bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06]',
                isActive
                  ? 'border-[color-mix(in_oklch,var(--color-primary)_60%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_8px_24px_-12px_var(--color-primary)]'
                  : 'border-[var(--color-border)]',
              )}
            >
              <div
                className="absolute inset-0 rounded-[var(--radius)] opacity-12 pointer-events-none"
                style={{
                  background: `radial-gradient(120% 80% at 100% 0%, ${accent}, transparent 60%)`,
                }}
              />
              <BrandLogo brandKey={b.key} size={48} className="relative shrink-0" />
              <div className="relative mt-auto">
                <div className="text-[14px] font-semibold tracking-tight leading-tight">
                  {b.brand}
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                    {b.format}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                    {b.models.length}
                  </Badge>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-1">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/45 mb-1">
        Schritt 1 · Marke
      </div>
      <div className="text-[16px] font-semibold tracking-tight">Welche Marke?</div>
      <div className="text-[12px] text-foreground/55 mt-1 leading-relaxed">
        11 Hersteller. Bestimmt das Mount-System.
      </div>
    </div>
  );
}
