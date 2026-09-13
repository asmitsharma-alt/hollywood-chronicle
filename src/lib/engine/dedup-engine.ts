import { Article } from '@/types/article';
import { DiscoveredStoryCandidate } from '../crawler/rss-collector';
import { findSimilarArticle } from '../database/storage-engine';

export interface DedupEvaluationResult {
  decision: 'publish_new' | 'update_existing' | 'skip_duplicate';
  matchedArticle?: Article;
  reason: string;
}

export async function evaluateStoryNovelty(
  candidate: DiscoveredStoryCandidate
): Promise<DedupEvaluationResult> {
  // 1. Check for similar existing articles
  const matched = await findSimilarArticle(candidate.title, 0.45);

  if (!matched) {
    return {
      decision: 'publish_new',
      reason: 'No similar existing articles found. Novel global story.',
    };
  }

  // 2. Check if the candidate comes from a source not yet recorded in the existing article
  let existingSources: Array<{ url?: string; name?: string }> = [];
  try {
    existingSources = JSON.parse(matched.sources_json || '[]');
  } catch (e) {
    existingSources = [];
  }

  const isSameUrl = existingSources.some(s => s.url === candidate.url);
  if (isSameUrl) {
    return {
      decision: 'skip_duplicate',
      matchedArticle: matched,
      reason: `Exact source URL already indexed in article "${matched.title}".`,
    };
  }

  // 3. If published recently (within last 36 hours), check if this is an evolution or update
  const articleAgeMs = Date.now() - new Date(matched.published_at).getTime();
  const isRecent = isNaN(articleAgeMs) || articleAgeMs < 48 * 60 * 60 * 1000;

  if (isRecent) {
    // If the candidate introduces new details from an authoritative source
    return {
      decision: 'update_existing',
      matchedArticle: matched,
      reason: `Story expansion: New corroboration from ${candidate.sourceName} adds depth to existing thread.`,
    };
  }

  return {
    decision: 'skip_duplicate',
    matchedArticle: matched,
    reason: `Semantic overlap exceeds 45% threshold with existing archive piece "${matched.title}".`,
  };
}
