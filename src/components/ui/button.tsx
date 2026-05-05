import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-medium ring-focus transition-[transform,box-shadow,background] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_40%,transparent),0_8px_24px_-12px_var(--color-primary)] hover:brightness-110',
        secondary:
          'glass text-foreground hover:bg-[color-mix(in_oklch,var(--color-surface-2)_90%,transparent)]',
        ghost: 'text-foreground/80 hover:text-foreground hover:bg-white/5',
        outline:
          'border border-[var(--color-border)] text-foreground hover:bg-white/5',
        danger:
          'bg-[var(--color-danger)] text-white hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
