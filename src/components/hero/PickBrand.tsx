import { motion } from 'motion/react';
import { useRaw, useStudio } from '@/lib/store';
import { BrandGlyph } from '@/components/icons/brands';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  active: string | null;
  onPicked: (brandKey: string) => void;
}

const ACCENT_COLORS: Record<string, string> = {
  sony: '#f5a623',
  canon: '#ef4444',
  nikon: '#f6c34a',
  fujifilm: '#22c55e',
  panasonic: '#3b82f6',
  leica: '#ef4444',
  hasselblad: '#d4d4d8',
  phase_one: '#06b6d4',
  blackmagic: '#f97316',
  red: '#ef4444',
  arri: '#d4d4d8',
};

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
          const accent = ACCENT_COLORS[b.key] ?? '#f5a623';
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
                'relative rounded-[var(--radius)] p-3 sm:p-4 text-left ring-focus min-h-[120px] flex flex-col justify-between transition-colors',
                'border bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06]',
                isActive
                  ? 'border-[color-mix(in_oklch,var(--color-primary)_60%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_8px_24px_-12px_var(--color-primary)]'
                  : 'border-[var(--color-border)]',
              )}
            >
              <div
                className="absolute inset-0 rounded-[var(--radius)] opacity-15 pointer-events-none"
                style={{
                  background: `radial-gradient(120% 80% at 100% 0%, ${accent}, transparent 60%)`,
                }}
              />
              <div className="relative">
                <BrandGlyph brandKey={b.key} size={44} />
              </div>
              <div className="relative">
                <div className="text-[14px] font-semibold tracking-tight">{b.brand}</div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                    {b.format}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                    {b.models.length}× Body
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
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/45 mb-0.5">
        Schritt 1 von 4
      </div>
      <div className="text-[15px] font-semibold tracking-tight">Welche Marke?</div>
      <div className="text-xs text-foreground/55 mt-0.5">
        11 Hersteller, 36 Bodies. Das bestimmt das Mount-System.
      </div>
    </div>
  );
}
