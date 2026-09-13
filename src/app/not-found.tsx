import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { ArrowLeft, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-900 flex flex-col font-body">
      <Header breakingNews={['DISPATCH NOTICE: The requested publication archive is not on file']} />

      <main className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full text-center">
        <div className="border-4 border-[#2c2825] bg-[#f7f4ec] p-8 sm:p-12 shadow-md space-y-6">
          <div className="inline-block bg-[#8b181b] text-white px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest">
            ERROR 404 • ARCHIVE DISPATCH MISSING
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-stone-900">
            The Requested Broadsheet Has Not Been Printed
          </h1>

          <div className="w-24 h-1 bg-stone-800 mx-auto"></div>

          <p className="font-serif text-base sm:text-lg italic text-stone-700 max-w-xl mx-auto leading-relaxed">
            Our autonomous telegraph bureaus in Mumbai, New Delhi, and Hollywood have no record of this dispatch in the active ledger. The story may have been re-classified or moved to the permanent archive.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-[#8b181b] transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Front Page Broadsheet</span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-800 border border-stone-400 font-mono text-xs uppercase font-bold tracking-wider hover:bg-stone-100 transition"
            >
              <span>Inspect Newsroom Operations</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-stone-300 py-6 text-center font-mono text-xs text-stone-500">
        © 2026 The SMOC Times Publishing Co. • All Rights Reserved.
      </footer>
    </div>
  );
}
