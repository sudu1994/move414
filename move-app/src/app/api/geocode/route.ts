import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Japan postal code geocoding via free zipcloud API
// https://zipcloud.ibsnet.co.jp/api/search

interface ZipCloudResult {
  status: number;
  results: Array<{
    address1: string; // prefecture
    address2: string; // city
    address3: string; // town
    kana1: string;
    kana2: string;
    kana3: string;
    prefcode: string;
    zipcode: string;
  }> | null;
}

// Approximate lat/lng centers per prefecture (fallback)
const PREFECTURE_COORDS: Record<string, [number, number]> = {
  '01': [43.0642, 141.3469], // Hokkaido
  '13': [35.6762, 139.6503], // Tokyo
  '14': [35.4478, 139.6425], // Kanagawa
  '11': [35.8569, 139.6489], // Saitama
  '12': [35.6073, 140.1063], // Chiba
  '27': [34.6937, 135.5022], // Osaka
  '23': [35.1802, 136.9066], // Aichi
  '28': [34.6913, 135.1830], // Hyogo
  '40': [33.5903, 130.4017], // Fukuoka
  '26': [35.0116, 135.7681], // Kyoto
};

export async function GET(req: NextRequest) {
  const { userId: clerkId } = auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postal = searchParams.get('postal')?.replace('-', '');

  if (!postal || postal.length !== 7) {
    return NextResponse.json({ error: 'Invalid postal code (must be 7 digits)' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postal}`);
    const data: ZipCloudResult = await res.json();

    if (data.status !== 200 || !data.results?.[0]) {
      return NextResponse.json({ error: 'Postal code not found' }, { status: 404 });
    }

    const result = data.results[0];
    // Use prefecture code to get approximate coordinates
    const coords = PREFECTURE_COORDS[result.prefcode] ?? [35.6762, 139.6503];

    return NextResponse.json({
      success: true,
      data: {
        postalCode: result.zipcode,
        prefecture: result.address1,
        city: result.address2,
        town: result.address3,
        lat: coords[0],
        lng: coords[1],
        prefCode: result.prefcode,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 });
  }
}
