import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useComplaintStore } from '../../store/complaintStore';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import {
  PlusCircle,
  FileText,
  UploadCloud,
  X,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MapPin,
  Tag,
  AlertTriangle,
} from 'lucide-react';

const CATEGORIES = [
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

const PRIORITIES = [
  { value: 'Low', label: 'Low — Non-urgent matter', color: 'text-slate-500' },
  { value: 'Medium', label: 'Medium — Normal attention required', color: 'text-blue-500' },
  { value: 'High', label: 'High — Important issue affecting daily routine', color: 'text-amber-500' },
  { value: 'Critical', label: 'Critical — Emergency, safety, or severe disruption', color: 'text-rose-500' },
];

export default function NewComplaintPage() {
  const router = useRouter();
  const { createComplaint, isSubmitting } = useComplaintStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hostel');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedArr = Array.from(e.target.files);
      if (files.length + selectedArr.length > 5) {
        setErrorMessage('Maximum 5 files can be attached.');
        return;
      }
      setFiles([...files, ...selectedArr]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const selectedArr = Array.from(e.dataTransfer.files);
      if (files.length + selectedArr.length > 5) {
        setErrorMessage('Maximum 5 files can be attached.');
        return;
      }
      setFiles([...files, ...selectedArr]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !location.trim() || !description.trim()) {
      setErrorMessage('Please fill in the title, location, and description.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('location', location.trim());
    formData.append('priority', priority);
    formData.append('description', description.trim());

    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const res = await createComplaint(formData);
    if (res.success) {
      router.push(`/complaints/${res.data._id}`);
    } else {
      setErrorMessage(res.error || 'Failed to submit grievance.');
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Submit New Grievance | CampusMind</title>
      </Head>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors duration-200 min-w-0">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-3 mb-6 min-w-0">
          <Link
            href="/complaints"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <PlusCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <span>Submit Student Grievance</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Submit your concern directly to university administration and track progress step-by-step.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
          <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm min-w-0">
            {/* Title Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Grievance Subject / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wi-Fi router malfunction in Library 2nd Floor"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* Category & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  Specific Location *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Hostel 2, Room 304 / Main Audi"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Urgency / Priority Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      priority === p.value
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="text-xs font-bold">{p.value}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {p.label.split('—')[1]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Description of the Issue *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide complete context, what went wrong, when it started, and any steps already attempted..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm leading-relaxed"
              />
            </div>

            {/* Attachments Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Supporting Images / Documents (Optional)
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 flex items-center justify-center mx-auto mb-2 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Click or drag files here to attach proof (Photos, PDFs, Docs)
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Supported: JPG, PNG, WEBP, PDF, DOCX (Up to 10MB each, max 5 files)
                </p>
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Attached Files ({files.length}/5):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="truncate text-slate-900 dark:text-white font-medium">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/complaints"
              className="px-5 py-3 rounded-2xl glass-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Grievance Ticket...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Submit Grievance Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
