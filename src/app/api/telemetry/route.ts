import { NextResponse } from 'next/server';
import { getTelemetry } from '@/lib/database/storage-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const telemetry = await getTelemetry();
    return NextResponse.json(telemetry);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
