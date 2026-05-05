import { ChevronRight } from 'lucide-react';
import { motion, LayoutGroup } from 'motion/react';
import { cn } from '@/lib/utils';

export type StageKey = 'brand' | 'camera' | 'lens' | 'genre' | 'rig';

interface Step {
  key: StageKey;
  label: string;
  /** Set when the step has a value chosen */
  done: boolean;
  /** Set when the step is reachable */
  enabled: boolean;
}

interface Props {
  stage: StageKey;
  steps: Step[];
  onJump: (s: StageKey) => void;
}

export function Breadcrumb({ stage, steps, onJump }: Props) {
  return (
    <LayoutGroup id="hero-breadcrumb">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-fade-x px-1 -mx-1 pb-0.5">
        {steps.map((s, i) => {
          const active = stage === s.key;
          return (
            <div key={s.key} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => s.enabled && onJump(s.key)}
                disabled={!s.enabled}
                className={cn(
                  'relative h-8 px-3 rounded-full text-[12px] font-medium tracking-tight transition-all flex items-center gap-1.5',
                  s.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                  active
                    ? 'text-foreground'
                    : s.done
                      ? 'text-foreground/80 hover:text-foreground'
                      : 'text-foreground/45',
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-step-pill"
                    className="absolute inset-0 rounded-full bg-[color-mix(in_oklch,var(--color-primary)_22%,transparent)] border border-[color-mix(in_oklch,var(--color-primary)_45%,transparent)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {s.done && (
                    <span
                      className={cn(
                        'inline-block size-1.5 rounded-full mr-1.5 -translate-y-0.5',
                        active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-success)]',
                      )}
                    />
                  )}
                  <span className="relative">{s.label}</span>
                </span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="size-3 text-foreground/25 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
