import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatDate, formatYen } from '@/lib/utils';
import { PLANS } from '@/lib/types';
import { Progress } from '@/components/ui/primitives';
import { CheckCircle2, CreditCard, Calendar, Truck, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Subscription' };

export default async function SubscriptionPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { subscription: true },
  });
  if (!user) redirect('/auth/login');

  const sub  = user.subscription;
  const plan = sub ? PLANS[sub.planType] : null;

  const today = new Date();
  const contractProgress = sub
    ? Math.min(100, Math.round(
        ((today.getTime() - new Date(sub.contractStartDate).getTime()) /
          (new Date(sub.contractEndDate).getTime() - new Date(sub.contractStartDate).getTime())) * 100
      ))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-sm text-muted-foreground mt-0.5">サブスクリプション管理</p>
      </div>

      {!sub && (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center space-y-3">
          <p className="font-medium">No active subscription</p>
          <p className="text-sm text-muted-foreground">Choose a plan to unlock moving, utilities, and AI design.</p>
          <Link
            href="/#plans"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            View plans <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {sub && plan && (
        <>
          {/* Plan card */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{plan.nameJa}</p>
                <h2 className="text-xl font-bold">{plan.nameEn}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatYen(sub.monthlyPrice)}/month
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                sub.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : sub.status === 'PAST_DUE'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {sub.status}
              </span>
            </div>

            {/* Contract progress */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Contract progress</span>
                <span>{contractProgress}%</span>
              </div>
              <Progress value={contractProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{formatDate(sub.contractStartDate)}</span>
                <span>{formatDate(sub.contractEndDate)}</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Moves used',     value: `${sub.movesUsed} / ${sub.movesAllowed}`,      icon: Truck },
                { label: 'Max distance',   value: sub.maxDistanceKm >= 9999 ? 'Unlimited' : `${sub.maxDistanceKm} km`, icon: ArrowRight },
                { label: 'Next move',      value: new Date() >= new Date(sub.nextMoveEligibleDate) ? 'Now' : formatDate(sub.nextMoveEligibleDate), icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3 text-center">
                  <Icon size={14} className="mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-3 text-sm">Plan features</h3>
            <ul className="space-y-2">
              {plan.features.map((f, i) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                  <span>{f}</span>
                  {plan.featuresJa[i] && (
                    <span className="text-xs text-muted-foreground">·  {plan.featuresJa[i]}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Billing */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-3 text-sm">Billing</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <CreditCard size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Stripe subscription</p>
                  <p className="text-xs text-muted-foreground">Next billing: auto-renews monthly</p>
                </div>
              </div>
              <form action="/api/subscriptions/portal" method="POST">
                <button
                  type="submit"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Manage →
                </button>
              </form>
            </div>
          </div>

          {/* Upgrade prompts */}
          {sub.planType !== 'BUSINESS' && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary mb-1">Upgrade available</p>
              <p className="text-xs text-muted-foreground mb-3">
                {sub.planType === 'LITE' && 'Upgrade to Standard for 20km coverage and AI room design.'}
                {sub.planType === 'STANDARD' && 'Upgrade to Plus for 30km coverage and priority booking.'}
                {sub.planType === 'PLUS' && 'Upgrade to Business for unlimited moves and HR portal access.'}
              </p>
              <Link href="/#plans" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                See plans <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
