import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from '../MessageBubble/MessageBubble';
import { useChatStore } from '../../store/chatStore';
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  Filter,
  Loader2,
  ChevronRight,
  Clock,
  Mic,
  MicOff,
  Globe,
  Download,
  FileJson,
  FileText,
  Search,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Admissions',
  'Fees',
  'Hostel',
  'Exams',
  'Placements',
  'Scholarships',
  'Clubs',
  'Policies',
  'Academic Calendar',
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳' },
];

const INITIAL_SUGGESTED_QUESTIONS = [
  { text: 'What is the attendance requirement?', category: 'Exams' },
  { text: 'How do I apply for an internship?', category: 'Placements' },
  { text: 'What are the exam rules?', category: 'Exams' },
  { text: 'What documents are required for admission?', category: 'Admissions' },
  { text: 'What are the hostel rules?', category: 'Hostel' },
];

function getContextualSuggestions(messages) {
  if (!messages || messages.length === 0) return [];

  const recentText = messages
    .slice(-3)
    .map((m) => (m.content || '').toLowerCase())
    .join(' ');

  if (recentText.includes('intern') || recentText.includes('placement') || recentText.includes('training')) {
    return [
      'Can I arrange my own internship?',
      'How many credits does the internship carry?',
      'What documents are required for internship approval?',
    ];
  }

  if (recentText.includes('exam') || recentText.includes('attendance') || recentText.includes('cgpa') || recentText.includes('evaluat')) {
    return [
      'What is the attendance requirement?',
      'What are the exam rules and passing criteria?',
      'When are supplementary exams conducted?',
    ];
  }

  if (recentText.includes('hostel') || recentText.includes('curfew') || recentText.includes('mess') || recentText.includes('room')) {
    return [
      'What is the hostel curfew on weekends?',
      'What are the rules for night passes?',
      'What are the hostel mess timings?',
    ];
  }

  if (recentText.includes('fee') || recentText.includes('admiss') || recentText.includes('scholarship') || recentText.includes('refund')) {
    return [
      'What is the refund policy on cancellation?',
      'What scholarships are available?',
      'What documents are required for admission?',
    ];
  }

  return [
    'What is the attendance requirement?',
    'How do I apply for an internship?',
    'What are the exam rules?',
  ];
}

export default function ChatWindow() {
  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    streamingContent,
    selectedCategory,
    setSelectedCategory,
    selectedLanguage,
    setSelectedLanguage,
    sendMessage,
    loadConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
    isLoadingConversations,
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const filteredConversations = conversations.filter((conv) =>
    (conv.title || '').toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  useEffect(() => {
    loadConversations();
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('campusmind_language');
      if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
        setSelectedLanguage(savedLang);
      }
    }
  }, [loadConversations, setSelectedLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('campusmind_language', newLang);
    }
  };

  // Speech to Text initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'mr' ? 'mr-IN' : 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLanguage]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome/Edge or type your question.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;
    const text = inputMessage;
    setInputMessage('');
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectSuggested = (item) => {
    if (item.category && item.category !== 'All') {
      setSelectedCategory(item.category);
    }
    sendMessage(item.text);
  };

  const handleExportChat = (format = 'md') => {
    if (messages.length === 0) {
      alert('No messages to export.');
      return;
    }

    let dataStr = '';
    let filename = `campusmind_chat_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      dataStr = JSON.stringify(messages, null, 2);
      filename += '.json';
    } else {
      filename += '.md';
      dataStr = `# CampusMind Conversation Export\n*Date: ${new Date().toLocaleString()}*\n\n`;
      messages.forEach((m) => {
        dataStr += `### ${m.role === 'user' ? '🎓 Student' : '🤖 CampusMind'}:\n${m.content}\n\n`;
        if (m.sources && m.sources.length > 0) {
          dataStr += `**Verified Sources:**\n`;
          m.sources.forEach((s) => {
            dataStr += `- ${s.title} (${s.category}, Page ${s.pageNumber || 1})\n`;
          });
          dataStr += '\n';
        }
      });
    }

    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Sidebar: Conversation History (Desktop) */}
      <aside className="w-72 hidden md:flex flex-col glass-panel border-r border-slate-200/80 dark:border-slate-800/80 p-4 transition-colors">
        <button
          onClick={createNewConversation}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        {/* Conversation Search Bar */}
        <div className="relative mt-3 mb-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1">
          <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent Chats
            </span>
            <span className="text-[10px] font-bold">{filteredConversations.length}</span>
          </div>

          {isLoadingConversations && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 px-2 py-4 text-center">
              {chatSearchQuery ? 'No matching chats found.' : 'No past conversations yet.'}
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => loadConversation(conv._id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  activeConversationId === conv._id
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeConversationId === conv._id ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-xs truncate">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col z-10 shadow-2xl animate-slide-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Chat History
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                createNewConversation();
                setIsMobileSidebarOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mt-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>

            {/* Conversation Search Bar */}
            <div className="relative mt-3 mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 mt-2">
              {filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => {
                    loadConversation(conv._id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer ${
                    activeConversationId === conv._id
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                    <span className="text-xs truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv._id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 max-w-full">
        {/* Top Control Bar: Mobile Sidebar Toggle + Category Filters + Multilingual Selector + 1-Click Export */}
        <div className="glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto transition-colors min-w-0 max-w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto min-w-0 flex-1">
            {/* Mobile Sidebar Drawer Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 shadow-sm flex-shrink-0"
              title="Open Chat History"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </button>

            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 pr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden sm:inline font-medium">Filter:</span>
            </div>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20'
                    : 'glass-card border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right Tools: Language Picker & Export */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Multilingual Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 sm:px-2 py-1 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                title="Select Response Language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 1-Click Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 shadow-sm transition-colors"
                title="Export Conversation"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div
                  onMouseLeave={() => setShowExportMenu(false)}
                  className="absolute right-0 mt-2 w-44 glass-panel rounded-xl shadow-2xl py-1 border border-slate-200 dark:border-slate-700 z-50 animate-slide-up"
                >
                  <button
                    onClick={() => handleExportChat('md')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => handleExportChat('json')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <FileJson className="w-3.5 h-3.5 text-blue-500" />
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 min-w-0 max-w-full">
          {messages.length === 0 && !isStreaming ? (
            /* Empty State / Welcome Screen */
            <div className="max-w-3xl mx-auto py-6 sm:py-12 text-center animate-fade-in min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20 mb-3 sm:mb-4">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 px-2">
                What would you like to know about Campus?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6 sm:mb-8 px-2">
                Ask any question about admissions, fees, hostel rules, placements, or exams. Answers are verified strictly against official college documents with multilingual & voice support.
              </p>

              {/* Initial Suggested Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-w-2xl mx-auto text-left min-w-0">
                {INITIAL_SUGGESTED_QUESTIONS.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggested(item)}
                    className="glass-card glass-card-hover p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-between group shadow-sm min-w-0"
                  >
                    <div className="flex flex-col pr-2 min-w-0">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.text}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">
                        {item.category}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="max-w-4xl mx-auto min-w-0">
              {messages.map((msg, index) => (
                <MessageBubble key={msg._id || index} message={msg} />
              ))}

              {/* Live Streaming Message Bubble */}
              {isStreaming && (
                <MessageBubble
                  message={{
                    role: 'assistant',
                    content: streamingContent || 'Searching college documents and retrieving verified facts...',
                    answerable: true,
                  }}
                  isStreaming={true}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-5 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 transition-colors min-w-0 max-w-full">
          {/* Dynamic Context-Aware Suggestions Chips Bar */}
          {messages.length > 0 && !isStreaming && (
            <div className="max-w-4xl mx-auto mb-2 px-1 flex items-center gap-1.5 overflow-x-auto select-none min-w-0 max-w-full">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                Suggested:
              </span>
              {getContextualSuggestions(messages).map((suggestionText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(suggestionText)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium glass-card border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap transition-all duration-150 btn-interactive shadow-sm flex-shrink-0"
                >
                  {suggestionText}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative flex items-center gap-2 min-w-0"
          >
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? '🎙️ Listening to your voice... Speak now...'
                    : selectedCategory !== 'All'
                    ? `Ask about ${selectedCategory}...`
                    : `Ask about fees, hostel rules, admissions...`
                }
                disabled={isStreaming}
                className={`w-full bg-white dark:bg-slate-900/90 border rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 pr-14 sm:pr-20 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all duration-200 shadow-sm min-w-0 ${
                  isRecording
                    ? 'border-rose-500 ring-2 ring-rose-500/30 animate-pulse'
                    : 'border-slate-200 dark:border-slate-700/80 focus:border-emerald-500'
                }`}
              />

              {/* Microphone Speech to Text Button inside input */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isStreaming}
                className={`absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-xl btn-interactive ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-bounce shadow-lg shadow-rose-500/30'
                    : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isRecording ? 'Click to stop listening' : 'Speak your question with Voice (Speech to Text)'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:hover:from-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 btn-interactive flex-shrink-0 flex items-center justify-center"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </form>
          <div className="text-center mt-2 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            <span>CampusMind synthesizes answers strictly from verified college records.</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Language: {LANGUAGES.find((l) => l.code === selectedLanguage)?.label}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
