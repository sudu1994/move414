import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const recycleSchema = z.object({
  items: z.array(z.object({
    itemName: z.string().min(1),
    category: z.string().min(1),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']),
    description: z.string().optional(),
    estimatedValue: z.number().optional(),
  })).min(1),
  partnerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { items, partnerId } = recycleSchema.parse(body);

    const partner = partnerId
      ? await db.recyclePartner.findFirst({ where: { isActive: true } })
      : null;

    const created = await db.$transaction(
      items.map((item) =>
        db.recycleItem.create({
          data: {
            userId: user.id,
            partnerId: partner?.id,
            itemName: item.itemName,
            category: item.category,
            condition: item.condition,
            description: item.description,
            estimatedValue: item.estimatedValue,
            photoUrls: [],
            status: 'PENDING',
          },
        })
      )
    );

    await db.notification.create({
      data: {
        userId: user.id,
        type: 'recycle_submitted',
        title: 'Recycle request received',
        body: `${created.length} item(s) submitted for recycling. Our partner will contact you within 2 business days.`,
      },
    });

    return NextResponse.json({ success: true, data: { count: created.length } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Recycle API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = await db.recycleItem.findMany({
      where: { userId: user.id },
      include: { partner: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
