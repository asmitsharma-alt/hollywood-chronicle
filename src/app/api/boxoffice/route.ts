import { NextResponse } from 'next/server';
import { getTrendingCinema } from '@/lib/tmdb';

export async function GET() {
  try {
    const items = await getTrendingCinema();
    return NextResponse.json({ success: true, results: items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
