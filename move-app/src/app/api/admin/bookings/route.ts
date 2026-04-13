import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  bookingId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  partnerId: z.string().optional(),
  workerId: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data = schema.parse(body);

  const booking = await db.booking.update({
    where: { id: data.bookingId },
    data: {
      status: data.status,
      ...(data.partnerId && { partnerId: data.partnerId }),
      ...(data.workerId && { workerId: data.workerId }),
      ...(data.status === 'CONFIRMED' && { confirmedAt: new Date() }),
      ...(data.status === 'COMPLETED' && { completedAt: new Date() }),
      ...(data.status === 'CANCELLED' && { cancelledAt: new Date(), cancellationNote: data.note }),
    },
    include: { user: true },
  });

  // Notify customer
  await db.notification.create({
    data: {
      userId: booking.userId,
      type: `booking_${data.status.toLowerCase()}`,
      title: `Booking ${data.status.toLowerCase()}`,
      body: data.status === 'CONFIRMED'
        ? `Your move from ${booking.fromCity} to ${booking.toCity} is confirmed!`
        : data.status === 'CANCELLED'
        ? `Your booking was cancelled. ${data.note ?? ''}`
        : `Booking status updated to ${data.status}`,
    },
  });

  return NextResponse.json({ success: true, data: booking });
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Number(searchParams.get('limit') ?? 50);

  const bookings = await db.booking.findMany({
    where: status ? { status: status as any } : undefined,
    include: { user: true, partner: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ success: true, data: bookings });
}
