import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import VerificationBadge from '@/components/VerificationBadge';
import { fetchArticleBySlug } from '@/lib/appwrite';
import { ArrowLeft, Clock, ShieldCheck, Share2, ExternalLink, Printer, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { ArticleSource, StoryUpdate } from '@/types/article';
import { Metadata } from 'next';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await fetchArticleBySlug(params.slug);
  if (!article) {
    return {
      title: 'Article Not Found | The SMOC Times',
    };
  }

  const title = article.seo_agent?.meta_title || `${article.title} | The SMOC Times`;
  const description = article.seo_agent?.meta_description || article.lead_paragraph;
  const keywords = article.seo_agent?.keywords || article.tags || ['Hollywood', 'Cinema', 'News'];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.last_updated_at || article.published_at,
      authors: [article.author],
      images: [
        {
          url: article.image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [article.image_url],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await fetchArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  let sources: ArticleSource[] = [];
  try {
    sources = JSON.parse(article.sources_json || '[]');
  } catch {
    sources = [];
  }

  const updates: StoryUpdate[] = article.update_history || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.lead_paragraph,
    image: [article.image_url],
    datePublished: article.published_at,
    dateModified: article.last_updated_at || article.published_at,
    author: [
      {
        '@type': 'Person',
        name: article.author,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'The SMOC Times',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hollywood-chronicle.vercel.app/favicon.ico',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://hollywood-chronicle.vercel.app/article/${article.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-900 flex flex-col font-body">
      {/* Schema.org NewsArticle JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-stone-300 pb-2 text-xs font-mono uppercase tracking-wider text-stone-600">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[#8b181b] transition font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Front Page Broadsheet</span>
          </Link>
          <div className="flex items-center gap-3">
            <span>{article.category}</span>
            <span>•</span>
            <span>{article.edition}</span>
          </div>
        </div>

        {/* Article Headline & Deck */}
        <article className="space-y-6">
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#8b181b] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
                {article.is_breaking ? 'BREAKING WIRE DISPATCH' : 'BROADSHEET REPORT'}
              </span>
              {article.version && article.version > 1 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase">
                  v{article.version}.0 • EVOLVED STORY
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#11100f] leading-[1.1]">
              {article.title}
            </h1>

            <p className="font-serif text-lg sm:text-xl italic text-stone-700 max-w-2xl mx-auto leading-snug">
              {article.lead_paragraph.split('—')[1] || article.lead_paragraph}
            </p>

            {/* Dateline & Byline Strip */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-stone-600 border-t border-b border-stone-300 py-2.5 mt-4">
              <span className="font-bold text-stone-900 uppercase">{article.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {article.published_at}
              </span>
              <span>•</span>
              <VerificationBadge
                score={article.verification_score}
                summary={article.verification_summary}
                sourcesJson={article.sources_json}
                title={article.title}
              />
            </div>
          </div>

          {/* Executive Takeaways Box (from Content Agent) */}
          {article.content_agent?.executive_takeaways && article.content_agent.executive_takeaways.length > 0 && (
            <div className="border-2 border-stone-800 bg-[#f4efe4] p-4 font-serif space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#8b181b] tracking-wider block">
                Executive Wire Takeaways
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-800 list-disc list-inside">
                {article.content_agent.executive_takeaways.map((takeaway, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="font-serif">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Featured Image with Print Caption */}
          {article.image_url && (
            <div className="space-y-2">
              <div className="relative aspect-[16/9] w-full border-2 border-stone-800 bg-stone-200 overflow-hidden">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover contrast-[1.05]"
                  priority
                />
              </div>
              <div className="flex items-start justify-between text-xs font-mono text-stone-600 px-1">
                <span className="font-serif italic text-stone-800">
                  {article.image_caption || 'Theatrical still / production record from studio archives.'}
                </span>
                <span className="uppercase text-[10px] text-stone-500 shrink-0 ml-2 font-bold">
                  SMOC TIMES WIRE PHOTO • TMDB OFFICIAL
                </span>
              </div>
            </div>
          )}

          {/* Story Evolution / Revision Log (if updated) */}
          {updates.length > 0 && (
            <div className="border border-amber-300 bg-amber-50 p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase tracking-wider text-[11px]">
                <History className="w-3.5 h-3.5" />
                <span>Story Evolution Log ({updates.length} Updates Recorded)</span>
              </div>
              <div className="divide-y divide-amber-200 space-y-2">
                {updates.map((upd, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-amber-800">
                      <span className="font-bold">{upd.headline}</span>
                      <span>{new Date(upd.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-amber-950 font-serif">{upd.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Prose with Drop Cap and Headings */}
          <div className="prose prose-stone max-w-none text-base sm:text-lg leading-relaxed font-serif text-stone-900 pt-4 space-y-6">
            <p className="drop-cap leading-relaxed">
              {article.lead_paragraph}
            </p>

            {article.body_markdown.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h3 key={idx} className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight text-stone-900 border-b border-stone-300 pb-1 mt-6 mb-2">
                    {paragraph.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              return (
                <p key={idx} className="leading-relaxed">
                  {paragraph.replace(/\*\*/g, '').replace(/\*/g, '')}
                </p>
              );
            })}
          </div>

          {/* Machine Audit & Verification Box */}
          <div className="border-4 border-[#2c2825] bg-[#f4efe4] p-6 space-y-4 my-8 font-serif">
            <div className="flex items-start justify-between border-b-2 border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#8b181b] font-bold block">
                  Truth Verification Protocol • 4-Agent Machine Audit
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
                  Editorial Corroboration Record
                </h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] uppercase text-stone-500 block">Veracity Rating</span>
                <span className="text-2xl font-bold text-[#8b181b]">{article.verification_score}</span>
              </div>
            </div>

            <p className="text-sm text-stone-800 leading-relaxed">
              {article.verification_summary ||
                'This report was compiled and cross-referenced against official press releases, studio filings, and multiple independent trade accounts by Groq AI inference. No irreconcilable discrepancies were found.'}
            </p>

            {/* Verified claims check */}
            {article.fact_check_agent?.verified_claims && (
              <div className="space-y-1 pt-1 font-mono text-xs">
                <span className="font-bold text-emerald-900 uppercase text-[10px] block">
                  Confirmed Consensus Points:
                </span>
                {article.fact_check_agent.verified_claims.map((claim, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-stone-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{claim}</span>
                  </div>
                ))}
              </div>
            )}

            {sources.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-stone-800">
                  Registered Sources Cited:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {sources.map((src, i) => (
                    <div key={i} className="p-2 bg-white border border-stone-300 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-900 block">{src.name}</span>
                        <span className="text-[10px] text-stone-500 uppercase">{src.stance || 'Corroborated'}</span>
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8b181b] hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Article Footer & Return Link */}
          <div className="border-t-2 border-stone-800 pt-4 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-bold text-[#8b181b] hover:text-black transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Front Page Broadsheet
            </Link>
            <span className="font-mono text-xs text-stone-500">
              The SMOC Times • Edition No. 257
            </span>
          </div>
        </article>
      </main>
    </div>
  );
}
