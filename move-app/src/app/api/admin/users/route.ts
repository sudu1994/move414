import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  userId: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'PARTNER', 'GIG_WORKER']).optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  const users = await db.user.findMany({
    where: q ? {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    } : undefined,
    include: {
      subscription: true,
      _count: { select: { bookings: true, utilityRequests: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ success: true, data: users });
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { userId, role } = schema.parse(body);

  const updated = await db.user.update({
    where: { id: userId },
    data: { ...(role && { role }) },
  });

  return NextResponse.json({ success: true, data: updated });
}
