import * as cheerio from 'cheerio';
import { throttledFetch } from './rate-limiter';

export interface ExtractedArticleContent {
  url: string;
  title: string;
  description: string;
  text: string;
  image?: string;
  publishedTime?: string;
  byline?: string;
}

export async function extractArticleContent(url: string): Promise<ExtractedArticleContent | null> {
  try {
    const res = await throttledFetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      }
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, #comments, .comments, iframe').remove();

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    const publishedTime =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').attr('datetime') ||
      '';

    const byline =
      $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').first().text().trim() ||
      '';

    // Extract readable paragraphs from main article containers
    let paragraphs: string[] = [];
    const articleContainer = $('article, main, .article-content, .story-body, .entry-content');
    
    if (articleContainer.length > 0) {
      articleContainer.find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 40) {
          paragraphs.push(text);
        }
      });
    }

    if (paragraphs.length === 0) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
    }

    const fullText = paragraphs.slice(0, 10).join('\n\n');

    return {
      url,
      title: title.replace(/\s+/g, ' ').trim(),
      description: description.replace(/\s+/g, ' ').trim(),
      text: fullText,
      image,
      publishedTime,
      byline,
    };
  } catch (err) {
    console.warn(`Error extracting content from ${url}:`, err);
    return null;
  }
}
