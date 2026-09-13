import { ExtractedArticleDetails, extractSmartArticle } from './smart-extractor';

export interface DynamicScraperResult {
  success: boolean;
  details?: ExtractedArticleDetails;
  error?: string;
  executionTimeMs: number;
  engineUsed: 'playwright_headless' | 'cheerio_fast_engine';
}

export async function scrapeDynamicArticle(
  url: string,
  sourceName = 'Dynamic Web Source',
  category = 'Cinema'
): Promise<DynamicScraperResult> {
  const start = Date.now();

  // Primary fast engine: resilient Cheerio + throttledFetch
  try {
    const extracted = await extractSmartArticle(url, sourceName, category);
    if (extracted && extracted.fullContent.length > 150) {
      return {
        success: true,
        details: extracted,
        executionTimeMs: Date.now() - start,
        engineUsed: 'cheerio_fast_engine',
      };
    }
  } catch (err: any) {
    console.warn(`Fast engine fallback triggered for ${url}: ${err.message}`);
  }

  // Attempt dynamic browser extraction if available and not in constrained serverless
  try {
    // Dynamically require playwright only when needed to prevent bundle bloat in production edge
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (SMOCTimesCrawler/2.0)',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    page.setDefaultTimeout(8000); // 8-second strict safety timeout

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for article body or main content
    await page.waitForSelector('article, main, p', { timeout: 3000 }).catch(() => {});

    const title = await page.title();
    const fullText = await page.$$eval('p', (ps) =>
      ps
        .map((p) => p.textContent?.trim() || '')
        .filter((t) => t.length > 35)
        .slice(0, 12)
        .join('\n\n')
    );

    await browser.close();

    if (fullText.length > 60) {
      return {
        success: true,
        details: {
          url,
          title: title || 'Breaking News Dispatch',
          summary: fullText.slice(0, 200),
          fullContent: fullText,
          author: 'Trade Bureau Wire',
          publishedAt: new Date().toISOString(),
          source: sourceName,
          images: [],
          categories: [category],
          keywords: [],
          qualityScore: 0.85,
          isSpam: false,
          isOutdated: false,
        },
        executionTimeMs: Date.now() - start,
        engineUsed: 'playwright_headless',
      };
    }
  } catch (browserErr: any) {
    // Graceful recovery: return fallback extracted article or clean failure
    return {
      success: false,
      error: browserErr.message || 'Dynamic page extraction failure',
      executionTimeMs: Date.now() - start,
      engineUsed: 'cheerio_fast_engine',
    };
  }

  return {
    success: false,
    error: 'Content too sparse or paywalled',
    executionTimeMs: Date.now() - start,
    engineUsed: 'cheerio_fast_engine',
  };
}
