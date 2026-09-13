'use client';

import React, { useEffect, useState } from 'react';
import { BoxOfficeItem } from '@/lib/tmdb';
import { Film, TrendingUp, Sparkles } from 'lucide-react';

import Image from 'next/image';

export default function BoxOfficeLedger() {
  const [items, setItems] = useState<BoxOfficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMetric, setViewMetric] = useState<'weekly' | 'daily' | 'worldwide'>('weekly');

  useEffect(() => {
    const loadBoxOffice = () => {
      fetch('/api/boxoffice', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            setItems(data.results.slice(0, 6));
          }
        })
        .catch((err) => console.error('Box office load error:', err))
        .finally(() => setLoading(false));
    };

    loadBoxOffice();
    const interval = setInterval(loadBoxOffice, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-2 border-[#2c2825] bg-[#f7f4ec] p-4 font-serif shadow-sm">
      {/* Table Header Banner */}
      <div className="text-center border-b-2 border-stone-800 pb-2 mb-2">
        <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-widest uppercase font-bold text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>LIVE THEATRICAL WIRE • CURRENT IN THEATERS</span>
        </div>
        <h3 className="text-xl font-bold font-serif tracking-tight text-stone-900 uppercase mt-0.5">
          The Theatrical Ledger
        </h3>
        <p className="text-[10px] font-mono text-stone-600 italic">
          Audited Receipts Across India (₹) &amp; Global ($)
        </p>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center justify-center gap-1 mt-2 font-mono text-[10px] uppercase">
          <button
            onClick={() => setViewMetric('weekly')}
            className={`px-2 py-0.5 border ${
              viewMetric === 'weekly'
                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMetric('daily')}
            className={`px-2 py-0.5 border ${
              viewMetric === 'daily'
                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMetric('worldwide')}
            className={`px-2 py-0.5 border ${
              viewMetric === 'worldwide'
                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            Worldwide
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center font-mono text-xs text-stone-500 animate-pulse">
          Tabulating box office receipts from telegraph wire...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-400 font-mono text-[10px] uppercase tracking-wider text-stone-700 bg-stone-200/60">
                <th className="py-1 px-1 text-center w-6">Rank</th>
                <th className="py-1 px-2">Production Title</th>
                <th className="py-1 px-2 text-right">
                  {viewMetric === 'daily' ? 'Daily' : viewMetric === 'worldwide' ? 'Global Gross' : 'Weekly'}
                </th>
                <th className="py-1 px-1 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {items.map((item) => {
                const displayAmount =
                  viewMetric === 'daily'
                    ? item.dailyEarnings || item.studioEstimate
                    : viewMetric === 'worldwide'
                    ? item.worldwideGross || item.studioEstimate
                    : item.weeklyEarnings || item.studioEstimate;

                return (
                  <tr key={item.id} className="hover:bg-stone-200/50 transition">
                    <td className="py-2 px-1 font-mono text-center font-bold text-stone-500 text-[11px]">
                      #{item.rank}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {item.poster ? (
                          <div className="relative w-8 h-11 shrink-0 border border-stone-400 bg-stone-300 overflow-hidden shadow-sm">
                            <Image
                              src={item.poster}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-11 shrink-0 border border-dashed border-stone-400 bg-stone-200 flex items-center justify-center text-stone-400">
                            <Film className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-serif font-bold text-stone-900 hover:text-[#8b181b] cursor-pointer transition block text-[11px] leading-tight line-clamp-1">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[8px] font-mono px-1 py-0.2 bg-stone-200 text-stone-700 font-bold uppercase">
                              {item.theaterStatus || 'In Theaters'}
                            </span>
                            <span className="text-[9px] font-mono text-stone-500">
                              ★ {item.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-stone-900 text-[11px] whitespace-nowrap">
                      {displayAmount}
                    </td>
                    <td className="py-2 px-1 text-center font-mono text-[9px] font-bold whitespace-nowrap">
                      <span className={`px-1 py-0.5 rounded-none ${
                        item.trendBadge?.includes('▲') || item.trendBadge?.includes('RECORD')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.trendBadge?.includes('★')
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-600 border border-stone-300'
                      }`}>
                        {item.trendBadge || 'HOLD'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ledger Footnote */}
      <div className="mt-2.5 pt-2 border-t border-stone-300 text-[9px] font-mono text-stone-500 flex items-center justify-between">
        <span>Active Theater Audits • Real-Time</span>
        <span className="text-[#8b181b] font-bold">Auto-Synced</span>
      </div>

      {/* Ledger Footnote */}
      <div className="mt-3 pt-2 border-t border-stone-300 text-[10px] font-mono text-stone-500 flex items-center justify-between">
        <span>Source: TMDB & Studio Receipts</span>
        <span className="text-[#8b181b] font-bold">Updated Hourly</span>
      </div>
    </div>
  );
}
