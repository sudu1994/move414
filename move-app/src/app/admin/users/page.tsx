import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDate, formatYen } from '@/lib/utils';

export const metadata = { title: 'Admin — Users' };

export default async function AdminUsersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');
  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  const users = await db.user.findMany({
    include: {
      subscription: true,
      _count: { select: { bookings: true, utilityRequests: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered</p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Name / Email', 'Language', 'Plan', 'MRR', 'Bookings', 'Utilities', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[140px]">{u.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{u.language}</td>
                  <td className="px-4 py-3">
                    {u.subscription ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {u.subscription.planType}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {u.subscription ? formatYen(u.subscription.monthlyPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-center">{u._count.bookings}</td>
                  <td className="px-4 py-3 text-xs text-center">{u._count.utilityRequests}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
