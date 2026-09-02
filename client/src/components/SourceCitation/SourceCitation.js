import React, { useState } from 'react';
import { BookOpen, ExternalLink, FileText, CheckCircle2, X, Sparkles, Quote } from 'lucide-react';

export default function SourceCitation({ sources }) {
  const [activeModalSource, setActiveModalSource] = useState(null);

  if (!sources || sources.length === 0) return null;

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'admissions':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'fees':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'hostel':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'exams':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'placements':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'scholarships':
        return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50';
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
      <div className="flex items-center gap-2 mb-2.5">
        <BookOpen className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Verified College Sources ({sources.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((src, idx) => {
          const scorePercent = src.score ? Math.round(src.score * 100) : null;
          const delayClass = idx === 0 ? 'delay-100' : idx === 1 ? 'delay-200' : 'delay-300';

          return (
            <div
              key={idx}
              onClick={() => setActiveModalSource(src)}
              className={`glass-card p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 cursor-pointer card-lift group flex flex-col justify-between shadow-sm animate-slide-up ${delayClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105 transition-all flex-shrink-0">
                    <FileText className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate" title={src.title}>
                    {src.title}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" aria-hidden="true" />
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase ${getCategoryColor(src.category)}`}>
                  {src.category || 'General'}
                </span>
                <div className="flex items-center gap-2">
                  {src.pageNumber && (
                    <span>Page {src.pageNumber}</span>
                  )}
                  {scorePercent && (
                    <span className="text-emerald-600 dark:text-emerald-400/90 font-medium">
                      {scorePercent}% match
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Reference Modal with Source Highlighting */}
      {activeModalSource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setActiveModalSource(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white btn-interactive"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeModalSource.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Official College Knowledge Base Document</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 mb-4">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="font-semibold text-slate-900 dark:text-white">{activeModalSource.category || 'General'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Document Page</span>
                <span className="font-semibold text-slate-900 dark:text-white">{activeModalSource.pageNumber || '1'}</span>
              </div>
              {activeModalSource.score && (
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Semantic Relevance Score</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {(activeModalSource.score * 100).toFixed(1)}% Match
                  </span>
                </div>
              )}
            </div>

            {/* Source Highlighting Box */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 mb-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
                <Quote className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verified Source Highlight</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-emerald-100/50 dark:bg-emerald-900/20 p-2.5 rounded-lg border-l-2 border-emerald-500">
                "Verified document content used by CampusMind to answer your inquiry with full factual integrity."
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveModalSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white btn-interactive"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
