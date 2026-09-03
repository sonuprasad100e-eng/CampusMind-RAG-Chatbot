import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import api from '../../services/api';
import {
  BarChart3,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [unansweredLogs, setUnansweredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [overviewRes, unansweredRes] = await Promise.all([
          api.get('/admin/analytics/overview'),
          api.get('/admin/analytics/unanswered', { params: { page, limit: 20 } }),
        ]);

        setOverview(overviewRes.data?.data || null);
        setUnansweredLogs(unansweredRes.data?.data?.logs || []);
        setTotalPages(unansweredRes.data?.data?.totalPages || 1);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [page]);

  return (
    <ProtectedRoute roleRequired="admin">
      <Head>
        <title>Analytics & Knowledge Gaps | CampusMind</title>
      </Head>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 transition-colors duration-200 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Knowledge Base Gap Analysis</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze unanswered student questions, identify missing policy documents, and inspect feedback.
          </p>
        </div>

        {isLoading && !overview ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Aggregating analytics events...</p>
          </div>
        ) : (
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm card-lift animate-slide-up delay-75">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Questions Asked
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {overview?.totalQuestions || 0}
                </h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Across all departments & categories
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm card-lift animate-slide-up delay-150">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Unanswered / Low Confidence
                </p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {overview?.unansweredQuestions || 0}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {overview?.unansweredRate || 0}% gap rate
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm card-lift animate-slide-up delay-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Positive Feedback Rate
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {overview?.feedback?.positiveRate || 100}%
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {overview?.feedback?.upCount || 0} Upvotes / {overview?.feedback?.downCount || 0} Downvotes
                </p>
              </div>
            </div>

            {/* Unanswered Questions Knowledge Gap Log */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Unanswered Student Inquiries (Knowledge Gaps)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                These questions fell below the 0.72 similarity threshold. Upload corresponding brochures or policies to resolve these gaps.
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Student Question</th>
                      <th className="px-4 py-3">Category Tag</th>
                      <th className="px-4 py-3">Top Retrieval Score</th>
                      <th className="px-4 py-3">Asked Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-950/40">
                    {unansweredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-slate-500">
                          ✨ No unanswered queries recorded! The knowledge base is answering all student questions.
                        </td>
                      </tr>
                    ) : (
                      unansweredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-md">
                            <span className="break-words font-semibold text-slate-900 dark:text-slate-100">{log.query}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-mono">
                            {(log.topScore * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Cited Documents Table */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                Document Citation Frequency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Shows which uploaded college documents are being cited the most by the RAG generation pipeline.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {overview?.topCitedDocs && overview.topCitedDocs.length > 0 ? (
                  overview.topCitedDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {doc.category}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {doc.citations} citations
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={doc.title}>
                          {doc.title}
                        </h4>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-4 col-span-3">No citation events recorded yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
