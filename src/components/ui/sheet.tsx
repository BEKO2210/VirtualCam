import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-radix-dialog-overlay
    className={cn('fixed inset-0 z-50 bg-black/60 backdrop-blur-sm', className)}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'right' | 'bottom' | 'left' | 'top';
  showClose?: boolean;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, side = 'right', showClose = true, children, ...props }, ref) => {
  const sideCls = {
    right: 'inset-y-0 right-0 h-full w-full sm:max-w-2xl border-l',
    left: 'inset-y-0 left-0 h-full w-full sm:max-w-md border-r',
    top: 'inset-x-0 top-0 w-full max-h-[85vh] border-b rounded-b-[var(--radius-lg)]',
    bottom: 'inset-x-0 bottom-0 w-full max-h-[88vh] border-t rounded-t-[var(--radius-lg)]',
  }[side];
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-side={side}
        className={cn(
          'fixed z-50 glass-strong border-[var(--color-border)] shadow-2xl outline-none flex flex-col',
          sideCls,
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-full p-2 text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors z-10">
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-1 px-5 py-4 border-b border-[var(--color-border)] shrink-0',
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-foreground/60', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';
