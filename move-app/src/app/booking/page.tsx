import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { BookingForm } from '@/components/forms/booking-form';
import { PLANS } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Book a Move' };

export default async function BookingPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { subscription: true },
  });
  if (!user) redirect('/auth/login');

  const sub = user.subscription;
  const plan = sub ? PLANS[sub.planType] : null;

  // Check eligibility
  const canMove = sub
    ? new Date() >= new Date(sub.nextMoveEligibleDate) && sub.movesUsed < sub.movesAllowed && sub.status === 'ACTIVE'
    : false;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Book a move</h1>
        <p className="text-muted-foreground text-sm mt-1">引越し予約</p>
      </div>

      {!sub && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 flex items-start gap-3 mb-6">
          <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">No active subscription</p>
            <p className="text-sm text-yellow-700 mt-1">
              You need an active MOVE subscription to book a move. Choose a plan first.
            </p>
          </div>
        </div>
      )}

      {sub && !canMove && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex items-start gap-3 mb-6">
          <AlertTriangle size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Move not yet available</p>
            <p className="text-sm text-blue-700 mt-1">
              Your next move is available on{' '}
              <strong>{new Date(sub.nextMoveEligibleDate).toLocaleDateString()}</strong>.
              Your plan allows 1 move per 2-year contract.
            </p>
          </div>
        </div>
      )}

      {(canMove || !sub) && (
        <BookingForm
          userId={user.id}
          planType={plan?.nameEn}
          maxDistanceKm={plan?.maxDistanceKm ?? 20}
        />
      )}
    </div>
  );
}
