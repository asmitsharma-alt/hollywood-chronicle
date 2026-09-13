import { NextResponse } from 'next/server';
import { runAutonomousCycle } from '@/lib/engine/autonomous-worker';
import { getTelemetry } from '@/lib/database/storage-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow full crawl cycle

export async function GET(req: Request) {
  return handleTrigger(req);
}

export async function POST(req: Request) {
  return handleTrigger(req);
}

async function handleTrigger(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured, check authorization
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check url search params for secret
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');
    if (querySecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === 'true';

  try {
    const report = await runAutonomousCycle(force);
    const telemetry = await getTelemetry();

    return NextResponse.json({
      status: 'success',
      report,
      telemetry,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Autonomous worker cron error:', err);
    return NextResponse.json(
      { error: err.message || 'Worker execution failure' },
      { status: 500 }
    );
  }
}
