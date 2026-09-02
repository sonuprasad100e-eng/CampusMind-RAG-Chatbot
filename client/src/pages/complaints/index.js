import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useComplaintStore } from '../../store/complaintStore';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  MessageSquare,
  Paperclip,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Hostel',
  'Academic',
  'Mess & Cafeteria',
  'Infrastructure & Maintenance',
  'Fee & Accounts',
  'Library',
  'Ragging & Discipline',
  'Transport',
  'General',
];

const STATUSES = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function StudentComplaintsHistoryPage() {
  const {
    complaints,
    fetchStudentComplaints,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    searchTerm,
    setSearchTerm,
    isLoading,
  } = useComplaintStore();

  useEffect(() => {
    fetchStudentComplaints();
  }, [fetchStudentComplaints, filterStatus, filterCategory, filterPriority, searchTerm]);

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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">LOW</span>;
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>My Grievance History | CampusMind</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-emerald-500" />
              Grievance History & Status Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              View your filed complaints, live investigation progress, and administrative resolution notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStudentComplaints}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/complaints/new"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              New Grievance
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket ID, title, or location..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1 text-[11px] font-medium">
              <Filter className="w-3 h-3 text-emerald-500" /> Filter:
            </span>
            {CATEGORIES.slice(0, 7).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                    : 'glass-card border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grievances List */}
        {isLoading && complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-xs">Loading grievance history...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Grievance Records Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
              There are no complaint records matching your current filter criteria.
            </p>
            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Submit a Complaint
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((item) => (
              <Link
                key={item._id}
                href={`/complaints/${item._id}`}
                className="block glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 group transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-colors flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {item.ticketId}
                        </span>
                        {getPriorityBadge(item.priority)}
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location}
                        </span>
                        {item.attachments?.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Paperclip className="w-3 h-3 text-emerald-500" />
                            {item.attachments.length} files
                          </span>
                        )}
                        {item.comments?.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            {item.comments.length} replies
                          </span>
                        )}
                        <span>Submitted on {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto flex-shrink-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      {getStatusBadge(item.status)}
                      {item.assignedTo?.department && item.assignedTo.department !== 'Unassigned' && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">
                          {item.assignedTo.department}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
