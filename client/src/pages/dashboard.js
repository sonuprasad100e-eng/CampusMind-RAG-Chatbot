import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { useComplaintStore } from '../store/complaintStore';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { complaints, fetchStudentComplaints, isLoading, initSocketListeners } = useComplaintStore();

  useEffect(() => {
    fetchStudentComplaints();
    initSocketListeners('student');
  }, [fetchStudentComplaints, initSocketListeners]);

  const submittedCount = complaints.filter((c) => c.status === 'Submitted').length;
  const inProgressCount = complaints.filter((c) =>
    ['Under Review', 'Assigned', 'In Progress'].includes(c.status)
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'In Progress':
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <AlertCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Submitted
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Student Dashboard | CampusMind</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
        {/* Welcome Header */}
        <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 relative z-10">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-emerald-500/25 flex-shrink-0">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                    Welcome, {user?.name}!
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 capitalize">
                    {user?.role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage your academic grievance submissions, track real-time resolution status, and consult the AI assistant.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-shrink-0">
              <Link
                href="/complaints/new"
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                <span>Submit Grievance</span>
              </Link>
              <Link
                href="/chat"
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl glass-card border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>AI Assistant</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Submitted
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {complaints.length}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                All-time grievance tickets
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Awaiting Review
              </p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {submittedCount}
              </h3>
              <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-1">
                Queued for admin review
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                In Progress
              </p>
              <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {inProgressCount}
              </h3>
              <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90 mt-1">
                Assigned to department
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resolved & Closed
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {resolvedCount}
              </h3>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1">
                Successfully closed
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/complaints/new"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 group transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Submit a New Complaint
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Report issues in hostels, academics, mess, IT facilities, or campus infrastructure.
            </p>
          </Link>

          <Link
            href="/complaints"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 group transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Grievance History & Tracking
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              View your active timeline, department remarks, and resolution documentation.
            </p>
          </Link>

          <Link
            href="/chat"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 group transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              RAG Knowledge Assistant
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Instant answers about fees, attendance rules, scholarships, exam timetables, and rules.
            </p>
          </Link>
        </div>

        {/* Recent Complaints Section */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Grievances
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track live status updates and department assignments.
              </p>
            </div>
            <Link
              href="/complaints"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
            >
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-xs">Loading grievance records...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No active complaints filed
              </p>
              <p className="text-xs mt-1">
                You haven&apos;t submitted any grievances yet. Click below if you need campus assistance.
              </p>
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Submit First Grievance
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {complaints.slice(0, 5).map((item) => (
                <Link
                  key={item._id}
                  href={`/complaints/${item._id}`}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-900/40 px-3 -mx-3 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {item.ticketId}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location}
                        </span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                    {getStatusBadge(item.status)}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
