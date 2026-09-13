import fs from 'fs';
import path from 'path';

export interface CrawlSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'reddit' | 'html' | 'playwright_dynamic';
  category: 'Indian Cinema' | 'Gaming & Esports' | 'Business & D-Street' | 'Indian Pop Culture' | 'Hollywood & Global' | 'Technology' | 'Box Office';
  reliabilityScore: number; // 0.0 to 1.0
  enabled: boolean;
  refreshIntervalSeconds: number;
  lastScrapedAt?: string;
  lastStatus?: 'healthy' | 'warning' | 'error' | 'rate_limited';
  consecutiveFailures: number;
  errorMessage?: string;
}

const REGISTRY_PATH = path.join(process.cwd(), 'src', 'data', 'sources-registry.json');

export const DEFAULT_SOURCES: CrawlSource[] = [
  {
    id: 'src-google-in-ent',
    name: 'Google News India Entertainment',
    url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en',
    type: 'rss',
    category: 'Indian Cinema',
    reliabilityScore: 0.96,
    enabled: true,
    refreshIntervalSeconds: 10,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-bollywood-wire',
    name: 'Bollywood & Pan-India Cinema Wire',
    url: 'https://news.google.com/rss/search?q=bollywood+OR+tollywood+movie+box+office+when:1d&hl=en-IN&gl=IN&ceid=IN:en',
    type: 'rss',
    category: 'Indian Cinema',
    reliabilityScore: 0.94,
    enabled: true,
    refreshIntervalSeconds: 10,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-variety',
    name: 'Variety Industry Wire',
    url: 'https://variety.com/feed/',
    type: 'rss',
    category: 'Hollywood & Global',
    reliabilityScore: 0.99,
    enabled: true,
    refreshIntervalSeconds: 15,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-deadline',
    name: 'Deadline Hollywood',
    url: 'https://deadline.com/feed/',
    type: 'rss',
    category: 'Hollywood & Global',
    reliabilityScore: 0.98,
    enabled: true,
    refreshIntervalSeconds: 15,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-bbc-ent',
    name: 'BBC Entertainment & Arts',
    url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    type: 'rss',
    category: 'Hollywood & Global',
    reliabilityScore: 0.99,
    enabled: true,
    refreshIntervalSeconds: 30,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-reddit-bollyblinds',
    name: 'r/BollyBlindsNGossip',
    url: 'https://www.reddit.com/r/BollyBlindsNGossip/hot.json?limit=15',
    type: 'reddit',
    category: 'Indian Pop Culture',
    reliabilityScore: 0.88,
    enabled: true,
    refreshIntervalSeconds: 10,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-reddit-indian-gaming',
    name: 'r/IndianGaming',
    url: 'https://www.reddit.com/r/IndianGaming/hot.json?limit=15',
    type: 'reddit',
    category: 'Gaming & Esports',
    reliabilityScore: 0.90,
    enabled: true,
    refreshIntervalSeconds: 10,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-reddit-indian-stockmarket',
    name: 'r/IndianStockMarket',
    url: 'https://www.reddit.com/r/IndianStockMarket/hot.json?limit=15',
    type: 'reddit',
    category: 'Business & D-Street',
    reliabilityScore: 0.91,
    enabled: true,
    refreshIntervalSeconds: 10,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-reddit-indiasocial',
    name: 'r/IndiaSocial Pop Culture',
    url: 'https://www.reddit.com/r/IndiaSocial/hot.json?limit=15',
    type: 'reddit',
    category: 'Indian Pop Culture',
    reliabilityScore: 0.89,
    enabled: true,
    refreshIntervalSeconds: 10,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-ign-gaming',
    name: 'IGN Global Gaming Feed',
    url: 'https://feeds.feedburner.com/ign/news',
    type: 'rss',
    category: 'Gaming & Esports',
    reliabilityScore: 0.95,
    enabled: true,
    refreshIntervalSeconds: 20,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  },
  {
    id: 'src-theverge-tech',
    name: 'The Verge Tech & Media',
    url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    category: 'Technology',
    reliabilityScore: 0.96,
    enabled: true,
    refreshIntervalSeconds: 20,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  }
];

let inMemorySources: CrawlSource[] | null = null;

function ensureFile() {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REGISTRY_PATH)) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(DEFAULT_SOURCES, null, 2), 'utf8');
  }
}

export async function getAllSources(): Promise<CrawlSource[]> {
  if (inMemorySources) return inMemorySources;
  try {
    ensureFile();
    const raw = await fs.promises.readFile(REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    inMemorySources = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SOURCES;
  } catch {
    inMemorySources = DEFAULT_SOURCES;
  }
  return inMemorySources;
}

export async function saveSources(sources: CrawlSource[]): Promise<void> {
  inMemorySources = sources;
  try {
    ensureFile();
    await fs.promises.writeFile(REGISTRY_PATH, JSON.stringify(sources, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save sources registry:', err);
  }
}

export async function addSource(source: Omit<CrawlSource, 'id' | 'consecutiveFailures' | 'lastStatus'>): Promise<CrawlSource> {
  const sources = await getAllSources();
  const id = `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const newSource: CrawlSource = {
    ...source,
    id,
    consecutiveFailures: 0,
    lastStatus: 'healthy',
  };
  sources.push(newSource);
  await saveSources(sources);
  return newSource;
}

export async function removeSource(id: string): Promise<boolean> {
  const sources = await getAllSources();
  const filtered = sources.filter((s) => s.id !== id);
  if (filtered.length !== sources.length) {
    await saveSources(filtered);
    return true;
  }
  return false;
}

export async function updateSourceStatus(
  id: string,
  status: 'healthy' | 'warning' | 'error' | 'rate_limited',
  errorMessage?: string
): Promise<void> {
  const sources = await getAllSources();
  const source = sources.find((s) => s.id === id);
  if (source) {
    source.lastScrapedAt = new Date().toISOString();
    source.lastStatus = status;
    if (status === 'error' || status === 'rate_limited') {
      source.consecutiveFailures = (source.consecutiveFailures || 0) + 1;
      source.errorMessage = errorMessage;
    } else {
      source.consecutiveFailures = 0;
      source.errorMessage = undefined;
    }
    await saveSources(sources);
  }
}
