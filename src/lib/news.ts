const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

export interface RawNewsItem {
  title: string;
  snippet: string;
  source: string;
  url: string;
  publishedAt?: string;
}

export async function fetchEntertainmentHeadlines(): Promise<RawNewsItem[]> {
  const items: RawNewsItem[] = [];

  // 1. Try NewsAPI top entertainment headlines
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=entertainment&pageSize=10&apiKey=${NEWS_API_KEY}`,
      { headers: { 'User-Agent': 'HollywoodChronicleBot/1.0' }, next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        for (const a of data.articles) {
          if (a.title && a.description && !a.title.includes('[Removed]')) {
            items.push({
              title: a.title,
              snippet: a.description || a.content || '',
              source: a.source?.name || 'News Wire',
              url: a.url || '',
              publishedAt: a.publishedAt
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('NewsAPI fetch error:', err);
  }

  // 2. Fallback or augment with Tavily search for trending Hollywood stories
  if (items.length < 3) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: 'Hollywood cinema box office entertainment news breaking',
          search_depth: 'basic',
          max_results: 6
        })
      });
      if (res.ok) {
        const data = await res.json();
        for (const r of data.results || []) {
          items.push({
            title: r.title,
            snippet: r.content,
            source: 'Tavily Search Corroboration',
            url: r.url
          });
        }
      }
    } catch (err) {
      console.warn('Tavily fetch error:', err);
    }
  }

  return items;
}

export async function searchTopicDeepDive(topic: string): Promise<RawNewsItem[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${topic} Indian Bollywood Hollywood cinema entertainment trade reports`,
        search_depth: 'advanced',
        include_domains: ['pinkvilla.com', 'bollywoodhungama.com', 'indianexpress.com', 'hindustantimes.com', 'variety.com', 'hollywoodreporter.com', 'deadline.com'],
        max_results: 6
      })
    });
    if (!res.ok) throw new Error('Tavily search failed');
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      snippet: r.content,
      source: r.url.includes('pinkvilla.com') ? 'Pinkvilla' :
              r.url.includes('bollywoodhungama.com') ? 'Bollywood Hungama' :
              r.url.includes('indianexpress.com') ? 'The Indian Express' :
              r.url.includes('hindustantimes.com') ? 'Hindustan Times' :
              r.url.includes('variety.com') ? 'Variety' :
              r.url.includes('hollywoodreporter.com') ? 'The Hollywood Reporter' :
              r.url.includes('deadline.com') ? 'Deadline' : 'SMOC Wire Desk',
      url: r.url
    }));
  } catch (err) {
    console.error('Error in searchTopicDeepDive:', err);
    return [];
  }
}
