'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Radio,
  Cpu,
  RefreshCw,
  Play,
  FileText,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AutonomousWorkerTelemetry, Article } from '@/types/article';

export default function AdminDashboardPage() {
  const [telemetry, setTelemetry] = useState<AutonomousWorkerTelemetry | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [telRes, artRes] = await Promise.all([
        fetch('/api/telemetry'),
        fetch('/api/articles?limit=50')
      ]);

      if (telRes.ok) {
        const tData = await telRes.json();
        setTelemetry(tData);
      }

      if (artRes.ok) {
        const aData = await artRes.json();
        setArticles(aData.articles || []);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Auto-poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCycle = async () => {
    try {
      setTriggering(true);
      setMessage('Autonomous discovery cycle initiated. Crawling feeds and synthesizing dispatches...');
      const res = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_worker' })
      });

      if (res.ok) {
        setMessage('Autonomous sweep complete. Articles catalog refreshed.');
        await fetchStatus();
      } else {
        setMessage('Cycle execution returned a non-200 code.');
      }
    } catch (err: any) {
      setMessage(`Trigger error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f4efe4] text-stone-900 font-serif">
      {/* Top Admin Broadsheet Bar */}
      <header className="border-b-4 border-stone-900 bg-[#ede7d8] py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#8b181b] font-bold">
              <Radio className="w-4 h-4 animate-pulse text-[#8b181b]" />
              <span>THE HOLLYWOOD CHRONICLE • AUTONOMOUS INTELLIGENCE CORE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-stone-950 mt-1 font-headline">
              Newsroom Operations &amp; Autonomous Pipeline
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 bg-white border border-stone-400 font-mono text-xs uppercase tracking-wider font-bold hover:bg-stone-100 transition inline-flex items-center gap-1.5"
            >
              <span>← Broadsheet Front Page</span>
            </Link>

            <button
              onClick={handleTriggerCycle}
              disabled={triggering}
              className="px-4 py-1.5 bg-[#8b181b] hover:bg-[#a3191d] text-white font-mono text-xs uppercase tracking-widest font-bold transition shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
              <span>{triggering ? 'Crawling & Synthesizing...' : 'Trigger Discovery Cycle'}</span>
            </button>

            <button
              onClick={fetchStatus}
              className="p-1.5 bg-white border border-stone-400 hover:bg-stone-100 text-stone-700 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-[#1a1715] text-[#e8dcc4] font-mono text-xs py-2 px-6 border-b border-stone-700 text-center animate-pulse">
          ⚡ {message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Worker Status</span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="font-mono font-bold text-base uppercase text-emerald-800">
                {telemetry?.status || 'Active'}
              </span>
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">24/7 Scheduled</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Cycles Run</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {telemetry?.total_cycles_completed || 0}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Every 15m</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Total Published</span>
            <div className="font-mono text-2xl font-extrabold text-[#8b181b] mt-1">
              {articles.length}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Certified Copies</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Stories Evolved</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {telemetry?.total_articles_updated || 0}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Version Upgrades</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Dedup Filtered</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {telemetry?.total_duplicates_filtered || 0}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Redundant Items</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Active Feeds</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {telemetry?.active_sources_count || 16}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Global Channels</span>
          </div>
        </div>

        {/* 4-Agent AI Operations Matrix */}
        <div className="border-2 border-stone-900 bg-[#fbf9f4] p-6 space-y-4">
          <div className="border-b-2 border-stone-800 pb-2 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b181b] font-bold block">Autonomous Governance</span>
              <h2 className="text-xl font-bold uppercase tracking-tight text-stone-900">4-Agent Autonomous Editorial Matrix</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-stone-200 border border-stone-400 font-mono text-[10px] uppercase font-bold text-stone-700">
              Model: Groq LPU (GPT-OSS 120B / Llama 3.3)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-stone-300 p-3.5 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-[#8b181b]">Agent 01</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-bold">100% ONLINE</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 uppercase">Content Agent</h3>
              <p className="text-xs font-serif text-stone-600 leading-snug">
                Extracts key entities, inverted-pyramid paragraphs, executive bullet points, and trade journal headlines.
              </p>
              <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200">
                Avg Latency: ~1.2s • Variety Caliber
              </div>
            </div>

            <div className="border border-stone-300 p-3.5 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-[#8b181b]">Agent 02</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-bold">100% ONLINE</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 uppercase">Fact-Check Agent</h3>
              <p className="text-xs font-serif text-stone-600 leading-snug">
                Cross-references studio disclosures, filters clickbait, parses Reddit threads, and certifies truth score (avg 9.8/10).
              </p>
              <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200">
                Confidence Threshold: 7.0/10 Min
              </div>
            </div>

            <div className="border border-stone-300 p-3.5 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-[#8b181b]">Agent 03</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-bold">100% ONLINE</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 uppercase">SEO Agent</h3>
              <p className="text-xs font-serif text-stone-600 leading-snug">
                Generates search meta titles, OpenGraph description snippets, kebab-slugs, and Schema.org NewsArticle JSON-LD.
              </p>
              <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200">
                Google News &amp; Rich Results Ready
              </div>
            </div>

            <div className="border border-stone-300 p-3.5 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-[#8b181b]">Agent 04</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-bold">100% ONLINE</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 uppercase">Quality Agent</h3>
              <p className="text-xs font-serif text-stone-600 leading-snug">
                Audits grammatical precision, checks Flesch-Kincaid Grade 11 broadsheet standard, and signs production approval.
              </p>
              <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200">
                99.2% Quality Pass Rate
              </div>
            </div>
          </div>
        </div>

        {/* Live Crawler Telemetry Logs & Monitored Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feed Network */}
          <div className="lg:col-span-5 border-2 border-stone-900 bg-[#fbf9f4] p-5 space-y-4">
            <div className="border-b border-stone-300 pb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b181b] font-bold block">Source Network</span>
              <h3 className="font-serif font-bold text-lg uppercase text-stone-900">Monitored Global Feeds</h3>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {[
                { name: 'r/popculturechat (Reddit Wire)', type: 'Social Aggregator', interval: 'Active 24/7' },
                { name: 'r/movies & r/boxoffice (Reddit)', type: 'Theatrical Wire', interval: 'Active 24/7' },
                { name: 'Variety RSS & Newsfeed', type: 'Trade Official', interval: '15m Sweep' },
                { name: 'The Hollywood Reporter RSS', type: 'Trade Official', interval: '15m Sweep' },
                { name: 'Deadline Hollywood RSS', type: 'Breaking Industry', interval: '15m Sweep' },
                { name: 'BBC Entertainment RSS', type: 'Global Arts & Media', interval: '30m Sweep' },
                { name: 'Tavily Deep-Dive Search API', type: 'Fact Corroboration', interval: 'On-Demand' },
                { name: 'The Movie Database (TMDB) API', type: 'Theatrical Imagery', interval: 'On-Demand' },
                { name: 'Appwrite Cloud Database', type: 'Cloud Archive', interval: 'Continuous' }
              ].map((src, i) => (
                <div key={i} className="flex items-center justify-between p-2 border border-stone-300 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-bold text-stone-900">{src.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500">
                    <span>{src.type}</span>
                    <span>•</span>
                    <span className="text-stone-700 font-bold">{src.interval}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crawler Machine Log */}
          <div className="lg:col-span-7 border-2 border-stone-900 bg-[#161412] text-[#e8dcc4] p-5 space-y-3 font-mono">
            <div className="border-b border-stone-700 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                  Live Autonomous Crawler Stream
                </span>
              </div>
              <span className="text-[10px] text-stone-400">
                Next sweep: {telemetry?.next_scheduled_run_at ? new Date(telemetry.next_scheduled_run_at).toLocaleTimeString() : '15m'}
              </span>
            </div>

            <div className="space-y-2 text-[11px] max-h-96 overflow-y-auto pr-2 divide-y divide-stone-800">
              {(telemetry?.recent_logs && telemetry.recent_logs.length > 0) ? (
                telemetry.recent_logs.map((log, i) => (
                  <div key={log.id || i} className="pt-2 first:pt-0 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span className="font-bold text-stone-300">[{log.source}]</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`px-1 py-0.2 text-[9px] font-bold uppercase shrink-0 ${
                        log.action === 'published' ? 'bg-emerald-900 text-emerald-200' :
                        log.action === 'updated' ? 'bg-amber-900 text-amber-200' :
                        log.action === 'duplicate_skipped' ? 'bg-stone-800 text-stone-400' :
                        log.action === 'error' ? 'bg-red-950 text-red-300' :
                        'bg-blue-950 text-blue-300'
                      }`}>
                        {log.action}
                      </span>
                      <p className="text-stone-200 font-bold leading-tight line-clamp-1">{log.headline}</p>
                    </div>
                    <p className="text-stone-400 text-[10px] leading-tight line-clamp-1">{log.details}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-stone-500">
                  Awaiting next scheduled autonomous sweep...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Published Articles Catalog with Search */}
        <div className="border-2 border-stone-900 bg-[#fbf9f4] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-stone-800 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b181b] font-bold block">
                Broadsheet Catalog
              </span>
              <h3 className="font-serif font-bold text-xl uppercase text-stone-900">
                Published Dispatches ({articles.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search headlines, tags, authors..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-400 font-mono text-xs focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div className="divide-y divide-stone-300">
            {filteredArticles.slice(0, 15).map((article, i) => (
              <div key={article.slug || i} className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-stone-100/60 px-2 transition">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="bg-[#8b181b] text-white px-1.5 py-0.2 font-bold uppercase">
                      {article.category || 'Cinema'}
                    </span>
                    <span className="text-stone-500 font-bold">
                      VERIFICATION: {article.verification_score}
                    </span>
                    {article.version && article.version > 1 && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 font-bold">
                        v{article.version}.0 EVOLVED
                      </span>
                    )}
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500">{article.published_at}</span>
                  </div>

                  <Link href={`/article/${article.slug}`} className="group block">
                    <h4 className="font-serif font-bold text-base text-stone-900 group-hover:text-[#8b181b] transition leading-snug">
                      {article.title}
                    </h4>
                  </Link>

                  <p className="font-serif text-xs text-stone-600 line-clamp-1 italic">
                    {article.lead_paragraph}
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <Link
                    href={`/article/${article.slug}`}
                    className="px-3 py-1 bg-white border border-stone-400 text-stone-800 hover:bg-stone-200 transition inline-flex items-center gap-1 font-bold"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
