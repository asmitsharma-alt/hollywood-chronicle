import { XMLParser } from 'fast-xml-parser';
import { throttledFetch } from './rate-limiter';

export interface DiscoveredStoryCandidate {
  title: string;
  url: string;
  sourceName: string;
  snippet: string;
  publishedAt: string;
  categoryHint?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
});

export const FEEDS = [
  {
    name: 'Google News India Entertainment',
    url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en',
    category: 'Indian Cinema',
  },
  {
    name: 'Bollywood & Pan-India Wire',
    url: 'https://news.google.com/rss/search?q=bollywood+OR+tollywood+OR+kollywood+movie+box+office+when:1d&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'Indian Cinema',
  },
  {
    name: 'Variety',
    url: 'https://variety.com/feed/',
    category: 'Industry Wire',
  },
  {
    name: 'Deadline',
    url: 'https://deadline.com/feed/',
    category: 'Hollywood & Global',
  },
  {
    name: 'The Hollywood Reporter',
    url: 'https://www.hollywoodreporter.com/feed/',
    category: 'Hollywood & Global',
  },
  {
    name: 'BBC Entertainment & Arts',
    url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    category: 'Global Pop Culture',
  },
  {
    name: 'Google News Global Movies & Box Office',
    url: 'https://news.google.com/rss/search?q=box+office+movies+film+studio+premiere+when:1d&hl=en-US&gl=US&ceid=US:en',
    category: 'Box Office',
  }
];

export async function collectTrendingFromRSS(): Promise<DiscoveredStoryCandidate[]> {
  const candidates: DiscoveredStoryCandidate[] = [];

  for (const feed of FEEDS) {
    try {
      const response = await throttledFetch(feed.url, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
        }
      });

      if (!response.ok) {
        console.warn(`RSS fetch failed for ${feed.name}: ${response.status}`);
        continue;
      }

      const xmlText = await response.text();
      const parsed = parser.parse(xmlText);
      const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];

      const itemList = Array.isArray(items) ? items : [items];

      for (const item of itemList.slice(0, 8)) {
        let title = item.title?.['#text'] || item.title || '';
        let link = item.link?.['#text'] || item.link?.['@_href'] || item.link || '';
        let description = item.description?.['#text'] || item.description || item.summary || '';
        let pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();

        if (typeof title !== 'string') title = String(title);
        if (typeof link !== 'string') link = String(link);
        if (typeof description !== 'string') description = String(description);

        // Clean HTML tags from description
        const cleanSnippet = description
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        if (title.length > 15 && link) {
          candidates.push({
            title: title.trim(),
            url: link.trim(),
            sourceName: feed.name,
            snippet: cleanSnippet.slice(0, 300),
            publishedAt: pubDate,
            categoryHint: feed.category,
          });
        }
      }
    } catch (err) {
      console.warn(`Error scanning feed ${feed.name}:`, err);
    }
  }

  return candidates;
}
