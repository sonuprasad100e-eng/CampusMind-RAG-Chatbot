import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <>
      <Head>
        <title>CampusMind — RAG-Based College Information Chatbot</title>
        <meta
          name="description"
          content="AI-powered college assistant providing answers grounded strictly in official university documents."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('campusmind-theme') || 'dark';
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = saved === 'system' ? systemDark : saved === 'dark';
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        <Navbar />
        <main className="flex-1 flex flex-col animate-fade-in" key={router.pathname}>
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}
