'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, History, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const subNav = [
  { href: '/dashboard/subscription', label: 'Overview',        icon: CreditCard },
  { href: '/booking/history',        label: 'Booking history', icon: History },
];

export function BookingSubNav() {
  const path = usePathname();
  return (
    <div className="flex gap-1 mb-5 border-b pb-3">
      {subNav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors',
            path === href
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <Icon size={14} />
          {label}
        </Link>
      ))}
    </div>
  );
}
