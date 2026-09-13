'use client';

import React, { useEffect, useState } from 'react';
import { BoxOfficeItem } from '@/lib/tmdb';
import { Film, TrendingUp, Sparkles } from 'lucide-react';

export default function BoxOfficeLedger() {
  const [items, setItems] = useState<BoxOfficeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/boxoffice')
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          setItems(data.results.slice(0, 6));
        }
      })
      .catch((err) => console.error('Box office load error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border-2 border-[#2c2825] bg-[#f7f4ec] p-4 font-serif">
      {/* Table Header Banner */}
      <div className="text-center border-b-2 border-stone-800 pb-2 mb-3">
        <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-stone-600 block">
          Official Industry Ledger • TMDB Radar
        </span>
        <h3 className="text-xl font-bold font-serif tracking-tight text-stone-900 uppercase">
          The Theatrical Ledger
        </h3>
        <p className="text-[11px] font-mono text-stone-600 italic">
          Domestic & Global Box Office Estimates
        </p>
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
                <th className="py-1 px-1.5 text-center w-6">No.</th>
                <th className="py-1 px-2">Production Title</th>
                <th className="py-1 px-2 text-right">Est. Gross</th>
                <th className="py-1 px-1.5 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-200/50 transition">
                  <td className="py-2 px-1.5 font-mono text-center font-bold text-stone-500 text-[11px]">
                    {item.rank}
                  </td>
                  <td className="py-2 px-2 font-bold text-stone-900 leading-snug">
                    <span className="hover:text-[#8b181b] cursor-pointer transition">
                      {item.title}
                    </span>
                    <span className="block text-[10px] font-mono font-normal text-stone-500">
                      Rel. {item.releaseDate ? item.releaseDate.slice(0, 4) : '2026'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-stone-800">
                    {item.studioEstimate}
                  </td>
                  <td className="py-2 px-1.5 text-center font-mono text-[11px] text-emerald-800 font-bold">
                    ★ {item.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ledger Footnote */}
      <div className="mt-3 pt-2 border-t border-stone-300 text-[10px] font-mono text-stone-500 flex items-center justify-between">
        <span>Source: TMDB & Studio Receipts</span>
        <span className="text-[#8b181b] font-bold">Updated Hourly</span>
      </div>
    </div>
  );
}
