import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const pingSchema = z.object({
  workerId: z.string(),
  isAvailable: z.boolean(),
  prefecture: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prefecture = searchParams.get('prefecture');

  const workers = await db.gigWorker.findMany({
    where: {
      isVerified: true,
      ...(prefecture ? { prefecture: { has: prefecture } } : {}),
    },
    orderBy: [{ isAvailable: 'desc' }, { rating: 'desc' }],
    take: 20,
  });

  return NextResponse.json({ success: true, data: workers });
}

// Worker pings availability (called from their simple SMS → webhook or mobile form)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { workerId, isAvailable, prefecture } = pingSchema.parse(body);

  const worker = await db.gigWorker.update({
    where: { id: workerId },
    data: {
      isAvailable,
      lastPingAt: new Date(),
      ...(prefecture && { prefecture }),
    },
  });

  return NextResponse.json({ success: true, data: worker });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const worker = await db.gigWorker.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email,
      prefecture: body.prefecture ?? [],
      isVerified: false,
    },
  });

  return NextResponse.json({ success: true, data: worker }, { status: 201 });
}
