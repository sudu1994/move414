'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard, Truck, Wrench, Sparkles, RefreshCcw,
  Scan, Bell, Settings, ChevronRight, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    labelJa: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/booking',      label: 'Book a move',  labelJa: '引越し予約',    icon: Truck },
  { href: '/utilities',    label: 'Utilities',    labelJa: '光熱費手続き',  icon: Wrench },
  { href: '/ai-design',    label: 'AI design',    labelJa: 'AI部屋提案',   icon: Sparkles },
  { href: '/room-scanner', label: 'Room scanner', labelJa: '3Dスキャン',   icon: Scan },
  { href: '/recycle',      label: 'Recycle',      labelJa: 'リサイクル',   icon: RefreshCcw },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
  userName?: string;
  planType?: string;
}

export function SidebarLayout({ children, userName, planType }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-background border-r flex flex-col transition-transform duration-200',
        'lg:translate-x-0 lg:static lg:z-auto',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b shrink-0">
          <Link href="/dashboard" className="text-xl font-bold text-primary tracking-tight">
            MOVE
          </Link>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Plan badge */}
        {planType && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">{planType} Plan · Active</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, labelJa, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={18} className={cn(active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className="leading-tight">{label}</p>
                  <p className="text-[10px] opacity-60 leading-tight">{labelJa}</p>
                </div>
                {active && <ChevronRight size={14} className="text-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t p-4 space-y-1 shrink-0">
          <Link
            href="/dashboard/notifications"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell size={18} />
            Notifications
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings size={18} />
            Settings
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 mt-2">
            <UserButton afterSignOutUrl="/" />
            {userName && <span className="text-sm text-muted-foreground truncate">{userName}</span>}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden h-14 border-b bg-background flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu size={20} />
          </button>
          <span className="font-bold text-primary">MOVE</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
