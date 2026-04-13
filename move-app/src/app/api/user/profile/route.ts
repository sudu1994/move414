import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const profileSchema = z.object({
  phone: z.string().optional(),
  language: z.enum(['JA', 'EN', 'ZH', 'VI', 'KO']).optional(),
  name: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = profileSchema.parse(body);

    const user = await db.user.update({
      where: { clerkId },
      data: {
        ...(data.phone && { phone: data.phone }),
        ...(data.language && { language: data.language }),
        ...(data.name && { name: data.name }),
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
