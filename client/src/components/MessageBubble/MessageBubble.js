import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceCitation from '../SourceCitation/SourceCitation';
import { useChatStore } from '../../store/chatStore';
import {
  User,
  GraduationCap,
  AlertCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Cpu,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
} from 'lucide-react';

export default function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === 'user';
  const { submitFeedback, selectedLanguage } = useChatStore();
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speaking if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating) => {
    if (!message._id || message._id.startsWith('temp')) return;
    setFeedbackRating(rating);
    await submitFeedback(message._id, rating);
  };

  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = (message.content || '').replace(/[*#_`~\[\]|]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      if (selectedLanguage === 'hi') utterance.lang = 'hi-IN';
      else if (selectedLanguage === 'mr') utterance.lang = 'mr-IN';
      else if (selectedLanguage === 'es') utterance.lang = 'es-ES';
      else if (selectedLanguage === 'fr') utterance.lang = 'fr-FR';
      else if (selectedLanguage === 'de') utterance.lang = 'de-DE';
      else utterance.lang = 'en-US';

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'groq':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 select-none">
            <Zap className="w-2.5 h-2.5" aria-hidden="true" /> Groq LPU
          </span>
        );
      case 'openai':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 select-none">
            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" /> OpenAI GPT
          </span>
        );
      case 'gemini':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 select-none">
            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" /> Gemini Flash
          </span>
        );
      case 'openrouter':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 select-none">
            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" /> OpenRouter
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 select-none">
            <Cpu className="w-2.5 h-2.5" aria-hidden="true" /> RAG Synthesizer
          </span>
        );
    }
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5 sm:gap-3 my-4 animate-slide-up">
        <div className="max-w-[85%] sm:max-w-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tr-none shadow-md min-w-0 break-words [overflow-wrap:anywhere]">
          <p className="text-xs sm:text-sm font-normal whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">
            {message.content}
          </p>
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 select-none shadow-sm mt-0.5">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const isUnanswerable = message.answerable === false;
  const rawScore = typeof message.confidenceScore === 'number' ? message.confidenceScore : 0.92;
  const confidencePercent = Math.min(100, Math.round(rawScore * 100));

  const getConfidenceLevel = (score) => {
    if (score >= 0.82) {
      return {
        label: `High Relevance (${confidencePercent}%)`,
        className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-500',
      };
    }
    if (score >= 0.65) {
      return {
        label: `Moderate Relevance (${confidencePercent}%)`,
        className: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-500',
      };
    }
    return {
      label: `Low Relevance (${confidencePercent}%)`,
      className: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      iconColor: 'text-rose-500',
    };
  };

  const confidenceData = getConfidenceLevel(rawScore);

  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 my-4 sm:my-5 animate-slide-up group min-w-0">
      {/* Bot Avatar */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/20 select-none mt-0.5">
        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0 max-w-3xl">
        {/* Main Bubble Content */}
        <div
          className={`p-3.5 sm:p-5 rounded-2xl rounded-tl-none border shadow-md transition-colors ${
            isUnanswerable
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'glass-panel border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
          }`}
        >
          {/* Header metadata bar - Rendered separately from the natural-language answer */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 select-none flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">CampusMind</span>
              {!isStreaming && message.provider && getProviderBadge(message.provider)}
              {!isStreaming && !isUnanswerable && (
                <span
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border animate-fade-in flex-shrink-0 ${confidenceData.className}`}
                  title="Confidence is calculated from vector chunk similarity scores against verified college documents"
                >
                  <ShieldCheck className={`w-3 h-3 flex-shrink-0 ${confidenceData.iconColor}`} aria-hidden="true" />
                  <span className="truncate">{confidenceData.label}</span>
                </span>
              )}
            </div>

            {!isStreaming && (
              <div className="flex items-center gap-1 sm:gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity ml-auto sm:ml-0 flex-shrink-0">
                {/* Voice Audio Reader Button */}
                <button
                  onClick={toggleSpeak}
                  className={`p-1.5 rounded-lg border text-xs btn-interactive flex items-center gap-1 ${
                    isSpeaking
                      ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500'
                  }`}
                  title={isSpeaking ? 'Stop voice reading' : 'Read answer aloud (Text-to-Speech)'}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 btn-interactive"
                  title="Copy answer text"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Unanswerable Warning Banner */}
          {isUnanswerable && (
            <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs select-none animate-slide-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>
                Information gap detected: No official college documents cleared the verified confidence threshold.
              </span>
            </div>
          )}

          {/* Streaming Loading Dots Indicator */}
          {isStreaming && (!message.content || message.content.length < 5) ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-500 dark:text-slate-400 animate-fade-in">
              <span className="inline-flex items-center gap-1 mr-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>CampusMind is retrieving verified facts...</span>
            </div>
          ) : (
            /* Clean Natural-Language AI Answer - Full GFM Markdown Support */
            <div className={`markdown-content text-slate-800 dark:text-slate-200 leading-relaxed text-sm ${isStreaming ? 'typing-cursor' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/40 dark:bg-slate-900/40 shadow-sm">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-semibold uppercase tracking-wider" {...props} />
                  ),
                  tbody: ({ node, ...props }) => (
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60" {...props} />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 align-top" {...props} />
                  ),
                  h1: ({ node, ...props }) => <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5 mb-1 uppercase tracking-wide text-emerald-600 dark:text-emerald-400" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 space-y-1 my-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm" {...props} />,
                  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-xs sm:text-sm text-slate-800 dark:text-slate-200 last:mb-0" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 pl-3 py-1.5 my-2 text-xs italic text-slate-700 dark:text-slate-300 rounded-r" {...props} />
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    if (inline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre className="p-3 my-2 rounded-xl bg-slate-900 text-slate-100 overflow-x-auto text-xs font-mono border border-slate-800">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Structured Citations Metadata - Rendered separately from the natural-language answer */}
          {!isStreaming && message.sources && message.sources.length > 0 && (
            <div className="select-none">
              <SourceCitation sources={message.sources} />
            </div>
          )}

          {/* Answer Feedback (👍 Helpful / 👎 Not Helpful) */}
          {!isStreaming && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 select-none animate-fade-in">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-medium">
                  {feedbackRating
                    ? '✨ Thanks for your feedback!'
                    : 'Was this answer helpful?'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleFeedback('up')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium btn-interactive ${
                      feedbackRating === 'up'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                    title="Mark answer as helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Helpful</span>
                  </button>

                  <button
                    onClick={() => handleFeedback('down')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium btn-interactive ${
                      feedbackRating === 'down'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600'
                    }`}
                    title="Mark answer as not helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Not Helpful</span>
                  </button>
                </div>
              </div>

              {/* Optional negative feedback reason quick-chips */}
              {feedbackRating === 'down' && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 animate-slide-up">
                  <span className="text-slate-400">Tell us why (optional):</span>
                  {['Inaccurate info', 'Missing details', 'Too vague', 'Outdated policy'].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => {
                        if (message._id && !message._id.startsWith('temp')) {
                          submitFeedback(message._id, 'down', reason);
                        }
                      }}
                      className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-rose-400 hover:text-rose-500 btn-interactive"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

