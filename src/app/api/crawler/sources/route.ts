import { NextResponse } from 'next/server';
import { getAllSources, addSource, removeSource, CrawlSource } from '@/lib/crawler/source-registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sources = await getAllSources();
    return NextResponse.json(
      { success: true, count: sources.length, sources },
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
    const body = await req.json();
    if (!body.name || !body.url || !body.type || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required source fields: name, url, type, category' },
        { status: 400 }
      );
    }

    const newSource = await addSource({
      name: body.name.trim(),
      url: body.url.trim(),
      type: body.type,
      category: body.category,
      reliabilityScore: typeof body.reliabilityScore === 'number' ? body.reliabilityScore : 0.9,
      enabled: body.enabled !== false,
      refreshIntervalSeconds: body.refreshIntervalSeconds || 10,
    });

    return NextResponse.json({ success: true, source: newSource });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing source id' }, { status: 400 });
    }

    const removed = await removeSource(id);
    return NextResponse.json({ success: removed, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
