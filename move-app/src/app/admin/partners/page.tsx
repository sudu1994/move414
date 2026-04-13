import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatYen } from '@/lib/utils';
import { AddPartnerForm } from '@/components/forms/add-partner-form';
import { Truck, Star } from 'lucide-react';

export const metadata = { title: 'Admin — Partners' };

export default async function AdminPartnersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');
  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  const partners = await db.partner.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { rating: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moving partners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{partners.length} registered</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Partner list */}
        <div className="lg:col-span-2 space-y-3">
          {partners.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No partners yet. Add your first moving company partner.
            </div>
          )}
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Truck size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{p.companyName}</p>
                    <p className="text-xs text-muted-foreground">{p.email} · {p.phone}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
                }`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Rating',    value: `${p.rating} ★` },
                  { label: 'Trucks',    value: p.truckCount },
                  { label: 'Max km',    value: `${p.maxDistanceKm} km` },
                  { label: 'Bookings',  value: p._count.bookings },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-2 text-center">
                    <p className="font-medium text-sm">{value}</p>
                    <p className="text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex gap-1.5 flex-wrap">
                {p.prefecture.map((pref) => (
                  <span key={pref} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {pref}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Contract rate: {formatYen(p.contractRate)}/move
              </p>
            </div>
          ))}
        </div>

        {/* Add partner form */}
        <div>
          <div className="rounded-xl border bg-card p-5 sticky top-6">
            <h2 className="font-semibold mb-4 text-sm">Add partner</h2>
            <AddPartnerForm />
          </div>
        </div>
      </div>
    </div>
  );
}
