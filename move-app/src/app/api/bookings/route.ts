import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { calculateMoveCost, calculateDistance } from '@/lib/utils';
import { sendSMS, SMS } from '@/lib/sms';
import { sendEmail, bookingConfirmedEmail } from '@/lib/email';
import { z } from 'zod';

const bookingSchema = z.object({
  fromAddress: z.string().min(5),
  fromPrefecture: z.string().min(1),
  fromCity: z.string().min(1),
  fromPostal: z.string().min(7),
  toAddress: z.string().min(5),
  toPrefecture: z.string().min(1),
  toCity: z.string().min(1),
  toPostal: z.string().min(7),
  roomSize: z.string().min(1),
  moveDate: z.string().min(1),
  moveTimeSlot: z.enum(['morning', 'afternoon', 'evening']),
  floorFrom: z.number().optional(),
  floorTo: z.number().optional(),
  hasElevatorFrom: z.boolean().default(false),
  hasElevatorTo: z.boolean().default(false),
  notes: z.string().optional(),
  specialItems: z.array(z.string()).default([]),
});

const PREF_COORDS: Record<string, [number, number]> = {
  '01': [43.0642, 141.3469], '13': [35.6762, 139.6503], '14': [35.4478, 139.6425],
  '11': [35.8569, 139.6489], '12': [35.6073, 140.1063], '27': [34.6937, 135.5022],
  '23': [35.1802, 136.9066], '28': [34.6913, 135.1830], '40': [33.5903, 130.4017],
  '26': [35.0116, 135.7681], '28': [34.6913, 135.1830],
};

async function geocodePostal(postal: string): Promise<[number, number] | null> {
  try {
    const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postal.replace('-', '')}`);
    const data = await res.json();
    if (data.status !== 200 || !data.results?.[0]) return null;
    return PREF_COORDS[data.results[0].prefcode] ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = bookingSchema.parse(body);

    const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sub = user.subscription;
    if (sub && sub.movesUsed >= sub.movesAllowed) {
      return NextResponse.json({ error: 'No moves remaining in contract' }, { status: 400 });
    }

    // Geocode for real distance
    let distanceKm = 15;
    const [fromCoords, toCoords] = await Promise.all([
      geocodePostal(data.fromPostal),
      geocodePostal(data.toPostal),
    ]);
    if (fromCoords && toCoords) {
      distanceKm = calculateDistance(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]);
    }

    const moveDate = new Date(data.moveDate);
    const pricing  = sub
      ? calculateMoveCost({ planType: sub.planType, distanceKm, moveDate, roomSize: data.roomSize })
      : { baseCost: 60000, distanceSurcharge: 0, peakSurcharge: 0, totalCost: 60000, coveredByPlan: 0, customerPays: 60000 };

    const partner = await db.partner.findFirst({
      where: { isActive: true, prefecture: { has: data.fromPrefecture } },
      orderBy: { rating: 'desc' },
    });

    const booking = await db.booking.create({
      data: {
        userId: user.id,
        subscriptionId: sub?.id,
        partnerId: partner?.id,
        status: 'PENDING',
        fromAddress: data.fromAddress, fromPrefecture: data.fromPrefecture,
        fromCity: data.fromCity,       fromPostal: data.fromPostal,
        toAddress: data.toAddress,     toPrefecture: data.toPrefecture,
        toCity: data.toCity,           toPostal: data.toPostal,
        distanceKm,
        roomSize: data.roomSize,       moveDate,
        moveTimeSlot: data.moveTimeSlot,
        floorFrom: data.floorFrom,     floorTo: data.floorTo,
        hasElevatorFrom: data.hasElevatorFrom,
        hasElevatorTo: data.hasElevatorTo,
        notes: data.notes,
        specialItems: data.specialItems,
        baseCost: pricing.baseCost,
        surcharge: pricing.distanceSurcharge + pricing.peakSurcharge,
        totalCost: pricing.totalCost,
        coveredByPlan: pricing.coveredByPlan,
        customerPays: pricing.customerPays,
        isPeakSeason: pricing.peakSurcharge > 0,
      },
    });

    if (sub) {
      await db.subscription.update({
        where: { id: sub.id },
        data: {
          movesUsed: { increment: 1 },
          nextMoveEligibleDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await db.notification.create({
      data: {
        userId: user.id,
        type: 'booking_created',
        title: 'Booking submitted',
        body: `Move from ${data.fromCity} to ${data.toCity} on ${data.moveDate}. We'll confirm within 24h.`,
      },
    });

    const lang: 'en' | 'ja' = user.language === 'JA' ? 'ja' : 'en';

    // Fire-and-forget notifications
    Promise.allSettled([
      user.phone ? sendSMS(user.phone, SMS.bookingConfirmed({
        name: user.name ?? 'Customer',
        moveDate: data.moveDate, fromCity: data.fromCity, toCity: data.toCity, lang,
      })) : Promise.resolve(),
      user.email ? sendEmail({
        to: user.email,
        subject: lang === 'ja' ? '【MOVE】引越し予約を受け付けました' : '[MOVE] Booking received',
        html: bookingConfirmedEmail({
          name: user.name ?? 'Customer',
          fromCity: data.fromCity,     toCity: data.toCity,
          moveDate: data.moveDate,     moveTimeSlot: data.moveTimeSlot,
          partnerName: partner?.companyName,
          totalCost: pricing.totalCost,
          customerPays: pricing.customerPays,
        }),
      }) : Promise.resolve(),
    ]).catch(console.error);

    return NextResponse.json({ success: true, data: { bookingId: booking.id, distanceKm } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const bookings = await db.booking.findMany({
      where: { userId: user.id },
      include: { partner: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
