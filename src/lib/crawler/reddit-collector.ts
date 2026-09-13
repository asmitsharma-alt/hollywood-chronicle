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
  // Indian Cinema & Gossip
  'BollyBlindsNGossip',
  'bollywood',
  'tollywood',
  'kollywood',
  'IndianCinema',
  'IndianOTTbestof',
  // Indian Gaming & Tech
  'IndianGaming',
  'mumbai_gamers',
  'gaming',
  'Games',
  'pcgaming',
  // Indian Business, Startups & D-Street Markets
  'IndianStockMarket',
  'IndianStartups',
  'IndiaInvestments',
  'IndianStreetBets',
  // Indian Pop Culture & Internet Life
  'IndiaSocial',
  'CricketShitpost',
  'Cricket',
  // Global Entertainment & Wire
  'popculturechat',
  'movies',
  'boxoffice',
  'television'
];

export async function collectTrendingFromReddit(): Promise<DiscoveredStoryCandidate[]> {
  const candidates: DiscoveredStoryCandidate[] = [];

  // Google News indexer query covering both Indian and Global Pop Culture subreddits
  const subQuery = MONITORED_SUBREDDITS.map(s => `site:reddit.com/r/${s}`).join(' OR ');
  const query = `(${subQuery}) when:1d`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

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

    for (const item of itemList.slice(0, 20)) {
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
      if (isQuestion || rawTitle.length < 20) continue;

      let matchedSub = 'r/BollyBlindsNGossip';
      let category = 'BollyBlinds Gossip';

      for (const s of MONITORED_SUBREDDITS) {
        if (rawTitle.toLowerCase().includes(s.toLowerCase()) || link.toLowerCase().includes(s.toLowerCase())) {
          matchedSub = `r/${s}`;
          break;
        }
      }

      if (matchedSub.includes('IndianGaming') || matchedSub.includes('gaming') || matchedSub.includes('Games') || matchedSub.includes('pcgaming') || matchedSub.includes('mumbai_gamers')) {
        category = 'Gaming & Esports';
      } else if (matchedSub.includes('StockMarket') || matchedSub.includes('Startups') || matchedSub.includes('Investments') || matchedSub.includes('StreetBets') || matchedSub.includes('business')) {
        category = 'Business & D-Street';
      } else if (matchedSub.includes('Cricket') || matchedSub.includes('IndiaSocial')) {
        category = 'Indian Pop Culture';
      } else if (matchedSub.includes('BollyBlinds')) {
        category = 'BollyBlinds Gossip';
      } else if (matchedSub.includes('bollywood') || matchedSub.includes('tollywood') || matchedSub.includes('kollywood') || matchedSub.includes('IndianCinema')) {
        category = 'Indian Cinema';
      } else if (matchedSub.includes('IndianOTT')) {
        category = 'Streaming & OTT';
      } else if (matchedSub.includes('movies') || matchedSub.includes('boxoffice')) {
        category = 'Cinema';
      } else {
        category = 'Global Pop Culture';
      }

      candidates.push({
        title: rawTitle,
        url: link,
        sourceName: `${matchedSub} (Reddit Wire)`,
        snippet: `Viral discourse trending on Indian & Global Reddit community ${matchedSub}. Published on wire: ${pubDate}`,
        publishedAt: pubDate,
        categoryHint: category,
      });
    }
  } catch (err) {
    console.error('Error in collectTrendingFromReddit:', err);
  }

  return candidates;
}
