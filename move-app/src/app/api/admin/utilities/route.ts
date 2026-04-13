import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  requestId: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  completedSteps: z.array(z.string()).optional(),
  adminNotes: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { requestId, status, completedSteps, adminNotes } = updateSchema.parse(body);

  const updated = await db.utilityRequest.update({
    where: { id: requestId },
    data: {
      status,
      ...(completedSteps && { completedSteps }),
      ...(adminNotes && { adminNotes }),
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
    },
    include: { user: true },
  });

  // Notify customer on completion
  if (status === 'COMPLETED') {
    await db.notification.create({
      data: {
        userId: updated.userId,
        type: 'utility_completed',
        title: 'Utilities setup complete!',
        body: `Your ${updated.utilityType} setup at ${updated.city} is done. All ${completedSteps?.length ?? 0} service(s) activated.`,
      },
    });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const requests = await db.utilityRequest.findMany({
    where: status ? { status: status as any } : undefined,
    include: { user: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return NextResponse.json({ success: true, data: requests });
}
