import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  hint?: string;
  options: readonly string[];
  value?: string;
  onChange: (next: string) => void;
  /** "chips" wraps; "stops" makes a single horizontal scroll-snap row (good for f-stops) */
  variant?: 'chips' | 'stops';
}

export function ChipGroup({ label, hint, options, value, onChange, variant = 'chips' }: Props) {
  const groupId = useId();
  const dirty = !!value;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2 px-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/55">
          {label}
        </div>
        {hint && (
          <div className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-foreground/30">
            {hint}
          </div>
        )}
        {dirty && (
          <span
            className="ml-auto size-1.5 rounded-full bg-[var(--color-primary)]"
            title="aktiv"
          />
        )}
      </div>
      <div
        className={cn(
          variant === 'stops'
            ? 'flex gap-1.5 overflow-x-auto no-scrollbar mask-fade-x snap-x px-1 -mx-1 pb-1'
            : 'flex flex-wrap gap-1.5',
        )}
      >
        {options.map((opt) => {
          const active = value === opt;
          return (
            <motion.button
              key={`${groupId}-${opt}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(active ? '' : opt)}
              className={cn(
                'relative shrink-0 snap-start rounded-full px-3 py-1.5 text-[12px] font-medium tracking-tight transition-colors ring-focus',
                'border',
                active
                  ? 'bg-[color-mix(in_oklch,var(--color-primary)_22%,transparent)] border-[color-mix(in_oklch,var(--color-primary)_55%,transparent)] text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_4px_14px_-6px_var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-white/[0.02] text-foreground/65 hover:text-foreground hover:border-[var(--color-border-strong)]',
              )}
            >
              <span className="relative font-mono whitespace-nowrap">{opt}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
