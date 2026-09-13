'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Printer, Sparkles, Radio, CloudSun, Calendar, Activity } from 'lucide-react';
import IngestModal from './IngestModal';
import { Article } from '@/types/article';

interface Props {
  onNewArticle?: (article: Article) => void;
  breakingNews?: string[];
}

export default function Header({ onNewArticle, breakingNews = [] }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('Sunday, September 13, 2026');

  useEffect(() => {
    const now = new Date();
    setCurrentDateStr(now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, []);

  const defaultBreaking = [
    'INDIAN CINEMA: Shah Rukh Khan & Suhana Khan "King" Action Thriller Locks ₹200 Cr European Production',
    'TOLLYWOOD: SS Rajamouli & Mahesh Babu "SSMB29" Commences Kenya Jungle Recce in IMAX Native',
    'BOLLYBLINDS: Studios Institute Strict Profit-Equity Pay Models Following OTT Ceiling Readjustments',
    'BOX OFFICE: "Pushpa 2: The Rule" Shatters North American Advance Booking Milestones',
    'HOLLYWOOD: Zack Snyder Turns Indie, Ditches Green Screens for Raw Handheld Celluloid'
  ];

  const tickers = breakingNews.length > 0 ? breakingNews : defaultBreaking;

  return (
    <header className="border-b-4 border-[#2c2825] bg-[#fbf9f4] text-stone-900 select-none">
      {/* Top Dateline / Weather / Volume Bar */}
      <div className="border-b border-stone-300 py-1 px-4 text-[11px] font-mono tracking-wider uppercase text-stone-600 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="font-bold text-stone-900">VOL. CXXIV • NO. 257</span>
          <span className="hidden sm:inline text-stone-400">|</span>
          <span className="hidden sm:inline font-bold text-stone-800">MUMBAI • NEW DELHI • HOLLYWOOD</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-stone-500" />
            <span>{currentDateStr}</span>
          </div>
          <span className="hidden md:inline text-stone-400">|</span>
          <div className="hidden md:flex items-center gap-1">
            <CloudSun className="w-3.5 h-3.5 text-amber-600" />
            <span>84°F • Arabian Sea Breeze, Mumbai</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-800 font-bold">DAILY BROADHEET</span>
          <span className="text-stone-400">•</span>
          <span className="text-[#8b181b] font-bold">PRICE: COMPLIMENTARY</span>
        </div>
      </div>

      {/* Main Ornate Masthead */}
      <div className="py-6 px-4 text-center max-w-7xl mx-auto">
        <div className="border-t-2 border-b-2 border-stone-900 py-3.5 relative">
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-stone-600 font-bold mb-1">
            The Daily Global &amp; Indian Pop Culture Broadsheet • Bollywood, Tollywood &amp; World Motion Pictures
          </div>
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-[#11100f] uppercase leading-none font-headline group-hover:text-[#8b181b] transition">
              THE SMOC TIMES
            </h1>
          </Link>
          <div className="flex items-center justify-center gap-4 text-xs font-serif italic text-stone-700 mt-2">
            <span className="hidden md:inline border-t border-stone-400 w-16"></span>
            <span>&ldquo;All The Cinema, Culture &amp; Wire Gossip That&rsquo;s Fit To Print — Certified by Autonomous AI&rdquo;</span>
            <span className="hidden md:inline border-t border-stone-400 w-16"></span>
          </div>
        </div>
      </div>

      {/* Section Subnav Bar */}
      <div className="border-t border-b border-stone-800 bg-[#f4efe4] py-1.5 px-4 font-mono text-xs uppercase tracking-widest font-bold">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-1">
            <Link href="/" className="text-stone-900 hover:text-[#8b181b] transition border-b-2 border-transparent hover:border-[#8b181b]">
              Front Page
            </Link>
            <Link href="/?cat=Indian+Cinema" className="text-stone-700 hover:text-[#8b181b] transition">
              Indian Cinema
            </Link>
            <Link href="/?cat=Gaming+%26+Esports" className="text-stone-700 hover:text-[#8b181b] transition">
              Gaming &amp; Esports
            </Link>
            <Link href="/?cat=Business+%26+D-Street" className="text-stone-700 hover:text-[#8b181b] transition">
              Business &amp; D-Street
            </Link>
            <Link href="/?cat=BollyBlinds+Gossip" className="text-stone-700 hover:text-[#8b181b] transition">
              r/BollyBlinds
            </Link>
            <Link href="/?cat=Indian+Pop+Culture" className="text-stone-700 hover:text-[#8b181b] transition">
              Pop Culture &amp; Cricket
            </Link>
            <Link href="/?cat=Box+Office" className="text-stone-700 hover:text-[#8b181b] transition">
              Box Office (₹ / $)
            </Link>
            <Link href="/?cat=Streaming+%26+OTT" className="text-stone-700 hover:text-[#8b181b] transition">
              OTT Wire
            </Link>
            <Link href="/admin" className="text-[#8b181b] hover:text-black transition flex items-center gap-1 font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>Newsroom Ops</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="no-print hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-400 text-stone-800 text-[11px] font-mono transition"
              title="Format for physical print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Broadsheet</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="no-print inline-flex items-center gap-1.5 px-3 py-1 bg-[#8b181b] hover:bg-[#a3191d] text-white text-[11px] font-mono font-bold tracking-wider transition shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dispatch Generator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker Tape */}
      <div className="border-b border-stone-300 bg-[#ede7d8] py-1 px-2 flex items-center text-xs font-mono overflow-hidden">
        <div className="flex items-center gap-1.5 px-2 bg-[#8b181b] text-white font-bold tracking-wider text-[10px] shrink-0 uppercase py-0.5">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>SMOC WIRE TICKER</span>
        </div>
        <div className="overflow-hidden flex-1 relative ml-3">
          <div className="animate-marquee whitespace-nowrap space-x-8">
            {tickers.map((t, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 text-stone-800">
                <span className="text-[#8b181b] font-bold">★</span>
                <span>{t}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Ingest Modal */}
      <IngestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onArticleGenerated={(art) => {
          if (onNewArticle) onNewArticle(art);
        }}
      />
    </header>
  );
}
