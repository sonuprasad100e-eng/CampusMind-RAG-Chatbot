import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import api from '../services/api';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  MessageSquare,
  Building,
  Tag,
  Loader2,
  GraduationCap,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Admissions',
  'Fees',
  'Hostel',
  'Exams',
  'Academic Calendar',
  'Policies',
  'Placements',
  'Scholarships',
];

const DEFAULT_FAQS = [
  {
    id: 'f1',
    category: 'Hostel',
    department: 'Hostel & Student Housing',
    documentTitle: 'Residence Hall & Mess Guidelines Handbook',
    question: 'What is the hostel biometric attendance and curfew timing?',
    answer: 'The hostel curfew is **10:00 PM on weekdays** and **10:30 PM on weekends and public holidays**. All residents must record biometric attendance between 9:00 PM and 10:00 PM daily. Late entry requires prior written approval from the Warden.',
  },
  {
    id: 'f2',
    category: 'Admissions',
    department: 'Computer Science & Engineering',
    documentTitle: 'Admissions & Fee Guide 2026-2027',
    question: 'What are the eligibility criteria for B.Tech Computer Science?',
    answer: 'Candidates must have passed 10+2 (or equivalent) with a **minimum of 75% aggregate in Physics, Chemistry, and Mathematics (PCM)**. Admissions are granted based on national entrance exam ranks followed by centralized campus counseling.',
  },
  {
    id: 'f3',
    category: 'Fees',
    department: 'All Departments',
    documentTitle: 'Admissions & Fee Guide 2026-2027',
    question: 'What is the fee refund policy if an admission is withdrawn?',
    answer: 'Refund tiers based on withdrawal request date:\n- **15 days or more before the deadline**: 100% refund (minus max ₹5,000 processing fee).\n- **Less than 15 days before deadline**: 90% refund.\n- **Up to 15 days after deadline**: 80% refund.\n- **16 to 30 days after deadline**: 50% refund.\n- **More than 30 days after deadline**: 0% refund.',
  },
  {
    id: 'f4',
    category: 'Exams',
    department: 'Examination Cell',
    documentTitle: 'Examination Rules & Academic Evaluation Regulations',
    question: 'What is the minimum attendance required to appear for End-Semester Examinations?',
    answer: 'Students must maintain a **minimum of 75% aggregate attendance** in each registered course. Condonation up to 10% may be granted by the Academic Dean only on medical grounds with valid documentation.',
  },
  {
    id: 'f5',
    category: 'Scholarships',
    department: 'All Departments',
    documentTitle: 'Admissions & Fee Guide 2026-2027',
    question: 'What is the 100% Chancellor Merit Scholarship?',
    answer: 'The Chancellor Merit Scholarship offers a **100% tuition fee waiver** for students ranking in the Top 500 of national entrance tests or scoring 98%+ in 10+2 examinations. It is renewable annually subject to maintaining a CGPA of 9.0+.',
  },
];

export default function FAQsPage() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/chat/faqs');
      if (res.data?.data && res.data.data.length > 0) {
        setFaqs(res.data.data);
      }
    } catch (err) {
      console.warn('Using default campus FAQs:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.department && faq.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>Campus FAQs & Knowledge Directory | CampusMind</title>
      </Head>

      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 transition-colors min-w-0">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 min-w-0">
          {/* Header Banner */}
          <div className="text-center space-y-2.5 sm:space-y-3 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Generated Knowledge Repository
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Find instant answers to common questions regarding admissions, fee schedules, hostel regulations, examination policies, and academic guidelines.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs by keywords (e.g. curfew, attendance, refund, scholarship)..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20'
                      : 'glass-card border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading campus FAQs...</span>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No matching FAQs found</h3>
                <p className="text-xs text-slate-500 mt-1">Try another search term or ask the AI Assistant directly.</p>
                <Link
                  href="/chat"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask CampusMind Chatbot
                </Link>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isExpanded = expandedId === (faq.id || index);
                return (
                  <div
                    key={faq.id || index}
                    className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => toggleExpand(faq.id || index)}
                      className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Tag className="w-2.5 h-2.5" /> {faq.category}
                          </span>
                          {faq.department && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <Building className="w-2.5 h-2.5" /> {faq.department}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 animate-fade-in space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        <p>{faq.answer}</p>
                        {faq.documentTitle && (
                          <div className="flex items-center gap-1.5 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Source: <strong className="text-slate-700 dark:text-slate-300">{faq.documentTitle}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need More Help CTA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/20">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">Have a specific question?</h2>
              <p className="text-emerald-100 text-xs sm:text-sm max-w-md">
                Ask our real-time AI assistant for instant, grounded answers with citations from all college handbooks.
              </p>
            </div>
            <Link
              href="/chat"
              className="px-6 py-3 rounded-2xl bg-white text-emerald-700 font-bold text-sm shadow-lg hover:bg-emerald-50 transition-all hover:scale-105 flex-shrink-0 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with CampusMind
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
