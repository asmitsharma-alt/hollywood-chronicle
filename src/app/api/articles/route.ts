import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/database/storage-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('q')?.toLowerCase().trim();
    const category = url.searchParams.get('category')?.toLowerCase().trim();
    const breakingOnly = url.searchParams.get('breaking') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let articles = await getAllArticles();

    if (category && category !== 'all') {
      articles = articles.filter(a => a.category?.toLowerCase() === category);
    }

    if (breakingOnly) {
      articles = articles.filter(a => a.is_breaking);
    }

    if (search) {
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(search) ||
        a.lead_paragraph.toLowerCase().includes(search) ||
        a.body_markdown.toLowerCase().includes(search) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(search)))
      );
    }

    const total = articles.length;
    const paginated = articles.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      total,
      articles: paginated,
      offset,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
