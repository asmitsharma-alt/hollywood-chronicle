import { collectTrendingFromRSS, DiscoveredStoryCandidate } from '../crawler/rss-collector';
import { collectTrendingFromReddit } from '../crawler/reddit-collector';
import { fetchEntertainmentHeadlines, searchTopicDeepDive } from '../news';
import { runMultiAgentPipeline } from '../ai/agent-orchestrator';
import { searchMediaImage } from '../tmdb';
import { evaluateStoryNovelty } from './dedup-engine';
import { getAllSources, updateSourceStatus } from '../crawler/source-registry';
import { globalCrawlQueue } from '../crawler/crawl-queue';
import { checkSpamAndQuality, isContentOutdated } from '../crawler/smart-extractor';
import {
  addCrawlerLog,
  getAllArticles,
  getTelemetry,
  updateTelemetry,
  upsertArticle
} from '../database/storage-engine';
import { Article } from '@/types/article';
import { saveArticleToAppwrite } from '../appwrite';

let isCycleRunning = false;
let lastCycleTimeMs = 0;

export interface AutonomousCycleReport {
  success: boolean;
  cycleStartedAt: string;
  cycleCompletedAt: string;
  candidatesDiscovered: number;
  articlesPublished: number;
  articlesUpdated: number;
  duplicatesSkipped: number;
  errorsEncountered: number;
  actions: string[];
}

export async function runAutonomousCycle(force = false): Promise<AutonomousCycleReport> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const actions: string[] = [];
  let publishedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;

  if (isCycleRunning && !force) {
    return {
      success: false,
      cycleStartedAt: startTime,
      cycleCompletedAt: new Date().toISOString(),
      candidatesDiscovered: 0,
      articlesPublished: 0,
      articlesUpdated: 0,
      duplicatesSkipped: 0,
      errorsEncountered: 0,
      actions: ['Cycle skipped: An autonomous cycle is already in progress.'],
    };
  }

  isCycleRunning = true;
  await updateTelemetry({
    status: 'running',
    last_cycle_started_at: startTime,
  });

  try {
    actions.push('Initiating multi-vector web crawler sweep with priority queue...');

    // Phase 1: Ingest configured sources from dynamic registry
    const configuredSources = await getAllSources();
    const enabledSources = configuredSources.filter((s) => s.enabled);

    const [rssCandidates, redditCandidates, headlineNews] = await Promise.all([
      collectTrendingFromRSS().catch((e) => {
        console.warn('RSS crawler warning:', e);
        return [] as DiscoveredStoryCandidate[];
      }),
      collectTrendingFromReddit().catch((e) => {
        console.warn('Reddit crawler warning:', e);
        return [] as DiscoveredStoryCandidate[];
      }),
      fetchEntertainmentHeadlines().catch((e) => {
        console.warn('NewsAPI warning:', e);
        return [];
      }),
    ]);

    const headlineCandidates: DiscoveredStoryCandidate[] = headlineNews.map((h) => ({
      title: h.title,
      url: h.url,
      sourceName: h.source,
      snippet: h.snippet,
      publishedAt: h.publishedAt || new Date().toISOString(),
      categoryHint: 'Cinema',
    }));

    const allCandidates = [...redditCandidates, ...rssCandidates, ...headlineCandidates];

    // Enqueue all newly discovered candidates into priority crawl queue
    for (const cand of allCandidates) {
      // Find matching source to determine reliability score
      const matchingSource = enabledSources.find(
        (s) => s.name.toLowerCase().includes(cand.sourceName.toLowerCase()) || cand.sourceName.toLowerCase().includes(s.name.toLowerCase())
      );
      const reliability = matchingSource ? matchingSource.reliabilityScore : 0.88;

      globalCrawlQueue.enqueue({
        sourceId: matchingSource?.id || 'src-dynamic',
        sourceName: cand.sourceName,
        url: cand.url,
        type: matchingSource?.type || 'rss',
        category: cand.categoryHint || matchingSource?.category || 'Cinema',
        reliabilityScore: reliability,
        priority: Math.round(reliability * 100),
        maxAttempts: 3,
        resultCandidate: cand,
      });
    }

    actions.push(`Harvested ${allCandidates.length} potential story candidates across enabled sources.`);

    await addCrawlerLog({
      source: 'Crawler Ingestion',
      action: 'discovered',
      headline: `Multi-Vector Crawler Discovered ${allCandidates.length} Items`,
      details: `Active Sources: ${enabledSources.length} | Reddit: ${redditCandidates.length} | RSS: ${rssCandidates.length} | NewsWire: ${headlineCandidates.length}`,
    });

    // Phase 2: Process candidates from priority crawl queue with spam & outdated filters
    const maxToProcess = 8;
    let processedCount = 0;

    while (processedCount < maxToProcess) {
      if (publishedCount >= 2 || (publishedCount >= 1 && updatedCount >= 1)) break;

      const job = globalCrawlQueue.getNextJob();
      if (!job) break;

      processedCount++;
      const candidate = job.resultCandidate || {
        title: job.url,
        url: job.url,
        sourceName: job.sourceName,
        snippet: '',
        publishedAt: new Date().toISOString(),
        categoryHint: job.category,
      };

      try {
        // Quality & Spam filter
        const { isSpam, qualityScore } = checkSpamAndQuality(candidate.title, candidate.snippet, candidate.url);
        if (isSpam || qualityScore < 0.3) {
          skippedCount++;
          globalCrawlQueue.markCompleted(job.id, candidate);
          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'filtered',
            headline: `Spam / Low Quality Filtered: "${candidate.title.slice(0, 55)}..."`,
            details: `Quality Score: ${qualityScore.toFixed(2)} | Discarded automatically.`,
          });
          continue;
        }

        // Outdated content filter
        if (isContentOutdated(candidate.publishedAt)) {
          skippedCount++;
          globalCrawlQueue.markCompleted(job.id, candidate);
          continue;
        }

        const evalResult = await evaluateStoryNovelty(candidate);

        if (evalResult.decision === 'skip_duplicate') {
          skippedCount++;
          globalCrawlQueue.markCompleted(job.id, candidate);
          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'duplicate_skipped',
            headline: `Skipped Duplicate: "${candidate.title.slice(0, 60)}..."`,
            details: evalResult.reason,
          });
          continue;
        }

        if (evalResult.decision === 'update_existing' && evalResult.matchedArticle) {
          const target = evalResult.matchedArticle;
          const updatedBody = `${target.body_markdown}\n\n## UPDATE: New Developments from ${candidate.sourceName}\n\n${candidate.snippet}\n\nTrade analysts noting ongoing confirmations will continue to monitor formal disclosures.`;

          const updatedArticle: Article = {
            ...target,
            body_markdown: updatedBody,
            is_breaking: true,
            urgency_level: 'breaking',
            version: (target.version || 1) + 1,
            last_updated_at: new Date().toISOString(),
            published_timestamp: Date.now(),
            freshness_score: 95,
          };

          await upsertArticle(updatedArticle);
          updatedCount++;
          globalCrawlQueue.markCompleted(job.id, candidate);
          actions.push(`Evolved story "${target.title}" to version ${updatedArticle.version}.`);

          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'updated',
            headline: `Evolved Story: "${target.title.slice(0, 60)}..."`,
            details: `Appended new corroboration from ${candidate.sourceName}.`,
          });
          continue;
        }

        if (evalResult.decision === 'publish_new') {
          actions.push(`Verifying novel story candidate: "${candidate.title}"`);

          // 1. Gather corroborating evidence from web
          const corroborations = await searchTopicDeepDive(candidate.title).catch(() => []);
          const sourcesForAgent = [
            {
              title: candidate.title,
              snippet: candidate.snippet,
              source: candidate.sourceName,
              url: candidate.url,
            },
            ...corroborations,
          ];

          // 2. Execute 4-Agent AI Pipeline
          const agentOutput = await runMultiAgentPipeline(candidate.title, sourcesForAgent);

          // 3. Look up high-res artwork via TMDB
          let mediaImage = '';
          if (agentOutput.image_search_query) {
            mediaImage = await searchMediaImage(agentOutput.image_search_query);
          }
          if (!mediaImage) {
            mediaImage = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80';
          }

          // 4. Construct production broadsheet article
          const nowTs = Date.now();
          const newArticle: Article = {
            title: agentOutput.title,
            slug: `${agentOutput.slug}-${nowTs.toString().slice(-4)}`,
            lead_paragraph: agentOutput.lead_paragraph,
            body_markdown: agentOutput.body_markdown,
            category: agentOutput.category || candidate.categoryHint || 'Cinema',
            author: agentOutput.author,
            verification_score: agentOutput.verification_score,
            verification_summary: agentOutput.verification_summary,
            sources_json: JSON.stringify(agentOutput.sources),
            image_url: mediaImage,
            image_caption: agentOutput.image_caption,
            published_at: new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            published_timestamp: nowTs,
            freshness_score: 99,
            trending_score: 85,
            edition: candidate.sourceName.includes('Reddit') ? 'Reddit Viral Wire Edition' : 'Global Trade Edition',
            is_breaking: true,
            urgency_level: agentOutput.urgency_level || 'notable',
            status: 'published',
            version: 1,
            tags: agentOutput.tags,
            content_agent: agentOutput.content_agent,
            fact_check_agent: agentOutput.fact_check_agent,
            seo_agent: agentOutput.seo_agent,
            quality_agent: agentOutput.quality_agent,
          };

          // 5. Persist to storage engine & Appwrite Cloud
          await upsertArticle(newArticle);
          await saveArticleToAppwrite(newArticle);
          publishedCount++;
          globalCrawlQueue.markCompleted(job.id, candidate);
          actions.push(`Published certified broadsheet: "${newArticle.title}"`);

          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'published',
            headline: `Published: "${newArticle.title.slice(0, 60)}..."`,
            details: `AI Verification: ${newArticle.verification_score} | Certified by 4 Agents.`,
          });
        }
      } catch (err: any) {
        errorsCount++;
        console.error(`Error processing job for "${candidate.title}":`, err);
        globalCrawlQueue.markFailed(job.id, err.message || 'Processing failure');

        await addCrawlerLog({
          source: candidate.sourceName,
          action: 'error',
          headline: `Processing Error: "${candidate.title.slice(0, 50)}"`,
          details: err.message || 'Unknown processing failure',
        });
      }
    }

    // Update telemetry state
    const elapsedMs = Date.now() - startMs;
    const currentTelemetry = await getTelemetry();
    const queueMetrics = globalCrawlQueue.getMetrics();

    await updateTelemetry({
      status: 'idle',
      last_cycle_completed_at: new Date().toISOString(),
      next_scheduled_run_at: new Date(Date.now() + 10 * 1000).toISOString(),
      total_cycles_completed: currentTelemetry.total_cycles_completed + 1,
      total_articles_discovered: currentTelemetry.total_articles_discovered + allCandidates.length,
      total_articles_published: currentTelemetry.total_articles_published + publishedCount,
      total_articles_updated: currentTelemetry.total_articles_updated + updatedCount,
      total_duplicates_filtered: currentTelemetry.total_duplicates_filtered + skippedCount,
      successful_crawls: (currentTelemetry.successful_crawls || 0) + (errorsCount === 0 ? 1 : 0),
      failed_crawls: (currentTelemetry.failed_crawls || 0) + (errorsCount > 0 ? 1 : 0),
      queue_size: queueMetrics.queuedCount,
      average_processing_time_ms: Math.round(elapsedMs),
      active_sources_count: enabledSources.length,
    });

    actions.push(`Autonomous Cycle Complete: Published ${publishedCount}, Updated ${updatedCount}, Filtered ${skippedCount} duplicates in ${elapsedMs}ms.`);
  } catch (globalErr: any) {
    console.error('Fatal error in autonomous worker cycle:', globalErr);
    await updateTelemetry({ status: 'error' });
    actions.push(`Fatal cycle error: ${globalErr.message}`);
    errorsCount++;
  } finally {
    isCycleRunning = false;
    lastCycleTimeMs = Date.now();
  }

  return {
    success: errorsCount === 0 || publishedCount > 0,
    cycleStartedAt: startTime,
    cycleCompletedAt: new Date().toISOString(),
    candidatesDiscovered: publishedCount + updatedCount + skippedCount,
    articlesPublished: publishedCount,
    articlesUpdated: updatedCount,
    duplicatesSkipped: skippedCount,
    errorsEncountered: errorsCount,
    actions,
  };
}

// 10-second fast sweep for continuous real-time processing
export async function runFastAutonomousSweep(): Promise<{ processed: boolean; message: string }> {
  // Guard against overlapping sweeps within 8 seconds
  if (isCycleRunning || Date.now() - lastCycleTimeMs < 8000) {
    return { processed: false, message: 'Worker busy or recently executed' };
  }

  // Check if queue has pending items
  const queueMetrics = globalCrawlQueue.getMetrics();
  if (queueMetrics.queuedCount === 0) {
    // If queue is empty, trigger a quick cycle to replenish
    const report = await runAutonomousCycle(false);
    return { processed: report.success, message: `Discovered and processed: ${report.articlesPublished} published` };
  }

  const report = await runAutonomousCycle(false);
  return { processed: report.success, message: `Sweep complete: ${report.articlesPublished} published` };
}
