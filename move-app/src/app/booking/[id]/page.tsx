import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatDate, formatYen, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/primitives';
import {
  Truck, MapPin, Clock, Home, User,
  Calendar, AlertTriangle, CheckCircle2, ChevronLeft,
} from 'lucide-react';

export const metadata = { title: 'Booking details' };

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user) redirect('/auth/login');

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: { partner: true, worker: true },
  });

  if (!booking || booking.userId !== user.id) notFound();

  const rows = [
    { label: 'From',      value: `${booking.fromAddress}, ${booking.fromCity}, ${booking.fromPrefecture} ${booking.fromPostal}` },
    { label: 'To',        value: `${booking.toAddress}, ${booking.toCity}, ${booking.toPrefecture} ${booking.toPostal}` },
    { label: 'Room size', value: booking.roomSize },
    { label: 'Move date', value: `${formatDate(booking.moveDate)} (${booking.moveTimeSlot})` },
    { label: 'Distance',  value: `${booking.distanceKm} km` },
    booking.floorFrom ? { label: 'Floor (from)', value: `${booking.floorFrom}F · ${booking.hasElevatorFrom ? 'elevator' : 'no elevator'}` } : null,
    booking.floorTo   ? { label: 'Floor (to)',   value: `${booking.floorTo}F · ${booking.hasElevatorTo ? 'elevator' : 'no elevator'}` }   : null,
    booking.notes     ? { label: 'Notes',        value: booking.notes } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const pricingRows = [
    { label: 'Base cost',          value: formatYen(booking.baseCost) },
    booking.surcharge > 0
      ? { label: 'Surcharge',      value: `+${formatYen(booking.surcharge)}` }
      : null,
    { label: 'Total cost',         value: formatYen(booking.totalCost),    bold: true },
    { label: 'Covered by plan',    value: formatYen(booking.coveredByPlan) },
    { label: 'Your payment',       value: formatYen(booking.customerPays), highlight: booking.customerPays > 0 },
  ].filter(Boolean) as { label: string; value: string; bold?: boolean; highlight?: boolean }[];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link href="/booking/history" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 w-fit">
          <ChevronLeft size={14} /> All bookings
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{booking.fromCity} → {booking.toCity}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Booking #{booking.id.slice(-8).toUpperCase()}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Status timeline */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4 text-sm">Status</h2>
        <div className="flex items-center gap-0">
          {['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((s, i, arr) => {
            const statuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
            const currentIdx = statuses.indexOf(booking.status);
            const done = i <= currentIdx && booking.status !== 'CANCELLED';
            const current = i === currentIdx;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-colors ${
                    done    ? 'bg-primary border-primary text-primary-foreground' :
                    current ? 'border-primary text-primary' :
                    'border-muted text-muted-foreground'
                  }`}>
                    {done && i < currentIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">
                    {s.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-px flex-1 mb-4 ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
        {booking.status === 'CANCELLED' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">
            <AlertTriangle size={14} />
            Cancelled{booking.cancellationNote ? `: ${booking.cancellationNote}` : ''}
          </div>
        )}
        {booking.status === 'COMPLETED' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2.5">
            <CheckCircle2 size={14} />
            Completed {booking.completedAt ? `on ${formatDate(booking.completedAt)}` : ''}
          </div>
        )}
      </div>

      {/* Partner */}
      {booking.partner && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3 text-sm">Assigned partner</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{booking.partner.companyName}</p>
              <p className="text-xs text-muted-foreground">{booking.partner.phone}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-sm font-medium">{booking.partner.rating} ★</p>
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="rounded-xl border bg-card divide-y">
        <div className="px-5 py-3">
          <h2 className="font-semibold text-sm">Move details</h2>
        </div>
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between px-5 py-3 text-sm gap-3">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="font-medium text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="rounded-xl border bg-card divide-y">
        <div className="px-5 py-3">
          <h2 className="font-semibold text-sm">Pricing</h2>
        </div>
        {pricingRows.map(({ label, value, bold, highlight }) => (
          <div key={label} className={`flex justify-between px-5 py-3 text-sm ${highlight ? 'bg-orange-50' : ''}`}>
            <span className="text-muted-foreground">{label}</span>
            <span className={`${bold ? 'font-bold' : 'font-medium'} ${highlight ? 'text-orange-700' : ''}`}>
              {value}
            </span>
          </div>
        ))}
        {booking.isPeakSeason && (
          <div className="px-5 py-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50">
            <AlertTriangle size={12} />
            Peak season surcharge included (Feb–Apr)
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="text-xs text-muted-foreground flex gap-4">
        <span>Created: {formatDateTime(booking.createdAt)}</span>
        {booking.confirmedAt && <span>Confirmed: {formatDateTime(booking.confirmedAt)}</span>}
      </div>
    </div>
  );
}
