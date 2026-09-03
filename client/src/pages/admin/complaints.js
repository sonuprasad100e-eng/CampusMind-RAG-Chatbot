import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { useComplaintStore } from '../../store/complaintStore';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  UserCheck,
  MoreVertical,
  Trash2,
  ExternalLink,
  Edit,
  RefreshCw,
  Loader2,
  X,
  MapPin,
  FileText,
  TrendingUp,
} from 'lucide-react';

const DEPARTMENTS = [
  'Academic Dean Office',
  'Hostel Warden & Housing',
  'IT & Network Services',
  'Estate & Maintenance Cell',
  'Examination Cell',
  'Accounts & Finance Dept',
  'Student Welfare & Discipline',
  'Library Administration',
  'Campus Security & Transport',
];

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
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function AdminComplaintsPage() {
  const {
    complaints,
    stats,
    fetchAdminComplaints,
    fetchComplaintStats,
    updateComplaintStatus,
    assignComplaint,
    updateComplaintPriority,
    deleteComplaint,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    searchTerm,
    setSearchTerm,
    isLoading,
    initSocketListeners,
  } = useComplaintStore();

  // Modals
  const [assignModalDoc, setAssignModalDoc] = useState(null);
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [staffName, setStaffName] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [statusModalDoc, setStatusModalDoc] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchAdminComplaints();
    fetchComplaintStats();
    initSocketListeners();
  }, [fetchAdminComplaints, fetchComplaintStats, initSocketListeners, filterStatus, filterCategory, filterPriority, searchTerm]);

  // Handle Assign Submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalDoc) return;

    setActionLoadingId(assignModalDoc._id);
    const res = await assignComplaint(
      assignModalDoc._id,
      selectedDept,
      staffName,
      assignNotes
    );
    setActionLoadingId(null);
    if (res.success) {
      setAssignModalDoc(null);
      fetchAdminComplaints();
      fetchComplaintStats();
    } else {
      alert(res.error || 'Failed to assign complaint.');
    }
  };

  // Handle Status Update Submission
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalDoc) return;

    setActionLoadingId(statusModalDoc._id);
    const res = await updateComplaintStatus(
      statusModalDoc._id,
      selectedStatus,
      statusNote,
      resolutionNotes
    );
    setActionLoadingId(null);
    if (res.success) {
      setStatusModalDoc(null);
      fetchAdminComplaints();
      fetchComplaintStats();
    } else {
      alert(res.error || 'Failed to update status.');
    }
  };

  // Handle Delete
  const handleDelete = async (id, ticketId) => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint ticket ${ticketId}?`)) {
      return;
    }
    setActionLoadingId(id);
    await deleteComplaint(id);
    setActionLoadingId(null);
    fetchComplaintStats();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'In Progress':
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <AlertCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
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
    <ProtectedRoute roleRequired="admin">
      <Head>
        <title>Grievance Management Portal | CampusMind Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 transition-colors duration-200 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5">
              <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 flex-shrink-0" />
              <span>Student Grievance & Complaint Operations</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Assign departments, update live investigation status, coordinate with staff, and post resolution summaries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchAdminComplaints();
                fetchComplaintStats();
              }}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Grievances
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats?.total || 0}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              All student submissions
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active / In Progress
            </p>
            <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {stats?.activeCount || 0}
            </h3>
            <p className="text-[11px] text-blue-500 mt-1">
              Under review or assigned
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resolved Tickets
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats?.resolvedCount || 0}
            </h3>
            <p className="text-[11px] text-emerald-500 mt-1">
              Successfully resolved & closed
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resolution Rate
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats?.resolutionRate || 100}%
            </h3>
            <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Grievance redressal rate
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket, title, student..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* Status */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
              >
                {PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    Priority: {pr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Ticket ID & Title</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Category & Location</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assigned To</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-950/40">
                {isLoading && complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                      Loading complaints...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      No complaint records found matching current filters.
                    </td>
                  </tr>
                ) : (
                  complaints.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      {/* Ticket & Title */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {item.ticketId}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate" title={item.title}>
                            {item.title}
                          </span>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.studentName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.studentEmail}
                          </span>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {item.location}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        {getPriorityBadge(item.priority)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {item.assignedTo?.department || 'Unassigned'}
                          </span>
                          {item.assignedTo?.staffName && (
                            <span className="text-[10px] text-slate-500">
                              ({item.assignedTo.staffName})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign Button */}
                          <button
                            onClick={() => {
                              setAssignModalDoc(item);
                              setSelectedDept(item.assignedTo?.department !== 'Unassigned' ? item.assignedTo.department : DEPARTMENTS[0]);
                              setStaffName(item.assignedTo?.staffName || '');
                              setAssignNotes(item.assignedTo?.notes || '');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title="Assign Department"
                          >
                            <Building className="w-3.5 h-3.5" />
                          </button>

                          {/* Status Update Button */}
                          <button
                            onClick={() => {
                              setStatusModalDoc(item);
                              setSelectedStatus(item.status);
                              setStatusNote('');
                              setResolutionNotes(item.resolution?.resolutionNotes || '');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Update Status"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* View Details */}
                          <Link
                            href={`/complaints/${item._id}`}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            title="View Full Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item._id, item.ticketId)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Assign Department */}
        {assignModalDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
              <button
                onClick={() => setAssignModalDoc(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Assign Grievance to Department
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {assignModalDoc.ticketId} — {assignModalDoc.title}
                  </p>
                </div>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsible Department *
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsible Officer / Staff Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma / Chief Warden"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions / Action Notes
                  </label>
                  <textarea
                    rows={3}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="Please inspect the premises and resolve within 24 hours..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalDoc(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Status */}
        {statusModalDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
              <button
                onClick={() => setStatusModalDoc(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Update Complaint Status
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {statusModalDoc.ticketId}
                  </p>
                </div>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Status Pipeline State *
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {STATUSES.filter((s) => s !== 'All').map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Administrative Progress Note
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Electrician arrived on site for inspection"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {(selectedStatus === 'Resolved' || selectedStatus === 'Closed') && (
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolution Summary *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Explain how the issue was fixed, components replaced, or policy verified..."
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStatusModalDoc(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md"
                  >
                    Save Status Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
