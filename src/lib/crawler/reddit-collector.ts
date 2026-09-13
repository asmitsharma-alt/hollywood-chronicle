import { XMLParser } from 'fast-xml-parser';
import { throttledFetch } from './rate-limiter';
import { DiscoveredStoryCandidate } from './rss-collector';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
});

export const MONITORED_SUBREDDITS = [
  'popculturechat',
  'movies',
  'entertainment',
  'boxoffice',
  'television',
  'Fauxmoi'
];

export async function collectTrendingFromReddit(): Promise<DiscoveredStoryCandidate[]> {
  const candidates: DiscoveredStoryCandidate[] = [];

  // Google News indexer query for real-time Reddit discussions within the past 24 hours
  const subQuery = MONITORED_SUBREDDITS.map(s => `site:reddit.com/r/${s}`).join(' OR ');
  const query = `(${subQuery}) when:1d`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await throttledFetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml',
      }
    });

    if (!res.ok) {
      console.warn(`Reddit RSS gateway error: ${res.status}`);
      return candidates;
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];
    const itemList = Array.isArray(items) ? items : [items];

    for (const item of itemList.slice(0, 15)) {
      let rawTitle = item.title?.['#text'] || item.title || '';
      let link = item.link?.['#text'] || item.link || '';
      let pubDate = item.pubDate || new Date().toISOString();

      if (typeof rawTitle !== 'string') rawTitle = String(rawTitle);
      if (typeof link !== 'string') link = String(link);

      rawTitle = rawTitle
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/ - Reddit$/, '')
        .trim();

      // Skip generic prompt questions or ultra short titles
      const isQuestion = /^(what|who|which|why|how|anyone|does anyone|did anyone)\b/i.test(rawTitle) || rawTitle.endsWith('?');
      if (isQuestion || rawTitle.length < 22) continue;

      let matchedSub = 'r/popculturechat';
      for (const s of MONITORED_SUBREDDITS) {
        if (rawTitle.toLowerCase().includes(s) || link.toLowerCase().includes(s)) {
          matchedSub = `r/${s}`;
          break;
        }
      }

      candidates.push({
        title: rawTitle,
        url: link,
        sourceName: `${matchedSub} (Reddit Wire)`,
        snippet: `Viral discourse trending on Reddit community ${matchedSub}. Published on wire: ${pubDate}`,
        publishedAt: pubDate,
        categoryHint: matchedSub.includes('movies') || matchedSub.includes('boxoffice') ? 'Cinema' : 'Pop Culture',
      });
    }
  } catch (err) {
    console.error('Error in collectTrendingFromReddit:', err);
  }

  return candidates;
}
