import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/types';
import type { PlanType } from '@/lib/types';
import { addMonths } from 'date-fns';
import { sendEmail, subscriptionActivatedEmail } from '@/lib/email';
import { sendSMS, SMS } from '@/lib/sms';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const { userId, planType } = session.metadata ?? {};
        if (!userId || !planType) break;
        const plan = PLANS[planType as PlanType];
        if (!plan) break;
        const now = new Date();
        await db.subscription.upsert({
          where: { userId },
          update: {
            status: 'ACTIVE', planType: planType as PlanType,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            monthlyPrice: plan.monthlyPrice,
            contractStartDate: now,
            contractEndDate: addMonths(now, plan.contractMonths),
            nextMoveEligibleDate: now,
            maxDistanceKm: plan.maxDistanceKm,
            movesAllowed: plan.movesPerContract, movesUsed: 0,
          },
          create: {
            userId, planType: planType as PlanType, status: 'ACTIVE',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            monthlyPrice: plan.monthlyPrice,
            contractStartDate: now,
            contractEndDate: addMonths(now, plan.contractMonths),
            nextMoveEligibleDate: now,
            maxDistanceKm: plan.maxDistanceKm,
            movesAllowed: plan.movesPerContract, movesUsed: 0,
          },
        });
        await db.notification.create({
          data: {
            userId, type: 'subscription_activated',
            title: 'Subscription activated!',
            body: `Your ${plan.nameEn} plan is active. Book your first move now.`,
          },
        });
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user) {
          const lang: 'en' | 'ja' = user.language === 'JA' ? 'ja' : 'en';
          Promise.allSettled([
            user.email ? sendEmail({
              to: user.email,
              subject: lang === 'ja' ? '【MOVE】ご登録ありがとうございます' : '[MOVE] Welcome to MOVE!',
              html: subscriptionActivatedEmail({ name: user.name ?? 'Customer', planName: plan.nameEn, monthlyPrice: plan.monthlyPrice }),
            }) : null,
            user.phone ? sendSMS(user.phone, SMS.subscriptionActive({ name: user.name ?? 'Customer', plan: plan.nameEn, lang })) : null,
          ]).catch(console.error);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await db.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (!existing) break;
        await db.subscription.update({
          where: { id: existing.id },
          data: {
            status: sub.status === 'active' ? 'ACTIVE'
              : sub.status === 'past_due' ? 'PAST_DUE'
              : sub.status === 'canceled' ? 'CANCELLED' : 'ACTIVE',
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const existing = await db.subscription.findFirst({ where: { stripeCustomerId: invoice.customer as string } });
        if (existing) {
          await db.subscription.update({ where: { id: existing.id }, data: { status: 'PAST_DUE' } });
          await db.notification.create({
            data: { userId: existing.userId, type: 'payment_failed', title: 'Payment failed', body: 'Update your payment method to keep your subscription active.' },
          });
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
