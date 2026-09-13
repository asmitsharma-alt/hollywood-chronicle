import * as cheerio from 'cheerio';
import { throttledFetch } from './rate-limiter';

export interface ExtractedArticleDetails {
  url: string;
  title: string;
  summary: string;
  fullContent: string;
  author: string;
  publishedAt: string;
  source: string;
  images: string[];
  categories: string[];
  keywords: string[];
  qualityScore: number;
  isSpam: boolean;
  isOutdated: boolean;
}

const SPAM_KEYWORDS = [
  'casino',
  'betting odds',
  'free spins',
  'crypto airdrop',
  'buy followers',
  'viagra',
  'weight loss miracle',
  'wire fraud',
  'sponsored post pay per click',
  'telegram pump group',
];

export function checkSpamAndQuality(title: string, text: string, url: string): { isSpam: boolean; qualityScore: number } {
  const combined = `${title} ${text}`.toLowerCase();

  // Spam checks
  for (const spamWord of SPAM_KEYWORDS) {
    if (combined.includes(spamWord)) {
      return { isSpam: true, qualityScore: 0.1 };
    }
  }

  // Minimum length check
  if (text.length < 80) {
    return { isSpam: false, qualityScore: 0.3 };
  }

  // Calculate readability & density quality
  let score = 0.7;
  if (text.length > 500) score += 0.15;
  if (text.includes('stated') || text.includes('confirmed') || text.includes('reported') || text.includes('according to')) score += 0.1;
  if (url.includes('.gov') || url.includes('.edu') || url.includes('variety.com') || url.includes('bbc.co')) score += 0.05;

  return { isSpam: false, qualityScore: Math.min(1.0, score) };
}

export function isContentOutdated(publishedAtStr?: string): boolean {
  if (!publishedAtStr) return false;
  try {
    const pubDate = new Date(publishedAtStr);
    if (isNaN(pubDate.getTime())) return false;
    const now = Date.now();
    const ageDays = (now - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    // Discard articles older than 7 days
    return ageDays > 7;
  } catch {
    return false;
  }
}

export async function extractSmartArticle(
  url: string,
  sourceName = 'Web Source',
  categoryHint = 'General'
): Promise<ExtractedArticleDetails | null> {
  try {
    const res = await throttledFetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise, scripts, ads, social bars
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, #comments, .comments, iframe, noscript').remove();

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      '';

    const summary =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('[rel="author"]').first().text().trim() ||
      $('[class*="author"]').first().text().trim() ||
      'Staff Trade Correspondent';

    const publishedAt =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').attr('datetime') ||
      new Date().toISOString();

    const heroImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img').first().attr('src') ||
      '';

    // Extract article text paragraphs
    const paragraphs: string[] = [];
    const articleContainers = $('article, main, [role="main"], .story-body, .article-content, .entry-content');

    if (articleContainers.length > 0) {
      articleContainers.find('p').each((_, el) => {
        const pText = $(el).text().trim();
        if (pText.length > 35 && !pText.toLowerCase().includes('click here') && !pText.toLowerCase().includes('subscribe to')) {
          paragraphs.push(pText);
        }
      });
    }

    if (paragraphs.length === 0) {
      $('p').each((_, el) => {
        const pText = $(el).text().trim();
        if (pText.length > 45) {
          paragraphs.push(pText);
        }
      });
    }

    const fullContent = paragraphs.slice(0, 15).join('\n\n');

    // Extract keywords and categories
    const keywordsMeta = $('meta[name="keywords"]').attr('content') || '';
    const keywords = keywordsMeta
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 2);

    const categories = [categoryHint];
    const sectionMeta = $('meta[property="article:section"]').attr('content');
    if (sectionMeta && !categories.includes(sectionMeta)) {
      categories.push(sectionMeta);
    }

    const { isSpam, qualityScore } = checkSpamAndQuality(title, fullContent, url);
    const isOutdated = isContentOutdated(publishedAt);

    return {
      url,
      title: title.replace(/\s+/g, ' ').trim(),
      summary: summary.replace(/\s+/g, ' ').trim(),
      fullContent,
      author: author.replace(/\s+/g, ' ').trim(),
      publishedAt,
      source: sourceName,
      images: heroImage ? [heroImage] : [],
      categories,
      keywords,
      qualityScore,
      isSpam,
      isOutdated,
    };
  } catch (err) {
    console.warn(`Smart extraction failed for ${url}:`, err);
    return null;
  }
}
