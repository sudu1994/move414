import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  prefecture: z.array(z.string()).min(1),
  cities: z.array(z.string()).default([]),
  maxDistanceKm: z.number().default(30),
  truckCount: z.number().default(1),
  contractRate: z.number().min(10000),
});

export async function GET() {
  const partners = await db.partner.findMany({
    where: { isActive: true },
    include: { _count: { select: { bookings: true } } },
    orderBy: { rating: 'desc' },
  });
  return NextResponse.json({ success: true, data: partners });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const partner = await db.partner.create({ data });
  return NextResponse.json({ success: true, data: partner }, { status: 201 });
}
