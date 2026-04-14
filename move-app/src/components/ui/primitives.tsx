import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

// ─── Progress ─────────────────────────────────────────────
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;
export { Progress };

// ─── Separator ────────────────────────────────────────────
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]', className)}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;
export { Separator };

// ─── Avatar ───────────────────────────────────────────────
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full', className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback ref={ref} className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium', className)} {...props} />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
export { Avatar, AvatarImage, AvatarFallback };

// ─── Skeleton ─────────────────────────────────────────────
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
export { Skeleton };

// ─── StatCard ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({ label, value, sub, icon, trend, trendValue, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <div className="text-primary opacity-70">{icon}</div>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {(sub || trendValue) && (
        <div className="flex items-center gap-2 mt-1">
          {trendValue && (
            <span className={cn(
  'text-xs font-medium',
  trend === 'up' && 'text-green-600',
  trend === 'down' && 'text-red-500',
  (trend === 'neutral' || !trend) && 'text-muted-foreground'
)})}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:      { label: 'Active',      className: 'bg-green-100 text-green-800' },
  PENDING:     { label: 'Pending',     className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED:   { label: 'Confirmed',   className: 'bg-blue-100 text-blue-800' },
  ASSIGNED:    { label: 'Assigned',    className: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-indigo-100 text-indigo-800' },
  COMPLETED:   { label: 'Completed',   className: 'bg-green-100 text-green-800' },
  CANCELLED:   { label: 'Cancelled',   className: 'bg-red-100 text-red-800' },
  PAST_DUE:    { label: 'Past due',    className: 'bg-orange-100 text-orange-800' },
  FAILED:      { label: 'Failed',      className: 'bg-red-100 text-red-800' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}
