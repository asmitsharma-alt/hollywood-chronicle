import { RawNewsItem } from './news';

export interface RedditStory {
  title: string;
  subreddit: string;
  sourceUrl: string;
  publishedAt: string;
}

export async function scrapeRedditPopCulture(): Promise<RedditStory[]> {
  const subreddits = ['popculturechat', 'movies', 'entertainment', 'boxoffice'];
  const stories: RedditStory[] = [];

  // Use Google News real-time indexer for Reddit to bypass Reddit IP 429 blocks
  const query = '(site:reddit.com/r/popculturechat OR site:reddit.com/r/movies OR site:reddit.com/r/entertainment OR site:reddit.com/r/boxoffice) when:1d';
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error(`Google RSS error: ${res.status}`);
    const xml = await res.text();

    // Parse RSS items
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && stories.length < 15) {
      let rawTitle = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/ - Reddit$/, '')
        .trim();

      const link = match[2];
      const pubDate = match[3];

      // Filter out low-signal questions ("What is your favorite...", "Who would win...")
      const isQuestion = rawTitle.startsWith('What') || rawTitle.startsWith('Who') || rawTitle.startsWith('Which') || rawTitle.endsWith('?');
      if (!isQuestion && rawTitle.length > 20) {
        let sub = 'r/popculturechat';
        if (xml.includes('/r/movies')) sub = 'r/movies';
        if (xml.includes('/r/boxoffice')) sub = 'r/boxoffice';

        stories.push({
          title: rawTitle,
          subreddit: sub,
          sourceUrl: link,
          publishedAt: pubDate
        });
      }
    }
  } catch (err) {
    console.error('Error scraping Reddit stories:', err);
  }

  return stories;
}
