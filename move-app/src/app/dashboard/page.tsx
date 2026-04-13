import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatYen, formatDate, isPeakSeason } from '@/lib/utils';
import { StatCard, StatusBadge } from '@/components/ui/primitives';
import { PLANS } from '@/lib/types';
import {
  Truck, Wrench, Sparkles, RefreshCcw, ArrowRight,
  CalendarClock, AlertTriangle, CheckCircle2,
} from 'lucide-react';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      subscription: true,
      bookings: { orderBy: { createdAt: 'desc' }, take: 3 },
      utilityRequests: { orderBy: { createdAt: 'desc' }, take: 2 },
      notifications: { where: { isRead: false }, take: 5, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user) redirect('/auth/login');

  const sub = user.subscription;
  const plan = sub ? PLANS[sub.planType] : null;
  const today = new Date();
  const peakWarning = isPeakSeason(today);

  // Move eligibility
  const canMove = sub
    ? new Date() >= new Date(sub.nextMoveEligibleDate) && sub.movesUsed < sub.movesAllowed
    : false;

  const daysUntilNextMove = sub
    ? Math.max(0, Math.ceil((new Date(sub.nextMoveEligibleDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Contract progress
  const contractProgress = sub
    ? Math.min(100, Math.round(
        ((today.getTime() - new Date(sub.contractStartDate).getTime()) /
          (new Date(sub.contractEndDate).getTime() - new Date(sub.contractStartDate).getTime())) * 100
      ))
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here&apos;s your MOVE overview</p>
      </div>

      {/* Peak season warning */}
      {peakWarning && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
          <AlertTriangle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">繁忙期 Peak season active</p>
            <p className="text-yellow-700 mt-0.5">
              A ¥10,000–20,000 surcharge applies to moves booked now. Off-season ends mid-April.
            </p>
          </div>
        </div>
      )}

      {/* No subscription CTA */}
      {!sub && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
          <div className="text-primary mb-3">
            <Truck size={32} className="mx-auto" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No active subscription</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Choose a plan to start using MOVE. From ¥1,980/month.
          </p>
          <Link
            href="/#plans"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            View plans <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Subscription card */}
      {sub && plan && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{plan.nameJa} プラン</p>
              <h2 className="text-lg font-bold">{plan.nameEn} Plan</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatYen(plan.monthlyPrice)}/month · Contract until {formatDate(sub.contractEndDate)}
              </p>
            </div>
            <StatusBadge status={sub.status} />
          </div>

          {/* Contract progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Contract progress</span>
              <span>{contractProgress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${contractProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
              <span>{formatDate(sub.contractStartDate)}</span>
              <span>{formatDate(sub.contractEndDate)}</span>
            </div>
          </div>

          {/* Move status */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              {canMove ? (
                <CheckCircle2 size={16} className="text-green-600" />
              ) : (
                <CalendarClock size={16} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {canMove ? 'You can book your move now!' : 'Next move available'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {canMove
                    ? `${sub.movesAllowed - sub.movesUsed} move(s) remaining this contract`
                    : daysUntilNextMove === 0
                    ? 'Available today'
                    : `In ${daysUntilNextMove} days · ${formatDate(sub.nextMoveEligibleDate)}`}
                </p>
              </div>
            </div>
            {canMove && (
              <Link
                href="/booking"
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Book now
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/booking',   icon: Truck,       label: 'Book a move',   labelJa: '引越し予約',   color: 'text-blue-600 bg-blue-50' },
            { href: '/utilities', icon: Wrench,      label: 'Utilities',     labelJa: '光熱費手続き', color: 'text-orange-600 bg-orange-50' },
            { href: '/ai-design', icon: Sparkles,    label: 'AI design',     labelJa: 'AI部屋提案',  color: 'text-purple-600 bg-purple-50' },
            { href: '/recycle',   icon: RefreshCcw,  label: 'Recycle',       labelJa: 'リサイクル',  color: 'text-green-600 bg-green-50' },
          ].map(({ href, icon: Icon, label, labelJa, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground">{labelJa}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      {user.bookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">RECENT BOOKINGS</h2>
            <Link href="/booking" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {user.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Truck size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{b.fromCity} → {b.toCity}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(b.moveDate)} · {b.roomSize}</p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utility requests */}
      {user.utilityRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">UTILITY REQUESTS</h2>
            <Link href="/utilities" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {user.utilityRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Wrench size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.city} · {r.utilityType}</p>
                    <p className="text-xs text-muted-foreground">Move-in: {formatDate(r.moveInDate)}</p>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
