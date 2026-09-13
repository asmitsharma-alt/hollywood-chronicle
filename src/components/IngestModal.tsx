'use client';

import React, { useState } from 'react';
import { Sparkles, Terminal, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Flame } from 'lucide-react';
import { Article } from '@/types/article';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onArticleGenerated: (article: Article) => void;
}

export default function IngestModal({ isOpen, onClose, onArticleGenerated }: Props) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultArticle, setResultArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleGenerate = async (selectedTopic?: string) => {
    const targetTopic = selectedTopic || topic;
    setLoading(true);
    setLogs([]);
    setError(null);
    setResultArticle(null);

    addLog(`INITIATING TELEGRAPH WIRE: "${targetTopic || 'Auto-Fetch Latest Entertainment Headlines'}"`);
    addLog('Querying trade news wires (NewsAPI & Tavily web search)...');

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic }),
      });

      addLog('Incoming news reports received. Feeding to Groq AI LPU...');
      addLog('Cross-referencing claims across trade publications (Variety, Deadline, THR)...');
      addLog('Verifying facts, filtering rumors, calculating confidence rating...');

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Ingestion engine encountered an error.');
      }

      addLog('Corroboration complete. Querying TMDB for high-res archival media...');
      addLog(`Appwrite database save: ${data.appwriteStatus?.success ? 'SUCCESS (Row Created)' : 'Cached locally'}`);
      addLog(`DISPATCH READY: "${data.article.title}" (Score: ${data.article.verification_score})`);

      setResultArticle(data.article);
      onArticleGenerated(data.article);
    } catch (err: any) {
      setError(err.message || 'Failed to generate dispatch.');
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeReddit = async () => {
    setLoading(true);
    setLogs([]);
    setError(null);
    setResultArticle(null);

    addLog('CONNECTING TO REDDIT STREAM: r/popculturechat, r/movies, r/boxoffice...');
    addLog('Scraping top trending pop culture threads and breaking discussions...');

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'reddit' }),
      });

      addLog('Real-time Reddit discussion thread extracted!');
      addLog('Searching Tavily for official studio and trade press verification...');
      addLog('Groq AI LPU synthesizing broadsheet article and computing veracity score...');

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Reddit scraping failed.');
      }

      addLog(`Primary Lead: ${data.scrapedFrom || 'r/popculturechat'}`);
      addLog(`DISPATCH FILED: "${data.article.title}" [${data.article.verification_score}]`);

      setResultArticle(data.article);
      onArticleGenerated(data.article);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape Reddit.');
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fbf9f4] border-4 border-[#2c2825] max-w-2xl w-full p-6 shadow-2xl relative font-body text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Ornate Header */}
        <div className="border-b-2 border-stone-800 pb-3 mb-4 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#8b181b] font-bold block">
              Machine Editorial Wire • Reddit Scraper & Groq AI
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-0.5">
              Live AI Newsroom & Reddit Scraper
            </h2>
            <p className="text-xs text-stone-600 font-serif italic mt-0.5">
              Extracts viral discussions from Reddit, cross-checks with trade news wires, and drafts broadsheet stories.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 font-mono text-sm px-2 py-1 border border-stone-300 hover:border-stone-800"
          >
            ✕
          </button>
        </div>

        {/* Input & Action Buttons */}
        <div className="space-y-4">
          {/* Reddit Live Scraper Button */}
          <div className="p-3 bg-orange-50 border-2 border-[#ff4500]/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#ff4500] flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Real-Time Reddit Pop Culture Scraper
              </span>
              <span className="text-[10px] font-mono text-stone-500 uppercase">
                r/popculturechat • r/movies
              </span>
            </div>
            <p className="text-xs text-stone-700 font-serif">
              Scrapes the most talked-about pop culture threads happening on Reddit right this minute and converts them into verified broadsheet news articles.
            </p>
            <button
              onClick={handleScrapeReddit}
              disabled={loading}
              className="w-full py-2 px-4 bg-[#ff4500] hover:bg-[#e03d00] disabled:opacity-50 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 shadow"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
              <span>Scrape Live Reddit Pop Culture Now</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-stone-800 mb-1.5">
              Or Enter a Custom Entertainment Story / Celebrity Topic
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Zack Snyder Indie, Cillian Murphy, Lady Gaga, Sydney Sweeney..."
                disabled={loading}
                className="flex-1 bg-white border border-stone-400 px-3 py-2 text-sm font-serif focus:outline-none focus:border-[#8b181b] placeholder:italic placeholder:text-stone-400"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="px-4 py-2 bg-[#8b181b] hover:bg-[#a3191d] disabled:opacity-50 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center gap-1.5 shadow shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Dispatch AI</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-1.5">
              Active Viral Reddit Topics:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Zack Snyder Goes Indie (r/movies)',
                'Danny Boyle Antarctica Film (r/movies)',
                'Cillian Murphy Son Premiere (r/popculturechat)',
                'Hideo Kojima Physint (r/entertainment)',
                'Tove Lo Hollywood Rumors (r/popculturechat)'
              ].map((preset, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => {
                    const clean = preset.replace(/\(r\/.*?\)/, '').trim();
                    setTopic(clean);
                    handleGenerate(clean);
                  }}
                  className="px-2.5 py-1 bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-xs font-mono border border-stone-300 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Logs Output */}
          {logs.length > 0 && (
            <div className="bg-[#1a1715] text-[#e0deda] p-3 font-mono text-xs border border-stone-800 rounded-none shadow-inner max-h-44 overflow-y-auto space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 pb-1 border-b border-stone-700 text-[10px]">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>REDDIT & TRADE TELEGRAPH TERMINAL</span>
              </div>
              {logs.map((log, idx) => (
                <div key={idx} className="leading-tight font-light">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result Card */}
          {resultArticle && (
            <div className="p-4 bg-stone-100 border-2 border-stone-800 space-y-2 font-serif animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Successfully Filed to Front Page
                </span>
                <span className="font-mono text-xs bg-[#8b181b] text-white px-2 py-0.5 font-bold">
                  {resultArticle.verification_score} VERIFIED
                </span>
              </div>
              <h4 className="font-bold text-lg leading-snug text-stone-900">
                {resultArticle.title}
              </h4>
              <p className="text-xs text-stone-700 line-clamp-2 italic font-serif">
                {resultArticle.lead_paragraph}
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <a
                  href={`/article/${resultArticle.slug}`}
                  className="px-3 py-1.5 bg-[#2c2825] hover:bg-black text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition"
                >
                  Read Full Broadsheet Story <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-stone-300 flex items-center justify-between">
          <span className="text-[10px] font-mono text-stone-500">
            Powered by Reddit RSS Stream • Groq LPU • TMDB • Appwrite
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-300 hover:bg-stone-400 text-stone-800 font-mono text-xs tracking-wider uppercase transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
