import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/primitives';

export const metadata = { title: 'Admin — Utilities' };

export default async function AdminUtilitiesPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');
  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  const requests = await db.utilityRequest.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const pending = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utility requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{requests.length} total · {pending} pending</p>
        </div>
        {pending > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1.5 rounded-full">
            {pending} need action
          </span>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Customer', 'Type', 'City', 'Move-in', 'Language', 'Contact', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => (
                <tr key={r.id} className={`hover:bg-muted/30 transition-colors ${r.status === 'PENDING' ? 'bg-yellow-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[120px]">{r.user.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{r.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {r.utilityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.city}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(r.moveInDate)}</td>
                  <td className="px-4 py-3 text-xs">{r.language}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.preferredContact ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No requests yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
