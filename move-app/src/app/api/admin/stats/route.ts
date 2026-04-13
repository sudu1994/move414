import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date();

  // Active subscriptions
  const activeSubs = await db.subscription.findMany({
    where: { status: 'ACTIVE' },
  });
  const mrr = activeSubs.reduce((s, sub) => s + sub.monthlyPrice, 0);

  // Plan distribution
  const planCounts = activeSubs.reduce((acc, s) => {
    acc[s.planType] = (acc[s.planType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Bookings per month (last 6 months)
  const monthlyBookings = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      return db.booking.count({
        where: {
          createdAt: { gte: startOfMonth(d), lte: endOfMonth(d) },
        },
      }).then((count) => ({
        month: d.toLocaleString('default', { month: 'short' }),
        bookings: count,
      }));
    })
  );

  // New subscribers per month (last 6)
  const monthlySubscribers = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      return db.subscription.count({
        where: {
          contractStartDate: { gte: startOfMonth(d), lte: endOfMonth(d) },
        },
      }).then((count) => ({
        month: d.toLocaleString('default', { month: 'short' }),
        mrr: count * 3200, // approximate avg plan price
        subs: count,
      }));
    })
  );

  // Cancelled this month
  const cancelledThisMonth = await db.subscription.count({
    where: {
      status: 'CANCELLED',
      cancelledAt: { gte: startOfMonth(now) },
    },
  });

  // Pending actions
  const pendingBookings   = await db.booking.count({ where: { status: 'PENDING' } });
  const pendingUtilities  = await db.utilityRequest.count({ where: { status: 'PENDING' } });
  const totalUsers        = await db.user.count();

  const claimRate = activeSubs.length > 0
    ? Math.round((activeSubs.reduce((s, sub) => s + sub.movesUsed, 0) / activeSubs.length) * 100) / 100
    : 0;

  return NextResponse.json({
    success: true,
    data: {
      mrr,
      activeSubscriptions: activeSubs.length,
      totalUsers,
      pendingBookings,
      pendingUtilities,
      cancelledThisMonth,
      churnRate: activeSubs.length > 0 ? Math.round((cancelledThisMonth / activeSubs.length) * 100) : 0,
      avgClaimRate: claimRate,
      planCounts,
      monthlyBookings,
      monthlySubscribers,
    },
  });
}
