import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/types';
import type { PlanType } from '@/lib/types';
import { addMonths } from 'date-fns';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

// POST /api/subscriptions — create checkout session
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { planType } = await req.json();
    const plan = PLANS[planType as PlanType];
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.subscription?.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id, clerkId },
      });
      customerId = customer.id;
    }

    const priceId = process.env[plan.stripeEnvKey];
    if (!priceId) return NextResponse.json({ error: `Price not configured for ${planType}` }, { status: 500 });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#plans`,
      metadata: { userId: user.id, planType, clerkId },
      subscription_data: {
        metadata: { userId: user.id, planType },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/subscriptions — get current subscription
export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user.subscription });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
