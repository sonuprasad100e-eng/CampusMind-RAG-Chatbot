import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useComplaintStore } from '../../store/complaintStore';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Tag,
  Paperclip,
  Send,
  User,
  ShieldCheck,
  Building,
  FileText,
  ExternalLink,
  MessageSquare,
  Loader2,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Assigned', label: 'Assigned' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Closed', label: 'Closed' },
];

export default function ComplaintDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const {
    activeComplaint,
    fetchComplaintById,
    addComment,
    isLoading,
    initSocketListeners,
  } = useComplaintStore();

  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchComplaintById(id);
      initSocketListeners();
    }
  }, [id, fetchComplaintById, initSocketListeners]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeComplaint?.comments]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSendingComment) return;

    setIsSendingComment(true);
    const res = await addComment(id, commentText);
    if (res.success) {
      setCommentText('');
    }
    setIsSendingComment(false);
  };

  const getStepIndex = (status) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = activeComplaint ? getStepIndex(activeComplaint.status) : 0;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">CRITICAL PRIORITY</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">HIGH PRIORITY</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">MEDIUM PRIORITY</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">LOW PRIORITY</span>;
    }
  };

  if (isLoading && !activeComplaint) {
    return (
      <ProtectedRoute>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!activeComplaint && !isLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complaint Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            The requested grievance ticket does not exist or you do not have permission to view it.
          </p>
          <Link
            href="/complaints"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            Return to Complaints
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>{activeComplaint.ticketId} | CampusMind Grievance</title>
      </Head>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 transition-colors duration-200 min-w-0">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Link
              href={user?.role === 'admin' ? '/admin/complaints' : '/complaints'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {activeComplaint.ticketId}
                </span>
                {getPriorityBadge(activeComplaint.priority)}
                <span className="px-2 sm:px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-semibold border border-slate-200 dark:border-slate-700">
                  {activeComplaint.category}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 break-words">
                {activeComplaint.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Submitted {new Date(activeComplaint.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* 6-Stage Visual Progress Tracker */}
        <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Resolution Progress
            </h3>
          </div>

          <div className="relative min-w-0">
            {/* Horizontal Line for Desktop */}
            <div className="hidden md:block absolute top-1/2 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 relative z-10 min-w-0">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all min-w-0 ${
                      isCurrent
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                        : isPassed
                        ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold mb-1.5 sm:mb-2 flex-shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : idx + 1}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-center leading-tight truncate max-w-full">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Column Layout: Main Details & Sidebar Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Detailed Description & Context
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activeComplaint.description}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span>
                <span>{activeComplaint.location}</span>
              </div>
            </div>

            {/* Active Administrative Progress Remark Banner */}
            {!activeComplaint.resolution?.resolutionNotes &&
              activeComplaint.timeline
                ?.slice()
                .reverse()
                .find((e) => (e.updaterRole === 'admin' || e.note) && e.status !== 'Submitted')?.note && (
                <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 bg-blue-500/5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Clock className="w-5 h-5" />
                      <h3 className="text-sm font-bold">Administration & Teacher Remark</h3>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      {activeComplaint.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {
                      activeComplaint.timeline
                        .slice()
                        .reverse()
                        .find((e) => (e.updaterRole === 'admin' || e.note) && e.status !== 'Submitted')?.note
                    }
                  </p>
                </div>
              )}

            {/* Official Resolution Banner (if resolved/closed) */}
            {activeComplaint.resolution?.resolutionNotes && (
              <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="text-sm font-bold">Official Resolution Summary</h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeComplaint.resolution.resolutionNotes}
                </p>
                {activeComplaint.resolution.resolvedAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Resolved on {new Date(activeComplaint.resolution.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Attachments Preview */}
            {activeComplaint.attachments?.length > 0 && (
              <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-500" />
                  Attached Evidence & Photos ({activeComplaint.attachments.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeComplaint.attachments.map((att, idx) => {
                    const isImage = att.mimeType?.startsWith('image/');
                    return (
                      <div
                        key={idx}
                        className="glass-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-500 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {att.originalName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {(att.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>

                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View File Attachment
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discussion & Comments Thread */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  Grievance Follow-Up Thread ({activeComplaint.comments?.length || 0})
                </h3>
                <span className="text-[10px] text-slate-500">Live replies enabled</span>
              </div>

              {/* Message List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activeComplaint.comments?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                    No replies yet. Post a comment below if you have additional information.
                  </p>
                ) : (
                  activeComplaint.comments.map((c) => {
                    const isStaff = c.userRole === 'admin';
                    return (
                      <div
                        key={c._id}
                        className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                          isStaff
                            ? 'bg-purple-500/10 border border-purple-500/20 text-purple-950 dark:text-purple-200 mr-4'
                            : 'bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ml-4'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isStaff ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span className="font-bold">{c.userName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                              {c.userRole}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{c.message}</p>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type a reply or question for administration..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSendingComment}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white shadow-md transition-all flex items-center justify-center flex-shrink-0"
                >
                  {isSendingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Department Assignment Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-500" />
                Department Responsible
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Department</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeComplaint.assignedTo?.department || 'Pending Assignment'}
                  </span>
                </div>

                {activeComplaint.assignedTo?.staffName && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Assigned Staff</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {activeComplaint.assignedTo.staffName}
                    </span>
                  </div>
                )}

                {activeComplaint.assignedTo?.assignedAt && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Assigned On</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(activeComplaint.assignedTo.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {activeComplaint.assignedTo?.notes && (
                  <div className="pt-1">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">
                      Staff Instructions:
                    </span>
                    <p className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                      {activeComplaint.assignedTo.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Student Info Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-500" />
                Submitted By
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {activeComplaint.studentName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {activeComplaint.studentName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {activeComplaint.studentEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Chronological Audit Timeline */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                Activity Timeline Log
              </h3>

              <div className="space-y-3">
                {activeComplaint.timeline?.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {evt.status}
                      </p>
                      {evt.note && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {evt.note}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
