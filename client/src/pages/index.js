import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCheck,
  HelpCircle,
  Database,
  Cpu,
  Layers,
  Globe2,
  ThumbsUp,
  FileText,
  CheckCircle2,
  Building,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[280px] bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg shadow-emerald-500/10 animate-slide-down">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Agentic RAG College Assistant</span>
          </div>

          {/* Main Headline (0ms delay) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.15] animate-slide-up">
            CampusMind <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
              Your Intelligent College Assistant
            </span>
          </h1>

          {/* Subtitle (100ms delay) */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 sm:mb-10 leading-relaxed font-normal animate-slide-up delay-100">
            Get instant, verified answers to college questions on admissions, fees, hostel policies, exams, and placements. Grounded strictly in official university documents with exact page citations and multi-lingual intelligence.
          </p>

          {/* Action CTAs (200ms delay) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto sm:max-w-none mb-12 animate-slide-up delay-200">
            <Link
              href={isAuthenticated ? '/chat' : '/login'}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 btn-interactive flex items-center justify-center gap-2.5"
            >
              <GraduationCap className="w-5 h-5" />
              <span>{isAuthenticated ? 'Start Chatting' : 'Explore CampusMind'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {isAuthenticated && user?.role === 'admin' ? (
              <Link
                href="/admin"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold text-sm btn-interactive flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Admin Knowledge Base</span>
              </Link>
            ) : (
              <Link
                href="/faqs"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold text-sm btn-interactive flex items-center justify-center gap-2 shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>View Knowledge Base FAQs</span>
              </Link>
            )}
          </div>

          {/* Trust Indicators Bar (300ms delay) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 border-t border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-400 animate-fade-in delay-300">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 transition-transform duration-200 hover:-translate-y-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero Hallucinations</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 transition-transform duration-200 hover:-translate-y-0.5">
              <BookOpen className="w-4 h-4 text-teal-500" />
              <span>Page-Level Citations</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 transition-transform duration-200 hover:-translate-y-0.5">
              <Globe2 className="w-4 h-4 text-blue-500" />
              <span>English • हिन्दी • मराठी</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 transition-transform duration-200 hover:-translate-y-0.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Live Token Streaming</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Product Preview & Interactive Showcase Mockup (300ms delay + subtle floating) */}
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-slide-up delay-300">
        <div className="glass-panel rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40">
          {/* Mockup Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                CampusMind Assistant Interface
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Agentic RAG Active
              </span>
            </div>
          </div>

          {/* Sample Chat Flow */}
          <div className="space-y-4 text-left">
            {/* User Bubble */}
            <div className="flex items-start justify-end gap-2.5 animate-slide-up">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-xs sm:text-sm shadow-md">
                What is the minimum attendance requirement to write semester exams?
              </div>
            </div>

            {/* Assistant Bubble */}
            <div className="flex items-start gap-3 animate-slide-up delay-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex-1 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CampusMind</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 92% High Relevance
                  </span>
                </div>

                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  Students must maintain a minimum of <strong>75% physical attendance</strong> in each registered course (theory and practical components separately) to be eligible to appear for the End-Semester Examinations.
                </p>

                {/* Source citation snippet */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 transition-colors hover:border-emerald-500/40">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold truncate">Examination Rules & Academic Evaluation Regulations</span>
                    <span className="ml-auto text-slate-400 whitespace-nowrap">Page 1</span>
                  </div>
                </div>

                {/* Feedback snippet */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Was this information helpful?</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 transition-transform hover:scale-105">
                      <ThumbsUp className="w-3 h-3" /> Helpful
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 4-Step RAG Pipeline */}
      <section className="w-full py-16 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Architecture & Transparency
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              How the Retrieval-Augmented Pipeline Works
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative shadow-sm card-lift group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 group-hover:scale-110 transition-transform duration-200">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Ingestion & Chunks
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Admins upload official PDFs & DOCXs. Text is recursively chunked (~800 chars) with page-level awareness.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative shadow-sm card-lift group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm mb-4 group-hover:scale-110 transition-transform duration-200">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Vector Embeddings
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dense embeddings are generated for every chunk and stored in MongoDB Atlas Vector Search.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative shadow-sm card-lift group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-4 group-hover:scale-110 transition-transform duration-200">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Semantic Retrieval
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Vector search retrieves the top matching chunks clearing the relevance threshold for precision.
              </p>
            </div>

            {/* Step 4 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative shadow-sm card-lift group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mb-4 group-hover:scale-110 transition-transform duration-200">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Grounded Synthesis
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Autonomous agent synthesizes concise answers in real-time Socket.IO stream with verifiable citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Six Pillars of Excellence */}
      <section className="w-full py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Engineered For Academic Precision
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              Why CampusMind Reaches NxtWave Excellence
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 card-lift group shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Traceable Citations</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every generated response includes clickable source badges indicating document title, category, and page number.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 card-lift group shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Honest Gap Detection</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                If the requested info is absent, the agent never hallucinates; it transparently informs the student.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 card-lift group shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Globe2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Trilingual Intelligence</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Native support for English, हिन्दी, and मराठी with cross-lingual follow-up awareness.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 card-lift group shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Contextual Suggestions</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dynamic follow-up chips adapt to the active topic, enabling 1-click exploration.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 card-lift group shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Answer Feedback System</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Students can vote 👍 / 👎 with reason feedback, storing ratings securely in MongoDB.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 card-lift group shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Low-Latency Streaming</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Real-time WebSocket token streaming creates a fluid, instant conversational experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      <section className="w-full pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-white/90 to-slate-50 dark:from-slate-900/80 dark:to-slate-950 shadow-md card-lift">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Instant Pre-Configured Demo Accounts
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              You can sign in with these seeded accounts or register a new student account:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-0.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Student Account
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-mono">
                  Email: <span className="text-slate-900 dark:text-white font-semibold">student@campusmind.edu</span>
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  Password: <span className="text-slate-900 dark:text-white font-semibold">Student@123456</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-0.5">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  Admin Account
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-mono">
                  Email: <span className="text-slate-900 dark:text-white font-semibold">admin@campusmind.edu</span>
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  Password: <span className="text-slate-900 dark:text-white font-semibold">Admin@123456</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

