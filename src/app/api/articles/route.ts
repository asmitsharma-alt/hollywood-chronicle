import { NextResponse } from 'next/server';
import { fetchArticlesFromAppwrite } from '@/lib/appwrite';

export async function GET() {
  try {
    const articles = await fetchArticlesFromAppwrite();
    return NextResponse.json({ success: true, articles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
