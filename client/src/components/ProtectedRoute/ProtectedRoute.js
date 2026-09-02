import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, roleRequired }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      } else if (roleRequired && user?.role !== roleRequired) {
        // If student attempts to access admin route, redirect to /chat
        router.push(user?.role === 'admin' ? '/admin' : '/chat');
      }
    }
  }, [isAuthenticated, isLoading, user, roleRequired, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-400">Verifying session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roleRequired && user?.role !== roleRequired) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          You do not have permission to view this page. This section is restricted strictly to {roleRequired} accounts.
        </p>
        <button
          onClick={() => router.push(user?.role === 'admin' ? '/admin' : '/chat')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
