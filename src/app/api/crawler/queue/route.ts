import { NextResponse } from 'next/server';
import { globalCrawlQueue } from '@/lib/crawler/crawl-queue';
import { runFastAutonomousSweep, runAutonomousCycle } from '@/lib/engine/autonomous-worker';
import { getTelemetry } from '@/lib/database/storage-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = globalCrawlQueue.getMetrics();
    const jobs = globalCrawlQueue.getRecentJobs(8);
    const telemetry = await getTelemetry();

    return NextResponse.json(
      {
        success: true,
        metrics,
        jobs,
        telemetry,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;

    if (force) {
      const report = await runAutonomousCycle(true);
      return NextResponse.json({ success: true, mode: 'full_cycle', report });
    }

    const sweepResult = await runFastAutonomousSweep();
    return NextResponse.json({ success: true, mode: 'fast_sweep_10s', sweepResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
