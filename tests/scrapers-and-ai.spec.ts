import { test, expect } from '@playwright/test';
import { getAllArticles, findSimilarArticle, upsertArticle } from '../src/lib/database/storage-engine';
import { evaluateStoryNovelty } from '../src/lib/engine/dedup-engine';

test.describe('Database Integrity & Novelty Engine', () => {
  test('Storage engine returns seeded articles with versioning', async () => {
    const articles = await getAllArticles();
    expect(articles.length).toBeGreaterThan(0);

    const first = articles[0];
    expect(first.title).toBeDefined();
    expect(first.slug).toBeDefined();
    expect(first.verification_score).toBeDefined();
  });

  test('Deduplication correctly flags exact duplicates and novel topics', async () => {
    const articles = await getAllArticles();
    const existing = articles[0];

    // Novel test candidate
    const novelCandidate = {
      title: 'Completely Novel Indie Sci-Fi Directorial Announcement 2029',
      url: 'https://variety.com/novel-test-story',
      sourceName: 'Variety',
      snippet: 'A brand new science fiction film was unveiled.',
      publishedAt: new Date().toISOString()
    };

    const evalResult = await evaluateStoryNovelty(novelCandidate);
    expect(evalResult.decision).toBe('publish_new');

    // Duplicate candidate matching existing title
    const duplicateCandidate = {
      title: existing.title,
      url: 'https://variety.com/duplicate-story',
      sourceName: 'Deadline',
      snippet: 'Same topic rehashed.',
      publishedAt: new Date().toISOString()
    };

    const dupResult = await evaluateStoryNovelty(duplicateCandidate);
    expect(['update_existing', 'skip_duplicate']).toContain(dupResult.decision);
  });
});
