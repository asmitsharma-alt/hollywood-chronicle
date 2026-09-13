import { CrawlSource } from './source-registry';
import { DiscoveredStoryCandidate } from './rss-collector';

export interface CrawlJob {
  id: string;
  sourceId: string;
  sourceName: string;
  url: string;
  type: 'rss' | 'reddit' | 'html' | 'playwright_dynamic';
  category: string;
  reliabilityScore: number;
  priority: number; // Higher number = higher priority
  attempts: number;
  maxAttempts: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  createdAt: number;
  updatedAt: number;
  error?: string;
  resultCandidate?: DiscoveredStoryCandidate;
}

export interface QueueMetrics {
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  averageProcessingTimeMs: number;
  lastProcessedAt?: string;
}

class CrawlQueue {
  private queue: CrawlJob[] = [];
  private processing: Map<string, CrawlJob> = new Map();
  private completed: CrawlJob[] = [];
  private failed: CrawlJob[] = [];
  private totalProcessingTimeMs = 0;
  private totalProcessedCount = 0;

  public enqueue(job: Omit<CrawlJob, 'id' | 'attempts' | 'status' | 'createdAt' | 'updatedAt'>): CrawlJob {
    // Avoid duplicate URL enqueuing if already pending or processing
    const existing = this.queue.find((j) => j.url === job.url) || this.processing.get(job.url);
    if (existing) {
      return existing;
    }

    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fullJob: CrawlJob = {
      ...job,
      id,
      attempts: 0,
      status: 'queued',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.queue.push(fullJob);
    // Sort by priority descending (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
    return fullJob;
  }

  public getNextJob(): CrawlJob | null {
    if (this.queue.length === 0) return null;
    const job = this.queue.shift()!;
    job.status = 'processing';
    job.attempts += 1;
    job.updatedAt = Date.now();
    this.processing.set(job.id, job);
    return job;
  }

  public markCompleted(jobId: string, candidate?: DiscoveredStoryCandidate): void {
    const job = this.processing.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.resultCandidate = candidate;
    job.updatedAt = Date.now();
    this.processing.delete(jobId);

    const elapsed = job.updatedAt - job.createdAt;
    this.totalProcessingTimeMs += elapsed;
    this.totalProcessedCount += 1;

    this.completed.unshift(job);
    if (this.completed.length > 50) this.completed.pop();
  }

  public markFailed(jobId: string, errorMessage: string): void {
    const job = this.processing.get(jobId);
    if (!job) return;

    job.updatedAt = Date.now();
    job.error = errorMessage;
    this.processing.delete(jobId);

    if (job.attempts < job.maxAttempts) {
      // Retry with exponential backoff
      job.status = 'retrying';
      const backoffMs = Math.min(30000, 1000 * Math.pow(2, job.attempts));
      setTimeout(() => {
        job.status = 'queued';
        this.queue.push(job);
        this.queue.sort((a, b) => b.priority - a.priority);
      }, backoffMs);
    } else {
      job.status = 'failed';
      this.failed.unshift(job);
      if (this.failed.length > 50) this.failed.pop();
    }
  }

  public getMetrics(): QueueMetrics {
    return {
      queuedCount: this.queue.length,
      processingCount: this.processing.size,
      completedCount: this.completed.length,
      failedCount: this.failed.length,
      averageProcessingTimeMs:
        this.totalProcessedCount > 0 ? Math.round(this.totalProcessingTimeMs / this.totalProcessedCount) : 0,
      lastProcessedAt: this.completed[0] ? new Date(this.completed[0].updatedAt).toISOString() : undefined,
    };
  }

  public getRecentJobs(limit = 10) {
    return {
      active: Array.from(this.processing.values()),
      queued: this.queue.slice(0, limit),
      completed: this.completed.slice(0, limit),
      failed: this.failed.slice(0, limit),
    };
  }
}

export const globalCrawlQueue = new CrawlQueue();
