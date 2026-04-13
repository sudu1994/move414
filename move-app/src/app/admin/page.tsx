import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatYen, formatDate } from '@/lib/utils';
import { StatCard, StatusBadge } from '@/components/ui/primitives';
import { Users, TrendingUp, Truck, Wrench } from 'lucide-react';
import { PLANS } from '@/lib/types';

export const metadata = { title: 'Admin — MOVE' };

export default async function AdminPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  const [
    totalUsers, activeSubscriptions, pendingBookings,
    pendingUtilities, recentBookings, recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
    db.booking.count({ where: { status: 'PENDING' } }),
    db.utilityRequest.count({ where: { status: 'PENDING' } }),
    db.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    db.user.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    }),
  ]);

  // Calculate MRR
  const subscriptions = await db.subscription.findMany({ where: { status: 'ACTIVE' } });
  const mrr = subscriptions.reduce((sum, s) => sum + s.monthlyPrice, 0);

  // Plan distribution
  const planCounts = subscriptions.reduce((acc, s) => {
    acc[s.planType] = (acc[s.planType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">MOVE operations dashboard</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={totalUsers.toLocaleString()} icon={<Users size={18} />}
          trend="up" trendValue="+10.5% trend" sub="foreign residents" />
        <StatCard label="Monthly recurring revenue" value={formatYen(mrr)} icon={<TrendingUp size={18} />}
          trend="up" trendValue={`${activeSubscriptions} active`} />
        <StatCard label="Pending bookings" value={pendingBookings} icon={<Truck size={18} />}
          trend={pendingBookings > 10 ? 'down' : 'neutral'} sub="need assignment" />
        <StatCard label="Utility requests" value={pendingUtilities} icon={<Wrench size={18} />}
          sub="awaiting action" />
      </div>

      {/* Plan distribution */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Subscription breakdown</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.values(PLANS).map((plan) => {
            const count = planCounts[plan.id] ?? 0;
            const pct = activeSubscriptions > 0 ? Math.round((count / activeSubscriptions) * 100) : 0;
            return (
              <div key={plan.id} className="text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm font-medium mt-0.5">{plan.nameEn}</p>
                <p className="text-xs text-muted-foreground">{pct}% of subs</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Recent bookings</h2>
          <div className="space-y-2">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.user.name ?? b.user.email}</p>
                  <p className="text-xs text-muted-foreground">{b.fromCity} → {b.toCity} · {formatDate(b.moveDate)}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Recent users</h2>
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                </div>
                {u.subscription
                  ? <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {u.subscription.planType}
                    </span>
                  : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Free</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
