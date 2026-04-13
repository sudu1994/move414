import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDate, formatYen } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/primitives';

export const metadata = { title: 'Admin — Bookings' };

export default async function AdminBookingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  const bookings = await db.booking.findMany({
    include: { user: true, partner: true, worker: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{bookings.length} total</p>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full">
            <StatusBadge status={status} />
            <span className="font-medium">{count}</span>
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Customer', 'Route', 'Room', 'Date', 'Cost', 'Partner', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[120px]">{b.user.name ?? b.user.email}</p>
                    <p className="text-xs text-muted-foreground">{b.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{b.fromCity}</p>
                    <p className="text-muted-foreground">→ {b.toCity}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{b.roomSize}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(b.moveDate)}</td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-medium">{formatYen(b.totalCost)}</p>
                    {b.customerPays > 0 && (
                      <p className="text-muted-foreground">Customer: {formatYen(b.customerPays)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {b.partner?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No bookings yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
