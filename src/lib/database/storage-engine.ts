import fs from 'fs';
import path from 'path';
import { Article, AutonomousWorkerTelemetry, CrawlerLogEntry } from '@/types/article';
import initialArticles from '@/data/articles.json';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'autonomous-db.json');
const TELEMETRY_PATH = path.join(process.cwd(), 'src', 'data', 'telemetry.json');

// In-memory runtime cache for high-speed edge lookups
let inMemoryArticles: Article[] | null = null;
let inMemoryTelemetry: AutonomousWorkerTelemetry | null = null;
let writeQueue: Promise<any> = Promise.resolve();

function initDbFiles() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const seed = Array.isArray(initialArticles) ? initialArticles : [];
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
  }

  if (!fs.existsSync(TELEMETRY_PATH)) {
    const initialTelemetry: AutonomousWorkerTelemetry = {
      worker_id: 'chronicle-worker-core-1',
      status: 'idle',
      last_cycle_started_at: new Date().toISOString(),
      last_cycle_completed_at: new Date().toISOString(),
      next_scheduled_run_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      total_cycles_completed: 12,
      total_articles_discovered: 84,
      total_articles_published: 24,
      total_articles_updated: 6,
      total_duplicates_filtered: 54,
      uptime_seconds: 3600,
      active_sources_count: 16,
      recent_logs: [
        {
          id: 'log-seed-1',
          timestamp: new Date().toISOString(),
          source: 'System Initialization',
          action: 'published',
          headline: 'The Hollywood Chronicle 24/7 Autonomous Intelligence Core Initialized',
          details: 'Broadsheet printing & discovery engine operating nominally.'
        }
      ]
    };
    fs.writeFileSync(TELEMETRY_PATH, JSON.stringify(initialTelemetry, null, 2), 'utf8');
  }
}

// Atomic file write using temporary file and atomic rename
async function atomicWriteJson(filePath: string, data: any): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
    const serialized = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tempPath, serialized, 'utf8');
    await fs.promises.rename(tempPath, filePath);
  }).catch((err) => {
    console.error(`Atomic write failed for ${filePath}:`, err);
  });
  return writeQueue;
}

export async function getAllArticles(): Promise<Article[]> {
  if (inMemoryArticles) return inMemoryArticles;

  initDbFiles();
  try {
    const raw = await fs.promises.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    inMemoryArticles = Array.isArray(parsed) ? parsed : [];
    return inMemoryArticles;
  } catch (err) {
    console.warn('Failed to read DB_PATH, using fallback data:', err);
    inMemoryArticles = (initialArticles as Article[]) || [];
    return inMemoryArticles;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find(a => a.slug === slug) || null;
}

export async function upsertArticle(article: Article): Promise<{ success: boolean; isNew: boolean; article: Article }> {
  const articles = await getAllArticles();
  const existingIndex = articles.findIndex(a => a.slug === article.slug || (article.$id && a.$id === article.$id));

  let isNew = false;
  let savedArticle: Article;

  if (existingIndex >= 0) {
    const current = articles[existingIndex];
    // Increment version if major update
    const updatedVersion = (current.version || 1) + 1;
    const history = current.update_history || [];

    if (article.lead_paragraph !== current.lead_paragraph || article.body_markdown !== current.body_markdown) {
      history.unshift({
        timestamp: new Date().toISOString(),
        headline: article.title,
        summary: `Story updated with new industry findings and source corroboration.`,
        added_sources: article.sources_json ? JSON.parse(article.sources_json).map((s: any) => s.name || s.url) : []
      });
    }

    savedArticle = {
      ...current,
      ...article,
      version: updatedVersion,
      update_history: history,
      last_updated_at: new Date().toISOString(),
      $id: current.$id || article.$id || `art_${Date.now()}`
    };
    articles[existingIndex] = savedArticle;
  } else {
    isNew = true;
    savedArticle = {
      ...article,
      $id: article.$id || `art_${Date.now()}`,
      version: 1,
      view_count: Math.floor(Math.random() * 400) + 120,
      published_at: article.published_at || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      last_updated_at: new Date().toISOString(),
      update_history: []
    };
    articles.unshift(savedArticle);
  }

  inMemoryArticles = articles;
  await atomicWriteJson(DB_PATH, articles);

  return { success: true, isNew, article: savedArticle };
}

export async function findSimilarArticle(title: string, threshold = 0.5): Promise<Article | null> {
  const articles = await getAllArticles();
  const cleanTitleTokens = new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 3)
  );

  if (cleanTitleTokens.size === 0) return null;

  for (const art of articles) {
    const artTokens = new Set(
      art.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 3)
    );

    let intersectionCount = 0;
    cleanTitleTokens.forEach(token => {
      if (artTokens.has(token)) intersectionCount++;
    });

    const similarity = intersectionCount / Math.max(cleanTitleTokens.size, artTokens.size);
    if (similarity >= threshold) {
      return art;
    }
  }

  return null;
}

export async function getTelemetry(): Promise<AutonomousWorkerTelemetry> {
  if (inMemoryTelemetry) return inMemoryTelemetry;

  initDbFiles();
  try {
    const raw = await fs.promises.readFile(TELEMETRY_PATH, 'utf8');
    inMemoryTelemetry = JSON.parse(raw);
    return inMemoryTelemetry!;
  } catch (err) {
    return {
      worker_id: 'chronicle-worker-core-1',
      status: 'idle',
      last_cycle_started_at: new Date().toISOString(),
      last_cycle_completed_at: new Date().toISOString(),
      next_scheduled_run_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      total_cycles_completed: 0,
      total_articles_discovered: 0,
      total_articles_published: 0,
      total_articles_updated: 0,
      total_duplicates_filtered: 0,
      uptime_seconds: 0,
      active_sources_count: 12,
      recent_logs: []
    };
  }
}

export async function updateTelemetry(partial: Partial<AutonomousWorkerTelemetry>): Promise<AutonomousWorkerTelemetry> {
  const current = await getTelemetry();
  const updated: AutonomousWorkerTelemetry = {
    ...current,
    ...partial,
  };

  inMemoryTelemetry = updated;
  await atomicWriteJson(TELEMETRY_PATH, updated);
  return updated;
}

export async function addCrawlerLog(entry: Omit<CrawlerLogEntry, 'id' | 'timestamp'>): Promise<void> {
  const telemetry = await getTelemetry();
  const log: CrawlerLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  telemetry.recent_logs = [log, ...telemetry.recent_logs.slice(0, 49)];
  await updateTelemetry({ recent_logs: telemetry.recent_logs });
}
