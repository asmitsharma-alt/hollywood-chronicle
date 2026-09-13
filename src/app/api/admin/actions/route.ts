import { NextResponse } from 'next/server';
import { runAutonomousCycle } from '@/lib/engine/autonomous-worker';
import { getAllArticles, updateTelemetry, upsertArticle } from '@/lib/database/storage-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'trigger_worker') {
      const report = await runAutonomousCycle(true);
      return NextResponse.json({ success: true, report });
    }

    if (action === 'clear_logs') {
      await updateTelemetry({ recent_logs: [] });
      return NextResponse.json({ success: true, message: 'Crawler logs cleared.' });
    }

    if (action === 'resync') {
      const articles = await getAllArticles();
      return NextResponse.json({ success: true, totalArticles: articles.length });
    }

    return NextResponse.json({ error: 'Unknown action parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
