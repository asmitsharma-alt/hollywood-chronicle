import { NextResponse } from 'next/server';
import { fetchEntertainmentHeadlines, searchTopicDeepDive } from '@/lib/news';
import { generateAndVerifyArticle } from '@/lib/groq';
import { searchMediaImage } from '@/lib/tmdb';
import { saveArticleToAppwrite } from '@/lib/appwrite';
import { Article } from '@/types/article';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedTopic = body.topic?.trim();

    let sources = [];
    let targetTopic = requestedTopic;

    if (requestedTopic) {
      sources = await searchTopicDeepDive(requestedTopic);
    } else {
      const headlines = await fetchEntertainmentHeadlines();
      if (headlines.length > 0) {
        const primary = headlines[0];
        targetTopic = primary.title;
        sources = headlines.slice(0, 4);
      } else {
        targetTopic = 'Denis Villeneuve Dune Messiah Studio Confirmation';
        sources = await searchTopicDeepDive(targetTopic);
      }
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'No verifiable news sources could be located for this topic.' },
        { status: 404 }
      );
    }

    // Step 2: Groq Fact-Checking & Article Synthesis
    const verifiedData = await generateAndVerifyArticle(targetTopic, sources);

    // Step 3: TMDB Media Asset Lookup
    let imageUrl = '';
    if (verifiedData.image_search_query) {
      imageUrl = await searchMediaImage(verifiedData.image_search_query);
    }
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80';
    }

    const newArticle: Article = {
      title: verifiedData.title,
      slug: `${verifiedData.slug}-${Date.now().toString().slice(-4)}`,
      lead_paragraph: verifiedData.lead_paragraph,
      body_markdown: verifiedData.body_markdown,
      category: verifiedData.category,
      author: verifiedData.author,
      verification_score: verifiedData.verification_score,
      verification_summary: verifiedData.verification_summary,
      sources_json: JSON.stringify(verifiedData.sources),
      image_url: imageUrl,
      image_caption: verifiedData.image_caption,
      published_at: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      edition: 'Special Telegraph Edition',
      is_breaking: true,
      status: 'published'
    };

    // Step 4: Save to Appwrite
    const saveResult = await saveArticleToAppwrite(newArticle);

    return NextResponse.json({
      success: true,
      article: newArticle,
      appwriteStatus: saveResult
    });
  } catch (err: any) {
    console.error('Ingest route failure:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error during ingestion' },
      { status: 500 }
    );
  }
}
