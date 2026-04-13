import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatDate, formatYen } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/primitives';
import { Truck, Plus, Clock, MapPin } from 'lucide-react';

export const metadata = { title: 'My Bookings' };

export default async function BookingHistoryPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { subscription: true },
  });
  if (!user) redirect('/auth/login');

  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const active = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const past   = bookings.filter((b) =>  ['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">引越し予約一覧</p>
        </div>
        <Link
          href="/booking"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> New booking
        </Link>
      </div>

      {bookings.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <Truck size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No bookings yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Book your first move when you're ready.</p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <Plus size={14} /> Book a move
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Active ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Past ({past.length})
          </h2>
          <div className="space-y-3 opacity-80">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: any }) {
  return (
    <Link
      href={`/booking/${b.id}`}
      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
    >
      <div className="p-3 bg-primary/10 rounded-xl shrink-0 w-fit">
        <Truck size={20} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{b.fromCity} → {b.toCity}</p>
          <StatusBadge status={b.status} />
          {b.isPeakSeason && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">繁忙期</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatDate(b.moveDate)} · {b.moveTimeSlot}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {b.roomSize}
          </span>
          {b.customerPays > 0 && (
            <span className="text-orange-600 font-medium">
              You pay: {formatYen(b.customerPays)}
            </span>
          )}
          {b.customerPays === 0 && b.coveredByPlan && (
            <span className="text-green-600 font-medium">Covered by plan</span>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        View →
      </span>
    </Link>
  );
}
