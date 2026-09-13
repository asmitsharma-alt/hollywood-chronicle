export interface ArticleSource {
  name: string;
  url: string;
  stance?: 'corroborated' | 'primary' | 'rumor' | 'debunked';
  snippet?: string;
}

export interface StoryUpdate {
  timestamp: string;
  headline: string;
  summary: string;
  added_sources: string[];
}

export interface ContentAgentMetadata {
  tone: string;
  executive_takeaways: string[];
  reading_time_minutes: number;
  key_entities: string[];
}

export interface FactCheckMetadata {
  score: number;
  confidence_level: 'Absolute' | 'High' | 'Moderate' | 'Guarded';
  verified_claims: string[];
  debunked_claims: string[];
  consensus_summary: string;
}

export interface SeoMetadata {
  meta_title: string;
  meta_description: string;
  keywords: string[];
  canonical_url: string;
}

export interface QualityMetadata {
  grammar_score: number;
  readability_grade: string;
  production_ready: boolean;
  reviewed_at: string;
}

export interface Article {
  $id?: string;
  title: string;
  slug: string;
  lead_paragraph: string;
  body_markdown: string;
  category: 'Cinema' | 'Television' | 'Industry' | 'Box Office' | 'Awards' | 'Music' | 'Pop Culture' | string;
  author: string;
  verification_score: string;
  verification_summary: string;
  sources_json: string;
  image_url: string;
  image_caption: string;
  published_at: string;
  last_updated_at?: string;
  edition: string;
  is_breaking: boolean;
  urgency_level?: 'routine' | 'notable' | 'breaking' | 'bulletin';
  status: 'published' | 'draft' | 'archived';
  version?: number;
  update_history?: StoryUpdate[];
  fingerprint_hash?: string;
  tags?: string[];
  view_count?: number;
  published_timestamp?: number;
  freshness_score?: number;
  trending_score?: number;
  
  // AI Agent Inspection Dossier
  content_agent?: ContentAgentMetadata;
  fact_check_agent?: FactCheckMetadata;
  seo_agent?: SeoMetadata;
  quality_agent?: QualityMetadata;

  $createdAt?: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  popularity: number;
}

export interface CrawlerLogEntry {
  id: string;
  timestamp: string;
  source: string;
  action: 'discovered' | 'filtered' | 'verified' | 'synthesized' | 'published' | 'updated' | 'duplicate_skipped' | 'error';
  headline: string;
  details: string;
}

export interface AutonomousWorkerTelemetry {
  worker_id: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  last_cycle_started_at: string;
  last_cycle_completed_at: string;
  next_scheduled_run_at: string;
  total_cycles_completed: number;
  total_articles_discovered: number;
  total_articles_published: number;
  total_articles_updated: number;
  total_duplicates_filtered: number;
  uptime_seconds: number;
  active_sources_count: number;
  successful_crawls?: number;
  failed_crawls?: number;
  queue_size?: number;
  average_processing_time_ms?: number;
  recent_logs: CrawlerLogEntry[];
}

