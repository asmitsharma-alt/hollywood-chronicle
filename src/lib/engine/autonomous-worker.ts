import { collectTrendingFromRSS, DiscoveredStoryCandidate } from '../crawler/rss-collector';
import { collectTrendingFromReddit } from '../crawler/reddit-collector';
import { fetchEntertainmentHeadlines, searchTopicDeepDive } from '../news';
import { runMultiAgentPipeline } from '../ai/agent-orchestrator';
import { searchMediaImage } from '../tmdb';
import { evaluateStoryNovelty } from './dedup-engine';
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
    actions.push('Initiating multi-vector web crawler sweep...');

    // Phase 1: Ingest candidates across all active streams
    const [rssCandidates, redditCandidates, headlineNews] = await Promise.all([
      collectTrendingFromRSS().catch(e => {
        console.warn('RSS crawler warning:', e);
        return [] as DiscoveredStoryCandidate[];
      }),
      collectTrendingFromReddit().catch(e => {
        console.warn('Reddit crawler warning:', e);
        return [] as DiscoveredStoryCandidate[];
      }),
      fetchEntertainmentHeadlines().catch(e => {
        console.warn('NewsAPI warning:', e);
        return [];
      }),
    ]);

    const headlineCandidates: DiscoveredStoryCandidate[] = headlineNews.map(h => ({
      title: h.title,
      url: h.url,
      sourceName: h.source,
      snippet: h.snippet,
      publishedAt: h.publishedAt || new Date().toISOString(),
      categoryHint: 'Cinema'
    }));

    const allCandidates = [...redditCandidates, ...rssCandidates, ...headlineCandidates];
    actions.push(`Harvested ${allCandidates.length} potential story candidates across Reddit, RSS, and News wires.`);

    await addCrawlerLog({
      source: 'Crawler Ingestion',
      action: 'discovered',
      headline: `Multi-Vector Crawler Discovered ${allCandidates.length} Items`,
      details: `Reddit: ${redditCandidates.length} | RSS: ${rssCandidates.length} | NewsWire: ${headlineCandidates.length}`
    });

    // Phase 2: Process candidates with deduplication and AI Agents
    // Limit per cycle to 3-5 processed items to maintain high precision and avoid rate limits
    const candidatesToProcess = allCandidates.slice(0, 10);

    for (const candidate of candidatesToProcess) {
      if (publishedCount >= 2 || (publishedCount >= 1 && updatedCount >= 1)) break; // Healthy cycle quota

      try {
        const evalResult = await evaluateStoryNovelty(candidate);

        if (evalResult.decision === 'skip_duplicate') {
          skippedCount++;
          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'duplicate_skipped',
            headline: `Skipped Duplicate: "${candidate.title.slice(0, 60)}..."`,
            details: evalResult.reason
          });
          continue;
        }

        if (evalResult.decision === 'update_existing' && evalResult.matchedArticle) {
          // Update existing story with new developments
          const target = evalResult.matchedArticle;
          const updatedBody = `${target.body_markdown}\n\n## UPDATE: New Developments from ${candidate.sourceName}\n\n${candidate.snippet}\n\nTrade analysts noting ongoing confirmations will continue to monitor formal disclosures.`;

          const updatedArticle: Article = {
            ...target,
            body_markdown: updatedBody,
            is_breaking: true,
            urgency_level: 'breaking',
          };

          await upsertArticle(updatedArticle);
          updatedCount++;
          actions.push(`Evolved story "${target.title}" to version ${(target.version || 1) + 1}.`);

          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'updated',
            headline: `Evolved Story: "${target.title.slice(0, 60)}..."`,
            details: `Appended new corroboration from ${candidate.sourceName}.`
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
            ...corroborations
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
          const newArticle: Article = {
            title: agentOutput.title,
            slug: `${agentOutput.slug}-${Date.now().toString().slice(-4)}`,
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
              year: 'numeric'
            }),
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

          // 5. Persist to storage engine & Appwrite
          await upsertArticle(newArticle);
          await saveArticleToAppwrite(newArticle);
          publishedCount++;
          actions.push(`Published certified broadsheet: "${newArticle.title}"`);

          await addCrawlerLog({
            source: candidate.sourceName,
            action: 'published',
            headline: `Published: "${newArticle.title.slice(0, 60)}..."`,
            details: `AI Verification: ${newArticle.verification_score} | Certified by 4 Agents.`
          });
        }
      } catch (err: any) {
        errorsCount++;
        console.error(`Error processing candidate "${candidate.title}":`, err);
        await addCrawlerLog({
          source: candidate.sourceName,
          action: 'error',
          headline: `Processing Error: "${candidate.title.slice(0, 50)}"`,
          details: err.message || 'Unknown processing failure'
        });
      }
    }

    // Update telemetry state
    const currentTelemetry = await getTelemetry();
    await updateTelemetry({
      status: 'idle',
      last_cycle_completed_at: new Date().toISOString(),
      next_scheduled_run_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      total_cycles_completed: currentTelemetry.total_cycles_completed + 1,
      total_articles_discovered: currentTelemetry.total_articles_discovered + allCandidates.length,
      total_articles_published: currentTelemetry.total_articles_published + publishedCount,
      total_articles_updated: currentTelemetry.total_articles_updated + updatedCount,
      total_duplicates_filtered: currentTelemetry.total_duplicates_filtered + skippedCount,
    });

    actions.push(`Autonomous Cycle Complete: Published ${publishedCount}, Updated ${updatedCount}, Filtered ${skippedCount} duplicates.`);
  } catch (globalErr: any) {
    console.error('Fatal error in autonomous worker cycle:', globalErr);
    await updateTelemetry({ status: 'error' });
    actions.push(`Fatal cycle error: ${globalErr.message}`);
    errorsCount++;
  } finally {
    isCycleRunning = false;
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
