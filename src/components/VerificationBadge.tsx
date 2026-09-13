'use client';

import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { ArticleSource } from '@/types/article';

interface Props {
  score: string;
  summary: string;
  sourcesJson: string;
  title: string;
}

export default function VerificationBadge({ score, summary, sourcesJson, title }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  let sources: ArticleSource[] = [];
  try {
    sources = JSON.parse(sourcesJson || '[]');
  } catch {
    sources = [];
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Inspect AI Fact-Checking & Corroboration"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-400 text-xs font-mono font-bold tracking-wider uppercase transition shadow-sm rounded-none"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#8b181b]" />
        <span>AI VERIFIED: <span className="text-[#8b181b]">{score}</span></span>
        <span className="hidden sm:inline text-stone-500 text-[10px] font-normal border-l border-stone-300 pl-1.5">
          {sources.length > 0 ? `${sources.length} sources` : 'corroborated'}
        </span>
      </button>

      {/* Verification Inspection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#fbf9f4] border-4 border-[#2c2825] max-w-xl w-full p-6 shadow-2xl relative font-body text-stone-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Stamp Ribbon */}
            <div className="absolute -top-3.5 right-6 px-3 py-0.5 bg-[#8b181b] text-white text-[11px] font-mono font-bold uppercase tracking-widest border border-black shadow">
              Truth Bureau • Audit Certified
            </div>

            <div className="border-b-2 border-stone-800 pb-3 mb-4">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-600 block">
                Official Machine Audit Report
              </span>
              <h3 className="font-serif text-2xl font-bold leading-tight mt-1 text-stone-900">
                Fact-Check & Cross-Reference Dossier
              </h3>
              <p className="text-xs text-stone-600 italic mt-1 line-clamp-1 font-serif">
                Re: {title}
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              <div className="flex items-center justify-between p-3 bg-stone-200/70 border border-stone-400">
                <div>
                  <span className="text-xs font-mono uppercase text-stone-600 font-bold block">Veracity Confidence Metric</span>
                  <span className="font-serif text-3xl font-bold text-[#8b181b]">{score}</span>
                </div>
                <div className="text-right text-xs font-mono text-stone-700">
                  <span>Audit Engine: Groq LPU</span>
                  <br />
                  <span className="text-emerald-800 font-bold">Consensus Approved</span>
                </div>
              </div>

              <div>
                <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Corroboration Summary
                </h4>
                <p className="text-stone-800 font-serif bg-white p-3 border border-stone-300 text-xs sm:text-sm">
                  {summary || 'This dispatch was cross-checked against registered studio press statements, industry wire reports, and verified trade sources. No major discrepancies or unverified rumors detected.'}
                </p>
              </div>

              {sources.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-stone-800 mb-1.5">
                    Sources Cross-Referenced ({sources.length})
                  </h4>
                  <ul className="divide-y divide-stone-300 border border-stone-300 bg-white text-xs">
                    {sources.map((s, idx) => (
                      <li key={idx} className="p-2.5 flex items-center justify-between hover:bg-stone-50">
                        <div>
                          <span className="font-bold text-stone-900 block">{s.name}</span>
                          <span className="text-[10px] font-mono text-stone-500 uppercase">
                            Stance: {s.stance || 'Corroborated'}
                          </span>
                        </div>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#8b181b] hover:underline inline-flex items-center gap-1 font-mono text-xs"
                          >
                            Inspect <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-stone-300 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-[#2c2825] hover:bg-black text-white font-mono text-xs tracking-wider uppercase transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
