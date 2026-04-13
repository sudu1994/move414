'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { LayoutDashboard, Truck, Wrench, Users, UserCheck, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin',             label: 'Overview',    icon: LayoutDashboard },
  { href: '/admin/bookings',    label: 'Bookings',    icon: Truck },
  { href: '/admin/utilities',   label: 'Utilities',   icon: Wrench },
  { href: '/admin/users',       label: 'Users',       icon: Users },
  { href: '/admin/partners',    label: 'Partners',    icon: Building2 },
  { href: '/admin/gig-workers', label: 'Gig workers', icon: UserCheck },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-background flex flex-col shrink-0">
        <div className="h-14 flex items-center gap-2 px-4 border-b shrink-0">
          <span className="font-bold text-primary">MOVE</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">Admin</span>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/admin' && path.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}>
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t flex items-center gap-2 shrink-0">
          <UserButton afterSignOutUrl="/" />
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">← App</Link>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
