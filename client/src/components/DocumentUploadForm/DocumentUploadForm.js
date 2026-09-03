import React, { useState, useRef } from 'react';
import api from '../../services/api';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
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

export default function DocumentUploadForm({ onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [category, setCategory] = useState('Admissions');
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(filesArr);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArr);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please choose at least one file to upload.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);
    if (selectedFiles.length === 1 && customTitle) {
      formData.append('title', customTitle);
    }

    try {
      const res = await api.post('/admin/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatusMessage({
        type: 'success',
        text: res.data.message || 'Documents uploaded successfully and ingestion initiated.',
      });
      setSelectedFiles([]);
      setCustomTitle('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload documents. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
        Upload College Documents
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Upload PDF, DOCX, or TXT files. The RAG pipeline will automatically extract text, generate semantic chunks, and compute vector embeddings.
      </p>

      {statusMessage && (
        <div
          className={`p-3.5 mb-5 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 group-hover:bg-emerald-500/10 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 flex items-center justify-center mx-auto mb-3 transition-colors">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Click to upload or drag & drop documents
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supported formats: PDF, DOCX, TXT (Up to 20MB per file)
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Selected Files ({selectedFiles.length})
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-white truncate font-medium">{file.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category & Title Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Knowledge Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none shadow-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {selectedFiles.length === 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Document Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Hostels & Mess Rules 2026"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 btn-interactive btn-primary-glow flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ingesting & Generating Vectors...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload and Ingest to Vector Database
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
