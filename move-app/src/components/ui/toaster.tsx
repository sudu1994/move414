'use client';
import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]', className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: 'default' | 'success' | 'destructive' | 'info' }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-sm transition-all',
  'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
  'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-out',
  'data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full',
  variant === 'default' && 'bg-background border',
  variant === 'success' && 'bg-green-50 border-green-200',
  variant === 'destructive' && 'bg-red-50 border-red-200',
  variant === 'info' && 'bg-blue-50 border-blue-200',
  className
)}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100', className)}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

// ─── useToast hook ────────────────────────────────────────
type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
  duration?: number;
};

type ToastState = ToastProps & { id: string; open: boolean };

const toastListeners: Array<(toast: ToastState) => void> = [];
let toastCount = 0;

export function toast(props: ToastProps) {
  const id = String(toastCount++);
  toastListeners.forEach((l) => l({ ...props, id, open: true }));
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  React.useEffect(() => {
    const handler = (t: ToastState) => setToasts((prev) => [...prev, t]);
    toastListeners.push(handler);
    return () => {
      const idx = toastListeners.indexOf(handler);
      if (idx > -1) toastListeners.splice(idx, 1);
    };
  }, []);

  return { toasts, dismiss: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)) };
}

// ─── Toaster (place in layout) ────────────────────────────
export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} open={open} onOpenChange={(o) => !o && dismiss(id)} variant={variant}>
          <div className="flex items-start gap-3">
            {variant === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
            {variant === 'destructive' && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />}
            {variant === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />}
            <div className="flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
