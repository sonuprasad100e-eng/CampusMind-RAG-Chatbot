import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import api from '../../services/api';
import {
  FileText,
  Layers,
  MessageSquare,
  AlertTriangle,
  UploadCloud,
  BarChart3,
  CheckCircle2,
  Loader2,
  ArrowRight,
  TrendingUp,
  ThumbsUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/analytics/overview');
        setStats(res.data?.data || null);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <ProtectedRoute roleRequired="admin">
      <Head>
        <title>Admin Dashboard | CampusMind</title>
      </Head>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors duration-200 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 min-w-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Admin Knowledge Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Overview of university knowledge base documents, vector chunks, and student query analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/documents"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Document
            </Link>
            <Link
              href="/admin/analytics"
              className="px-4 py-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Gap Analysis
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading system metrics...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm card-lift animate-slide-up delay-75">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Documents
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats?.totalDocs || 0}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {stats?.ingestionHealth?.ready || 0} Ingested & Ready
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm card-lift animate-slide-up delay-150">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Vector Chunks
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats?.totalChunks || 0}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    ~800 char semantic embeddings
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm card-lift animate-slide-up delay-200">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Questions Asked
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats?.totalQuestions || 0}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Student chat inquiries
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm card-lift animate-slide-up delay-300">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Unanswered Rate
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats?.unansweredRate || 0}%
                  </h3>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    {stats?.unansweredQuestions || 0} queries below threshold
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Middle Section: Category Breakdown & Top Cited Documents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Category Breakdown */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Knowledge Distribution by Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Breakdown of active documents and vector chunk counts
                </p>

                <div className="space-y-3">
                  {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                    stats.categoryBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono">
                          <span>{item.count} docs</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.chunks} chunks</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-4">No documents ingested yet.</p>
                  )}
                </div>
              </div>

              {/* Most Cited Documents */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Most Cited Documents</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Frequently referenced files during semantic retrieval
                    </p>
                  </div>
                  <Link
                    href="/admin/analytics"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {stats?.topCitedDocs && stats.topCitedDocs.length > 0 ? (
                    stats.topCitedDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl glass-card border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                            {doc.category}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {doc.citations} citations
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-4">No citation events recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback & Satisfaction Overview */}
            {stats?.feedback && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ThumbsUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Student Response Satisfaction</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stats.feedback.total} total ratings submitted by students
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.feedback.positiveRate}%
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Helpful</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {stats.feedback.upCount} 👍
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Upvotes</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {stats.feedback.downCount} 👎
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Downvotes</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
