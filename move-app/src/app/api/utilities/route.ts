import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const utilitySchema = z.object({
  address: z.string().min(5),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(7),
  moveInDate: z.string().min(1),
  services: z.array(z.enum(['GAS', 'ELECTRICITY', 'WATER', 'INTERNET', 'ALL'])).min(1),
  gasProvider: z.string().optional(),
  elecProvider: z.string().optional(),
  internetType: z.string().optional(),
  preferredContact: z.enum(['email', 'phone', 'sms']).default('email'),
  language: z.string().default('EN'),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = utilitySchema.parse(body);

    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Create one request per service (or combined)
    const requests = await Promise.all(
      data.services.map((service) =>
        db.utilityRequest.create({
          data: {
            userId: user.id,
            utilityType: service,
            status: 'PENDING',
            address: data.address,
            prefecture: data.prefecture,
            city: data.city,
            postalCode: data.postalCode,
            moveInDate: new Date(data.moveInDate),
            gasProvider: data.gasProvider,
            elecProvider: data.elecProvider,
            internetType: data.internetType,
            preferredContact: data.preferredContact,
            language: data.language as 'JA' | 'EN' | 'ZH' | 'VI' | 'KO',
            notes: data.notes,
          },
        })
      )
    );

    // Notify
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'utility_submitted',
        title: 'Utility request received',
        body: `We will handle setup for: ${data.services.join(', ')} at ${data.city}. Expect updates within 2 business days.`,
      },
    });

    return NextResponse.json({ success: true, data: { count: requests.length } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Utilities API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const requests = await db.utilityRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
