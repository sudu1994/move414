import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Admin — Gig Workers' };

export default async function AdminGigWorkersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');
  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  const workers = await db.gigWorker.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: [{ isAvailable: 'desc' }, { rating: 'desc' }],
  });

  const available = workers.filter((w) => w.isAvailable).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gig workers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workers.length} total · {available} available now
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">{available} available</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {['Worker', 'Areas', 'Status', 'Rating', 'Jobs', 'Last ping', 'Verified'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {workers.map((w) => (
              <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {w.prefecture.slice(0, 3).map((p) => (
                      <span key={p} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                    {w.prefecture.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{w.prefecture.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${w.isAvailable ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                    <span className="text-xs">{w.isAvailable ? 'Available' : 'Busy'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{w.rating} ★</td>
                <td className="px-4 py-3 text-xs text-center">{w._count.bookings}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {w.lastPingAt ? formatDateTime(w.lastPingAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    w.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {w.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workers.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No gig workers registered yet.
          </div>
        )}
      </div>

      {/* SMS dispatch info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
        <p className="font-medium text-blue-800 mb-1">SMS dispatch system</p>
        <p className="text-blue-700 text-xs leading-relaxed">
          Workers receive SMS when a booking is assigned to their area. They reply YES to confirm or NO to pass.
          Availability auto-resets after 24h. Configure via Twilio webhook at{' '}
          <code className="bg-blue-100 px-1 rounded">/api/gig-workers</code>.
        </p>
      </div>
    </div>
  );
}
