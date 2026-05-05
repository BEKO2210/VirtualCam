import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase',
  {
    variants: {
      variant: {
        default: 'bg-white/5 text-foreground/80 border border-[var(--color-border)]',
        primary:
          'bg-[color-mix(in_oklch,var(--color-primary)_18%,transparent)] text-[color-mix(in_oklch,var(--color-primary)_92%,white)] border border-[color-mix(in_oklch,var(--color-primary)_30%,transparent)]',
        warn: 'bg-[color-mix(in_oklch,var(--color-warn)_18%,transparent)] text-[color-mix(in_oklch,var(--color-warn)_95%,white)] border border-[color-mix(in_oklch,var(--color-warn)_30%,transparent)]',
        success: 'bg-[color-mix(in_oklch,var(--color-success)_18%,transparent)] text-[color-mix(in_oklch,var(--color-success)_95%,white)] border border-[color-mix(in_oklch,var(--color-success)_30%,transparent)]',
        danger: 'bg-[color-mix(in_oklch,var(--color-danger)_22%,transparent)] text-[color-mix(in_oklch,var(--color-danger)_95%,white)] border border-[color-mix(in_oklch,var(--color-danger)_35%,transparent)]',
        outline: 'border border-[var(--color-border-strong)] text-foreground/70',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';
