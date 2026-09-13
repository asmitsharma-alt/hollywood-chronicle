'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  RefreshCw,
  Play,
  Zap,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import { AutonomousWorkerTelemetry, Article } from '@/types/article';
import { CrawlSource } from '@/lib/crawler/source-registry';
import { QueueMetrics } from '@/lib/crawler/crawl-queue';

export default function AdminDashboardPage() {
  const [telemetry, setTelemetry] = useState<AutonomousWorkerTelemetry | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // New source form state
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState<'rss' | 'reddit' | 'html' | 'playwright_dynamic'>('rss');
  const [newSourceCategory, setNewSourceCategory] = useState<CrawlSource['category']>('Indian Cinema');
  const [newSourceReliability, setNewSourceReliability] = useState('0.95');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [telRes, artRes, srcRes, queueRes] = await Promise.all([
        fetch('/api/telemetry'),
        fetch('/api/articles?limit=50'),
        fetch('/api/crawler/sources'),
        fetch('/api/crawler/queue')
      ]);

      if (telRes.ok) {
        const tData = await telRes.json();
        setTelemetry(tData);
      }
      if (artRes.ok) {
        const aData = await artRes.json();
        setArticles(aData.articles || []);
      }
      if (srcRes.ok) {
        const sData = await srcRes.json();
        setSources(sData.sources || []);
      }
      if (queueRes.ok) {
        const qData = await queueRes.json();
        setQueueMetrics(qData.metrics || null);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCycle = async (forceDeep = false) => {
    try {
      setTriggering(true);
      setMessage(forceDeep ? 'Deep crawl cycle initiated across all sources...' : 'Executing 10-second fast autonomous sweep...');
      const res = await fetch('/api/crawler/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceDeep })
      });

      if (res.ok) {
        setMessage('Autonomous sweep complete. Articles catalog & queue refreshed.');
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

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;

    try {
      const res = await fetch('/api/crawler/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSourceName,
          url: newSourceUrl,
          type: newSourceType,
          category: newSourceCategory,
          reliabilityScore: parseFloat(newSourceReliability) || 0.9,
          refreshIntervalSeconds: 10
        })
      });

      if (res.ok) {
        setMessage(`Successfully registered new source: "${newSourceName}"`);
        setNewSourceName('');
        setNewSourceUrl('');
        setShowAddSource(false);
        await fetchStatus();
      }
    } catch (err: any) {
      setMessage(`Failed to add source: ${err.message}`);
    }
  };

  const handleRemoveSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove source "${name}"?`)) return;
    try {
      const res = await fetch(`/api/crawler/sources?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessage(`Removed source "${name}".`);
        await fetchStatus();
      }
    } catch (err: any) {
      setMessage(`Failed to remove source: ${err.message}`);
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
              <span>THE SMOC TIMES • 24/7 AUTONOMOUS INGESTION ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-stone-950 mt-1 font-headline">
              Newsroom Operations &amp; Autonomous Pipeline
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="px-3 py-1.5 bg-white border border-stone-400 font-mono text-xs uppercase tracking-wider font-bold hover:bg-stone-100 transition inline-flex items-center gap-1.5"
            >
              <span>← Broadsheet Front Page</span>
            </Link>

            <button
              onClick={() => handleTriggerCycle(false)}
              disabled={triggering}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-xs uppercase tracking-widest font-bold transition shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>10s Fast Sweep</span>
            </button>

            <button
              onClick={() => handleTriggerCycle(true)}
              disabled={triggering}
              className="px-4 py-1.5 bg-[#8b181b] hover:bg-[#a3191d] text-white font-mono text-xs uppercase tracking-widest font-bold transition shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
              <span>{triggering ? 'Crawling...' : 'Trigger Deep Cycle'}</span>
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
            <span className="text-[9px] font-mono text-stone-500 block mt-1">10s Continuous</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Queue Status</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {queueMetrics?.queuedCount || 0}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Jobs Pending</span>
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Avg Crawl Time</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {queueMetrics?.averageProcessingTimeMs || telemetry?.average_processing_time_ms || 140}ms
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Per Execution</span>
          </div>

          <div className="border-2 border-stone-800 bg-[#fbf9f4] p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">Active Sources</span>
            <div className="font-mono text-2xl font-extrabold text-stone-900 mt-1">
              {sources.length || telemetry?.active_sources_count || 11}
            </div>
            <span className="text-[9px] font-mono text-stone-500 block mt-1">Configured Feeds</span>
          </div>
        </div>

        {/* Dynamic Source Management System */}
        <div className="border-2 border-stone-900 bg-[#fbf9f4] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-stone-800 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b181b] font-bold block">
                Intelligent Source Registry
              </span>
              <h3 className="font-serif font-bold text-xl uppercase text-stone-900">
                Monitored Feeds &amp; Reliability Scores ({sources.length})
              </h3>
            </div>

            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="px-3 py-1.5 bg-stone-900 text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-[#8b181b] transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddSource ? 'Cancel' : 'Add New Source'}</span>
            </button>
          </div>

          {/* Inline Add Source Form */}
          {showAddSource && (
            <form onSubmit={handleAddSource} className="p-4 bg-stone-100 border border-stone-400 space-y-3 font-mono text-xs">
              <h4 className="font-serif font-bold text-sm text-stone-900 uppercase">Register New Intelligent Source</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Source Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reuters Entertainment"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">URL (Feed / API)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/feed"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Type</label>
                  <select
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value as any)}
                    className="w-full p-1.5 bg-white border border-stone-400"
                  >
                    <option value="rss">RSS Feed</option>
                    <option value="reddit">Reddit JSON</option>
                    <option value="html">Static HTML</option>
                    <option value="playwright_dynamic">Playwright Dynamic JS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Category</label>
                  <select
                    value={newSourceCategory}
                    onChange={(e) => setNewSourceCategory(e.target.value as any)}
                    className="w-full p-1.5 bg-white border border-stone-400"
                  >
                    <option value="Indian Cinema">Indian Cinema</option>
                    <option value="Gaming & Esports">Gaming &amp; Esports</option>
                    <option value="Business & D-Street">Business &amp; D-Street</option>
                    <option value="Indian Pop Culture">Indian Pop Culture</option>
                    <option value="Hollywood & Global">Hollywood &amp; Global</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">Reliability (0.1 - 1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="1.0"
                    value={newSourceReliability}
                    onChange={(e) => setNewSourceReliability(e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-400"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8b181b] text-white font-bold uppercase tracking-wider hover:bg-black transition"
                >
                  Save &amp; Activate Source
                </button>
              </div>
            </form>
          )}

          {/* Sources List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-400 font-mono text-[10px] uppercase tracking-wider text-stone-700 bg-stone-200/60">
                  <th className="py-2 px-2">Source</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2 text-center">Reliability</th>
                  <th className="py-2 px-2 text-center">Status</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300 font-mono text-[11px]">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-stone-100 transition">
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-stone-900 font-serif text-xs">{src.name}</div>
                      <div className="text-[10px] text-stone-500 truncate max-w-xs">{src.url}</div>
                    </td>
                    <td className="py-2.5 px-2 uppercase text-[10px] text-stone-700">
                      <span className="px-1.5 py-0.5 bg-stone-200 border border-stone-300">
                        {src.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-stone-800">{src.category}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="font-bold text-emerald-800">
                        ★ {Math.round(src.reliabilityScore * 100)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>{src.lastStatus || 'active'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => handleRemoveSource(src.id, src.name)}
                        className="text-red-700 hover:text-red-900 font-bold p-1"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Crawler Machine Log */}
        <div className="border-2 border-stone-900 bg-[#161412] text-[#e8dcc4] p-5 space-y-3 font-mono">
          <div className="border-b border-stone-700 pb-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Live Autonomous Crawler &amp; Queue Stream
              </span>
            </div>
            <span className="text-[10px] text-stone-400">
              Auto-sweep: Every 10s • Active queue: {queueMetrics?.queuedCount || 0} jobs
            </span>
          </div>

          <div className="space-y-2 text-[11px] max-h-96 overflow-y-auto pr-2 divide-y divide-stone-800">
            {telemetry?.recent_logs && telemetry.recent_logs.length > 0 ? (
              telemetry.recent_logs.map((log, i) => (
                <div key={log.id || i} className="pt-2 first:pt-0 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-stone-400">
                    <span className="font-bold text-stone-300">[{log.source}]</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span
                      className={`px-1 py-0.2 text-[9px] font-bold uppercase shrink-0 ${
                        log.action === 'published'
                          ? 'bg-emerald-900 text-emerald-200'
                          : log.action === 'updated'
                          ? 'bg-amber-900 text-amber-200'
                          : log.action === 'duplicate_skipped'
                          ? 'bg-stone-800 text-stone-400'
                          : log.action === 'error'
                          ? 'bg-red-950 text-red-300'
                          : 'bg-blue-950 text-blue-300'
                      }`}
                    >
                      {log.action}
                    </span>
                    <p className="text-stone-200 font-bold leading-tight line-clamp-1">{log.headline}</p>
                  </div>
                  <p className="text-stone-400 text-[10px] leading-tight line-clamp-1">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-stone-500">Awaiting next autonomous 10s sweep...</div>
            )}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                    <span className="text-stone-500 font-bold">VERIFICATION: {article.verification_score}</span>
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

                  <p className="font-serif text-xs text-stone-600 line-clamp-1 italic">{article.lead_paragraph}</p>
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
