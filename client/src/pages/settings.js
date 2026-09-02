import React, { useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useThemeStore } from '../store/themeStore';
import api from '../services/api';
import {
  User,
  Mail,
  Lock,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  FileText,
  Shield,
  Palette,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updatePassword } = useAuthStore();
  const { conversations } = useChatStore();
  const { theme, setTheme } = useThemeStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updatePassword(currentPassword, newPassword);

    if (res.success) {
      setPasswordStatus({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus({ type: 'error', text: res.error || 'Failed to update password.' });
    }
    setIsUpdatingPassword(false);
  };

  const handleExportData = async (format = 'json') => {
    setIsExporting(true);
    try {
      // Fetch all conversations with messages
      const exportList = [];
      for (const conv of conversations) {
        const res = await api.get(`/chat/conversations/${conv._id}`);
        exportList.push(res.data.data);
      }

      let dataStr = '';
      let filename = `campusmind_chats_${new Date().toISOString().slice(0, 10)}`;
      let mimeType = 'text/plain';

      if (format === 'json') {
        dataStr = JSON.stringify(exportList, null, 2);
        filename += '.json';
        mimeType = 'application/json';
      } else {
        // Markdown format
        filename += '.md';
        dataStr = '# CampusMind Chat Export\n\n';
        exportList.forEach((item) => {
          dataStr += `## Conversation: ${item.conversation?.title || 'Chat'}\n`;
          dataStr += `*Date: ${new Date(item.conversation?.createdAt).toLocaleString()}*\n\n`;
          (item.messages || []).forEach((m) => {
            dataStr += `### ${m.role === 'user' ? '🎓 Student' : '🤖 CampusMind'}:\n${m.content}\n\n`;
            if (m.sources && m.sources.length > 0) {
              dataStr += `**Sources:**\n`;
              m.sources.forEach((s) => {
                dataStr += `- ${s.title} (${s.category}, Page ${s.pageNumber})\n`;
              });
              dataStr += '\n';
            }
          });
          dataStr += '---\n\n';
        });
      }

      const blob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export conversations: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Account Settings | CampusMind</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your interface appearance, credentials, preferences, and data exports.
          </p>
        </div>

        {/* Appearance / Theme Switcher Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Appearance & Theme
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Choose how CampusMind looks for you. Customize your color theme preference.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                theme === 'dark'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-400">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <div>
                <p className="text-sm font-bold">Dark Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Deep slate background with high-contrast text.
                </p>
              </div>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                theme === 'light'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <div>
                <p className="text-sm font-bold">Light Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Crisp, modern soft-slate surface with clean contrasts.
                </p>
              </div>
            </button>

            {/* System Sync Option */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                theme === 'system'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <Laptop className="w-4 h-4" />
                </div>
                {theme === 'system' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <div>
                <p className="text-sm font-bold">System Default</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Automatically sync with your OS preferences.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Profile Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 font-medium">Full Name</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{user?.name}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 font-medium">Email Address</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{user?.email}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 font-medium">Account Role</span>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 capitalize mt-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {user?.role}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 font-medium">Last Login</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Just now'}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Change Password
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Ensure your account is protected with a strong, secure password.
          </p>

          {passwordStatus && (
            <div
              className={`p-3.5 mb-5 rounded-xl border flex items-center gap-2.5 text-xs ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300'
              }`}
            >
              {passwordStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{passwordStatus.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isUpdatingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Export Data Section */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Export Chat History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Download your college inquiries, AI answers, and source citations for offline reference.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExportData('json')}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <FileJson className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Export as JSON (.json)
            </button>

            <button
              onClick={() => handleExportData('markdown')}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-teal-500 dark:text-teal-400" />
              Export as Markdown (.md)
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
