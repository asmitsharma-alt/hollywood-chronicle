import { NextResponse } from 'next/server';
import { getAllArticles, getTelemetry } from '@/lib/database/storage-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [articles, telemetry] = await Promise.all([
      getAllArticles(),
      getTelemetry(),
    ]);

    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: 'healthy',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: 'online',
        totalArticles: articles.length,
        breakingCount: articles.filter(a => a.is_breaking).length,
      },
      worker: {
        status: telemetry.status,
        lastCycleCompleted: telemetry.last_cycle_completed_at,
        nextScheduledRun: telemetry.next_scheduled_run_at,
        cyclesCompleted: telemetry.total_cycles_completed,
      },
      system: {
        nodeVersion: process.version,
        rssMemoryMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'degraded', error: err.message },
      { status: 500 }
    );
  }
}
