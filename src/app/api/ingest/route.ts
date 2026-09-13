import { NextResponse } from 'next/server';
import { fetchEntertainmentHeadlines, searchTopicDeepDive } from '@/lib/news';
import { scrapeRedditPopCulture } from '@/lib/reddit';
import { generateAndVerifyArticle } from '@/lib/groq';
import { searchMediaImage } from '@/lib/tmdb';
import { saveArticleToAppwrite } from '@/lib/appwrite';
import { Article } from '@/types/article';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedTopic = body.topic?.trim();
    const isRedditMode = body.mode === 'reddit' || body.source === 'reddit';

    let sources: Array<{ title: string; snippet: string; source: string; url: string }> = [];
    let targetTopic = requestedTopic;
    let redditSourceInfo: { name: string; url: string; stance: string } | null = null;

    if (isRedditMode || (!requestedTopic && Math.random() > 0.3)) {
      // Scrape live Reddit pop culture
      const redditPosts = await scrapeRedditPopCulture();
      if (redditPosts.length > 0) {
        // Pick a top Reddit post that hasn't been recently processed
        const selectedPost = redditPosts[Math.floor(Math.random() * Math.min(redditPosts.length, 5))];
        targetTopic = selectedPost.title;
        redditSourceInfo = {
          name: `${selectedPost.subreddit} (Reddit Viral)`,
          url: selectedPost.sourceUrl,
          stance: 'primary'
        };

        // Deep-dive cross reference on the web with Tavily
        const tradeSources = await searchTopicDeepDive(targetTopic);
        sources = [
          {
            title: selectedPost.title,
            snippet: `Trending discussion on ${selectedPost.subreddit}. Published: ${selectedPost.publishedAt}`,
            source: `${selectedPost.subreddit} (Reddit)`,
            url: selectedPost.sourceUrl
          },
          ...tradeSources
        ];
      }
    }

    // Fallback if no Reddit sources found or if custom topic requested
    if (sources.length === 0) {
      if (requestedTopic) {
        sources = await searchTopicDeepDive(requestedTopic);
      } else {
        const headlines = await fetchEntertainmentHeadlines();
        if (headlines.length > 0) {
          targetTopic = headlines[0].title;
          sources = headlines.slice(0, 4);
        } else {
          targetTopic = 'Zack Snyder Goes Indie No Green Screen Film Project';
          sources = await searchTopicDeepDive(targetTopic);
        }
      }
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'No verifiable news sources could be located at this time.' },
        { status: 404 }
      );
    }

    // Step 2: Groq Fact-Checking & Broadsheet Synthesis
    const verifiedData = await generateAndVerifyArticle(targetTopic, sources);

    // Merge Reddit source if present
    if (redditSourceInfo && !verifiedData.sources.some(s => s.name.includes('Reddit'))) {
      verifiedData.sources.unshift(redditSourceInfo);
    }

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
      category: verifiedData.category || 'Pop Culture',
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
      edition: redditSourceInfo ? 'Reddit Viral Wire Edition' : 'Morning Broadsheet Edition',
      is_breaking: true,
      status: 'published'
    };

    // Step 4: Save to Storage & Appwrite
    const saveResult = await saveArticleToAppwrite(newArticle);

    return NextResponse.json({
      success: true,
      article: newArticle,
      scrapedFrom: redditSourceInfo ? redditSourceInfo.name : 'Trade Wire',
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
