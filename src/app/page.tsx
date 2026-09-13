'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import VerificationBadge from '@/components/VerificationBadge';
import BoxOfficeLedger from '@/components/BoxOfficeLedger';
import { Article } from '@/types/article';
import { FALLBACK_ARTICLES } from '@/lib/appwrite';
import { ArrowRight, Clock, BookOpen, AlertCircle, Quote, Search, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

function HomePageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('cat') || 'All';

  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);

  const fetchLatestArticles = () => {
    fetch('/api/articles?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
        }
      })
      .catch((err) => console.error('Failed to load articles:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLatestArticles();
    // 24/7 background polling: automatically refresh the newspaper every 45 seconds
    const interval = setInterval(fetchLatestArticles, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleNewArticle = (newArt: Article) => {
    setArticles((prev) => [newArt, ...prev]);
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        art.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.lead_paragraph.toLowerCase().includes(q) ||
        art.body_markdown.toLowerCase().includes(q) ||
        (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const leadArticle = filteredArticles[0] || articles[0] || FALLBACK_ARTICLES[0];
  const secondaryLead = filteredArticles[1] || articles[1] || FALLBACK_ARTICLES[1];
  const sideArticles = filteredArticles.slice(2, 6);
  const bottomArticles = filteredArticles.slice(6);

  const tickerHeadlines = articles.map((a) => `${a.category.toUpperCase()}: ${a.title}`);

  const categories = ['All', 'Cinema', 'Television', 'Box Office', 'Industry', 'Pop Culture'];

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-900 flex flex-col font-body">
      {/* Schema.org NewsMediaOrganization Rich JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsMediaOrganization',
            name: 'The SMOC Times',
            url: 'https://hollywood-chronicle.vercel.app',
            logo: 'https://hollywood-chronicle.vercel.app/favicon.ico',
            sameAs: ['https://twitter.com', 'https://reddit.com'],
            description: 'The authoritative daily dispatch on Indian pop culture, cinema, streaming, and global entertainment. Verified by autonomous AI machine wire.'
          })
        }}
      />

      <Header onNewArticle={handleNewArticle} breakingNews={tickerHeadlines} />

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Newspaper Issue Subhead Strip & Live Filter */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-stone-800 pb-3 mb-6 gap-3 text-xs font-mono uppercase tracking-wider text-stone-700">
          <div className="flex items-center gap-2">
            <span className="bg-[#8b181b] text-white px-2 py-0.5 font-bold text-[10px]">
              FINAL DISPATCH
            </span>
            <span>Hollywood Bureau • Wire Services &amp; Studio Correspondents</span>
          </div>

          {/* Category Tabs & Quick Search */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 text-[11px] font-mono transition border ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-stone-900 text-white border-stone-900 font-bold'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wire..."
                className="pl-7 pr-2.5 py-1 text-xs font-mono bg-white border border-stone-400 focus:outline-none focus:border-stone-900 w-32 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* 3-Column Broadsheet Front Page Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: The Morning Wire / Fast Briefs (Left, 3 cols) */}
          <aside className="lg:col-span-3 order-2 lg:order-1 space-y-6 lg:border-r border-stone-300 lg:pr-6">
            <div className="border-b-2 border-stone-900 pb-1">
              <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#8b181b] block">
                Telegraph Desk
              </span>
              <h3 className="font-serif text-xl font-bold tracking-tight uppercase text-stone-900">
                The Morning Wire
              </h3>
            </div>

            <div className="divide-y divide-stone-300 space-y-4">
              {sideArticles.map((art, idx) => (
                <article key={art.$id || idx} className="pt-4 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 uppercase">
                    <span className="font-bold text-[#8b181b]">{art.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {art.published_at}
                    </span>
                  </div>

                  <Link href={`/article/${art.slug}`} className="group block">
                    <h4 className="font-serif font-bold text-base leading-snug text-stone-900 group-hover:text-[#8b181b] transition">
                      {art.title}
                    </h4>
                  </Link>

                  {art.image_url && (
                    <Link href={`/article/${art.slug}`} className="block relative aspect-[16/9] w-full border border-stone-400 bg-stone-200 overflow-hidden my-2 group shadow-sm">
                      <Image
                        src={art.image_url}
                        alt={art.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </Link>
                  )}

                  {art.version && art.version > 1 && (
                    <div className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-mono font-bold px-1 py-0.2 uppercase">
                      v{art.version}.0 • Evolved Bulletin
                    </div>
                  )}

                  <p className="text-xs text-stone-700 line-clamp-3 leading-relaxed font-serif">
                    {art.lead_paragraph}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <VerificationBadge
                      score={art.verification_score}
                      summary={art.verification_summary}
                      sourcesJson={art.sources_json}
                      title={art.title}
                    />
                    <Link
                      href={`/article/${art.slug}`}
                      className="font-mono text-[10px] text-stone-600 hover:text-black font-bold uppercase"
                    >
                      Read Wire →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Vintage Classified Ad */}
            <div className="border-2 border-dashed border-stone-400 bg-stone-100 p-3.5 text-center space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-stone-500 block">
                Trade Classified Notice
              </span>
              <h5 className="font-serif font-bold text-sm text-stone-900 uppercase">
                70mm Film Projectors Needed
              </h5>
              <p className="text-[11px] font-serif italic text-stone-700 leading-tight">
                Exhibitors with certified 15-perf 70mm installations in North America &amp; Western Europe invited for 2026 studio allocation.
              </p>
              <span className="text-[9px] font-mono block text-stone-500">
                Inquire via Universal Theatrical Desk
              </span>
            </div>
          </aside>

          {/* Column 2: Center Fold / Lead Story (Center, 6 cols) */}
          <section className="lg:col-span-6 order-1 lg:order-2 space-y-6 lg:border-r border-stone-300 lg:pr-6">
            {leadArticle && (
              <article className="space-y-4">
                <div className="space-y-1.5 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <span className="px-2 py-0.5 bg-[#8b181b] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
                      FRONT PAGE WIRE
                    </span>
                    <span className="text-[11px] font-mono text-stone-600 uppercase font-bold tracking-wider">
                      {leadArticle.category} • {leadArticle.edition || 'Trade Wire Dispatch'}
                    </span>
                    {leadArticle.version && leadArticle.version > 1 && (
                      <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 border border-amber-400 text-[10px] font-mono font-bold">
                        v{leadArticle.version}.0 EVOLVED
                      </span>
                    )}
                  </div>

                  <Link href={`/article/${leadArticle.slug}`} className="group block">
                    <h2 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#11100f] group-hover:text-[#8b181b] transition">
                      {leadArticle.title}
                    </h2>
                  </Link>

                  <p className="font-serif text-sm sm:text-base italic text-stone-700 leading-snug border-b border-stone-300 pb-3">
                    {leadArticle.lead_paragraph}
                  </p>
                </div>

                {/* Hero Lead Image */}
                <div className="space-y-1.5">
                  <div className="relative aspect-[16/9] w-full border border-stone-800 bg-stone-200 overflow-hidden shadow-sm">
                    <Image
                      src={leadArticle.image_url || 'https://image.tmdb.org/t/p/original/5LtSjMNw6j3LkG29Oa4O0iY5U8.jpg'}
                      alt={leadArticle.title}
                      fill
                      priority
                      className="object-cover contrast-[1.02] hover:scale-[1.01] transition duration-500"
                    />
                  </div>
                  <div className="flex items-start justify-between text-[11px] font-mono text-stone-600 leading-tight">
                    <span className="italic font-serif text-stone-800">
                      {leadArticle.image_caption || 'Archival production photography • SMOC Times Trade Bureau.'}
                    </span>
                    <span className="uppercase text-[9px] text-stone-500 shrink-0 ml-2 font-bold tracking-wider">
                      SMOC TIMES WIRE PHOTO • TMDB OFFICIAL
                    </span>
                  </div>
                </div>

                {/* Byline and Fact Check Badge Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-b border-stone-300 py-2 text-xs font-mono">
                  <div className="text-stone-800">
                    <span className="font-bold uppercase tracking-wider">
                      {leadArticle.author || 'Eleanor Vance, Senior Trade Editor'}
                    </span>
                    <span className="text-stone-500 block text-[10px]">
                      Filed on {leadArticle.published_at} • Hollywood Bureau
                    </span>
                  </div>
                  <VerificationBadge
                    score={leadArticle.verification_score}
                    summary={leadArticle.verification_summary}
                    sourcesJson={leadArticle.sources_json}
                    title={leadArticle.title}
                  />
                </div>

                {/* Lead Article Body snippet in 2 Print Columns */}
                <div className="sm:columns-2 gap-6 text-xs sm:text-sm text-stone-900 leading-relaxed font-serif text-justify space-y-3">
                  <p className="drop-cap">
                    {leadArticle.lead_paragraph}
                  </p>
                  {leadArticle.body_markdown
                    .split('\n\n')
                    .slice(0, 3)
                    .map((para, i) => (
                      <p key={i} className="indent-4">
                        {para.replace(/^##\s+/, '')}
                      </p>
                    ))}
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-end">
                  <Link
                    href={`/article/${leadArticle.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#8b181b] hover:text-black transition"
                  >
                    <span>Continue Reading Full Broadsheet Text</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            )}

            {/* Ornamental Divider */}
            <div className="newspaper-divider-thick my-6"></div>

            {/* Secondary Lead Story */}
            {secondaryLead && (
              <article className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b181b] uppercase font-bold">
                  <span>SECOND EDITION REPORT</span>
                  <span>•</span>
                  <span>{secondaryLead.category}</span>
                </div>

                <Link href={`/article/${secondaryLead.slug}`} className="group block">
                  <h3 className="font-serif text-2xl font-bold leading-snug text-stone-900 group-hover:text-[#8b181b] transition">
                    {secondaryLead.title}
                  </h3>
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div className="relative aspect-[4/3] w-full border border-stone-800 bg-stone-200 overflow-hidden shadow-sm">
                    <Image
                      src={secondaryLead.image_url || 'https://image.tmdb.org/t/p/original/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg'}
                      alt={secondaryLead.title}
                      fill
                      className="object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <p className="text-xs text-stone-800 leading-relaxed font-serif">
                      {secondaryLead.lead_paragraph}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 font-mono">
                      <VerificationBadge
                        score={secondaryLead.verification_score}
                        summary={secondaryLead.verification_summary}
                        sourcesJson={secondaryLead.sources_json}
                        title={secondaryLead.title}
                      />
                      <Link
                        href={`/article/${secondaryLead.slug}`}
                        className="text-[#8b181b] font-bold uppercase text-[10px]"
                      >
                        Read Article →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </section>

          {/* Column 3: Theatrical Ledger & Verified Facts (Right, 3 cols) */}
          <aside className="lg:col-span-3 order-3 space-y-6">
            {/* Box Office Ledger Table */}
            <BoxOfficeLedger />

            {/* Truth Meter / Rumor vs Confirmed Fact Check Panel */}
            <div className="border-2 border-stone-800 bg-[#f4efe4] p-4 space-y-3 font-serif">
              <div className="border-b border-stone-400 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#8b181b] block">
                  Truth Verification Protocol
                </span>
                <h4 className="font-bold text-base text-stone-900 uppercase">
                  Rumor vs. Confirmed Wire
                </h4>
              </div>

              <ul className="text-xs divide-y divide-stone-300 space-y-2">
                <li className="pt-2 first:pt-0 space-y-1">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-emerald-800 text-white font-bold uppercase">
                    CONFIRMED (9.9)
                  </span>
                  <p className="font-bold text-stone-900 leading-tight">
                    Nolan Mid-Summer 2026 IMAX Theatrical Window
                  </p>
                  <span className="text-[10px] font-mono text-stone-600 block">
                    Corroborated: Universal &amp; IMAX filings.
                  </span>
                </li>
                <li className="pt-2 space-y-1">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-amber-800 text-white font-bold uppercase">
                    DEVELOPING (7.8)
                  </span>
                  <p className="font-bold text-stone-900 leading-tight">
                    Prestige Streaming Budgets Capped at $12M/Ep
                  </p>
                  <span className="text-[10px] font-mono text-stone-600 block">
                    Source: Agency packagers on background.
                  </span>
                </li>
                <li className="pt-2 space-y-1">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-red-800 text-white font-bold uppercase">
                    UNSUBSTANTIATED (3.2)
                  </span>
                  <p className="font-bold text-stone-900 leading-tight line-through text-stone-500">
                    Secret Superhero Cameo in Dune 3
                  </p>
                  <span className="text-[10px] font-mono text-stone-600 block">
                    Refuted by studio and filmmaker reps.
                  </span>
                </li>
              </ul>
            </div>

            {/* Editorial Quote of the Edition */}
            <div className="border-l-4 border-[#8b181b] pl-3 py-1 space-y-1 bg-stone-100/70 p-3">
              <Quote className="w-4 h-4 text-[#8b181b]" />
              <p className="font-serif italic text-xs text-stone-800 leading-snug">
                &ldquo;Cinema is not merely commerce; it is an enduring covenant between the projected light and the collective audience in the dark.&rdquo;
              </p>
              <span className="font-mono text-[10px] text-stone-500 uppercase block">
                — Eleanor Vance, Senior Editor
              </span>
            </div>
          </aside>
        </div>

        {/* Lower Fold: Additional Broadsheet Columns */}
        {bottomArticles.length > 0 && (
          <section className="mt-12 pt-6 border-t-4 border-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-400 pb-2">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-tight text-stone-900">
                Departmental Dispatches &amp; Industry Records ({bottomArticles.length})
              </h3>
              <span className="font-mono text-xs text-stone-500 uppercase">
                Section B • Broadsheet Archives
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bottomArticles.map((art, idx) => (
                <article key={art.$id || idx} className="space-y-2 border-b md:border-b-0 md:border-r border-stone-300 md:pr-4 last:border-r-0 pb-4 md:pb-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 uppercase">
                    <span className="font-bold text-[#8b181b]">{art.category}</span>
                    <span>{art.published_at}</span>
                  </div>
                  <Link href={`/article/${art.slug}`} className="group block">
                    <h4 className="font-serif font-bold text-base leading-snug text-stone-900 group-hover:text-[#8b181b] transition">
                      {art.title}
                    </h4>
                  </Link>

                  {art.image_url && (
                    <Link href={`/article/${art.slug}`} className="block relative aspect-[16/9] w-full border border-stone-400 bg-stone-200 overflow-hidden my-2 group shadow-sm">
                      <Image
                        src={art.image_url}
                        alt={art.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                        sizes="(max-width: 768px) 100vw, 280px"
                      />
                    </Link>
                  )}

                  {art.version && art.version > 1 && (
                    <span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-mono px-1 py-0.2 border border-amber-300 font-bold">
                      v{art.version}.0 EVOLVED
                    </span>
                  )}

                  <p className="text-xs text-stone-700 line-clamp-3 font-serif leading-relaxed">
                    {art.lead_paragraph}
                  </p>
                  <div className="pt-2">
                    <VerificationBadge
                      score={art.verification_score}
                      summary={art.verification_summary}
                      sourcesJson={art.sources_json}
                      title={art.title}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Broadsheet Colophon & Footer */}
      <footer className="border-t-4 border-[#2c2825] bg-[#f4efe4] py-8 mt-12 text-stone-700 text-xs font-serif">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-stone-400 pb-6">
            <div>
              <h5 className="font-serif font-bold text-stone-900 uppercase text-sm mb-2">
                The SMOC Times
              </h5>
              <p className="text-[11px] leading-relaxed text-stone-600">
                The premier broadsheet recording Indian pop culture, Bollywood, Tollywood, regional cinema, and global entertainment with uncompromising verification and trade reporting.
              </p>
            </div>
            <div>
              <h5 className="font-mono font-bold text-stone-900 uppercase text-xs mb-2">
                Autonomous AI Core
              </h5>
              <p className="text-[11px] leading-relaxed text-stone-600 font-mono">
                4-Agent editorial matrix: Content, Fact-Check, SEO, and Quality agents operating 24/7 on Groq LPU inference.
              </p>
            </div>
            <div>
              <h5 className="font-mono font-bold text-stone-900 uppercase text-xs mb-2">
                Cloud Archive
              </h5>
              <p className="text-[11px] leading-relaxed text-stone-600 font-mono">
                Dual-layer persistence on Appwrite Cloud Database with transactional failover engine.
              </p>
            </div>
            <div>
              <h5 className="font-mono font-bold text-stone-900 uppercase text-xs mb-2">
                Operations &amp; Wire
              </h5>
              <p className="text-[11px] leading-relaxed text-stone-600 font-mono">
                Real-time crawling across Reddit (BollyBlinds, Bollywood, Tollywood), Pinkvilla, Variety, and RSS. <Link href="/admin" className="underline font-bold text-[#8b181b]">View Operations</Link>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-stone-500 uppercase">
            <span>© 2026 The SMOC Times Publishing Co. All Rights Reserved.</span>
            <span>Printed at Mumbai, New Delhi &amp; Hollywood • Autonomous Edition 2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center font-mono text-xs text-stone-600">
          Printing Daily Broadsheet Edition...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

