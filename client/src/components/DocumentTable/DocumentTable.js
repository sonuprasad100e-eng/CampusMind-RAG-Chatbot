import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  FileText,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Layers,
  Calendar,
  Sparkles,
  HelpCircle,
  X,
  Building,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'General',
];

const STATUSES = ['All', 'READY', 'PROCESSING', 'FAILED', 'UPLOADED'];

export default function DocumentTable({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [summaryModalDoc, setSummaryModalDoc] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/documents', {
        params: {
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          status: status !== 'All' ? status : undefined,
        },
      });
      setDocuments(res.data?.data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  // Live Socket.IO Listeners for Ingestion Progress
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDocEvent = () => {
      fetchDocuments();
    };

    socket.on('document:processing', handleDocEvent);
    socket.on('document:ready', handleDocEvent);
    socket.on('document:failed', handleDocEvent);

    return () => {
      socket.off('document:processing', handleDocEvent);
      socket.off('document:ready', handleDocEvent);
      socket.off('document:failed', handleDocEvent);
    };
  }, [fetchDocuments]);

  const handleReprocess = async (docId) => {
    setActionLoadingId(docId);
    try {
      await api.post(`/admin/documents/${docId}/reprocess`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reprocess document.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its vector chunks?`)) {
      return;
    }
    setActionLoadingId(docId);
    try {
      await api.delete(`/admin/documents/${docId}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSummarize = async (doc) => {
    setSummaryModalDoc({ ...doc, summary: doc.summary || null });
    if (!doc.summary) {
      setModalLoading(true);
      try {
        const res = await api.post(`/admin/documents/${doc._id}/summarize`);
        setSummaryModalDoc((prev) => ({ ...prev, summary: res.data?.data?.summary }));
        fetchDocuments();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to generate AI summary.');
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleGenerateFAQs = async (doc) => {
    setSummaryModalDoc({ ...doc, faqs: doc.faqs || null, mode: 'faqs' });
    if (!doc.faqs || doc.faqs.length === 0) {
      setModalLoading(true);
      try {
        const res = await api.post(`/admin/documents/${doc._id}/faqs`);
        setSummaryModalDoc((prev) => ({ ...prev, faqs: res.data?.data?.faqs, mode: 'faqs' }));
        fetchDocuments();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to generate FAQs.');
      } finally {
        setModalLoading(false);
      }
    }
  };

  const getStatusBadge = (docStatus, errorReason) => {
    switch (docStatus) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            Ready
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 cursor-help"
            title={errorReason || 'Ingestion failed'}
          >
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between transition-colors">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? 'All Statuses' : st}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 transition-all shadow-sm"
            title="Refresh documents list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-100/70 dark:bg-slate-900/60 uppercase font-semibold text-[10px] tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Document Details</th>
                <th className="px-4 py-3.5">Category & Dept</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Chunks & Version</th>
                <th className="px-4 py-3.5">Uploaded</th>
                <th className="px-5 py-3.5 text-right">AI Tools & Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {isLoading && documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading knowledge base documents...</span>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">No documents found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Upload a PDF or DOCX file to start indexing.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isActionLoading = actionLoadingId === doc._id;

                  return (
                    <tr key={doc._id} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{doc.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {doc.category}
                          </span>
                          {doc.department && doc.department !== 'All Departments' && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{doc.department}</p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {getStatusBadge(doc.status, doc.errorReason)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {doc.chunkCount || 0} chunks
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            v{doc.version || 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* AI Summarize Action */}
                          <button
                            onClick={() => handleSummarize(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 transition-colors"
                            title="AI Document Summary"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          </button>

                          {/* AI FAQs Generator Action */}
                          <button
                            onClick={() => handleGenerateFAQs(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:border-blue-500/40 transition-colors"
                            title="Generate AI FAQs"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                          </button>

                          {/* Reprocess Button */}
                          <button
                            onClick={() => handleReprocess(doc._id)}
                            disabled={isActionLoading || doc.status === 'PROCESSING'}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-amber-500/40 transition-colors disabled:opacity-40"
                            title="Reprocess Document"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(doc._id, doc.title)}
                            disabled={isActionLoading}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:border-rose-500/40 transition-colors disabled:opacity-40"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Document Summary & FAQs Modal */}
      {summaryModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSummaryModalDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {summaryModalDoc.mode === 'faqs' ? <HelpCircle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {summaryModalDoc.mode === 'faqs' ? 'AI-Generated Student FAQs' : 'Executive Document Summary'}
                </h3>
                <p className="text-xs text-slate-500">{summaryModalDoc.title} ({summaryModalDoc.category})</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {modalLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                  <p className="text-xs font-semibold">Gemini AI is analyzing document text...</p>
                </div>
              ) : summaryModalDoc.mode === 'faqs' ? (
                <div className="space-y-3">
                  {(summaryModalDoc.faqs || []).map((faq, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Q: {faq.question}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {summaryModalDoc.summary || 'No summary available.'}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSummaryModalDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
