import { NextResponse } from 'next/server';
import { getTrendingCinema } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getTrendingCinema();
    return NextResponse.json(
      { success: true, results: items },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
