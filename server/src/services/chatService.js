const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const retrievalService = require('./retrievalService');
const agentService = require('./agentService');
const env = require('../config/env');
const { getIO } = require('../config/socket');

let openaiClient = null;
let groqClient = null;
let googleAI = null;

// Initialize OpenAI client
if (env.OPENAI_API_KEY) {
  try {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  } catch (err) {
    console.warn('[ChatService] OpenAI client init failed:', err.message);
  }
} else if (env.OPENROUTER_API_KEY) {
  try {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://campusmind.edu',
        'X-Title': 'CampusMind College Chatbot',
      },
    });
  } catch (err) {
    console.warn('[ChatService] OpenRouter client init failed:', err.message);
  }
}

// Initialize Groq client
if (env.GROQ_API_KEY) {
  try {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  } catch (err) {
    console.warn('[ChatService] Groq client init failed:', err.message);
  }
}

// Initialize Gemini client
if (env.GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    googleAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  } catch (err) {
    console.warn('[ChatService] Gemini client init failed:', err.message);
  }
}

/**
 * Provider-specific generation handlers
 */
async function generateWithGroq({ systemPrompt, promptPayload, emitToken }) {
  if (!groqClient || !env.GROQ_API_KEY) return null;
  const models = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];
  for (const model of models) {
    try {
      let content = '';
      const stream = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptPayload },
        ],
        stream: true,
        temperature: 0.2,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          content += delta;
          emitToken(delta);
        }
      }

      if (content) {
        return { content, provider: 'groq' };
      }
    } catch (err) {
      console.warn(`[ChatService Groq ${model}] error:`, err.message);
    }
  }
  return null;
}

async function generateWithOpenAI({ systemPrompt, promptPayload, emitToken }) {
  if (!openaiClient || (!env.OPENAI_API_KEY && !env.OPENROUTER_API_KEY)) return null;
  const modelName = env.OPENROUTER_API_KEY ? 'meta-llama/llama-3.3-70b-instruct' : 'gpt-4o-mini';
  try {
    let content = '';
    const stream = await openaiClient.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptPayload },
      ],
      stream: true,
      temperature: 0.2,
    });

    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content || '';
      if (delta) {
        content += delta;
        emitToken(delta);
      }
    }

    if (content) {
      return { content, provider: env.OPENROUTER_API_KEY ? 'openrouter' : 'openai' };
    }
  } catch (err) {
    console.warn('[ChatService OpenAI] error:', err.message);
  }
  return null;
}

async function generateWithGemini({ systemPrompt, promptPayload, emitToken }) {
  if (!googleAI || !env.GEMINI_API_KEY) return null;
  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  for (const modelName of candidateModels) {
    try {
      const geminiModel = googleAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      let content = '';
      try {
        const resultStream = await geminiModel.generateContentStream(promptPayload);
        for await (const item of resultStream.stream) {
          const textChunk = item.text();
          if (textChunk) {
            content += textChunk;
            emitToken(textChunk);
          }
        }
      } catch (streamErr) {
        const msg = streamErr.message || '';
        if (!msg.includes('404') && !msg.includes('not found') && !msg.includes('API_KEY')) {
          try {
            const directResult = await geminiModel.generateContent(promptPayload);
            content = directResult.response.text();
            if (content) {
              const words = content.split(' ');
              for (const w of words) {
                emitToken(w + ' ');
              }
            }
          } catch (e) {}
        }
      }

      if (content) {
        return { content, provider: 'gemini' };
      }
    } catch (geminiErr) {
      console.warn(`[ChatService Gemini ${modelName}] error:`, geminiErr.message);
    }
  }
  return null;
}

/**
 * Local deterministic answer synthesizer when external LLM APIs are not configured.
 * Extracts key sentences and facts from retrieved context blocks.
 */
function localSynthesizeAnswer(query, chunks) {
  if (!chunks || chunks.length === 0) {
    return 'I could not find relevant college documentation to answer this question. Please reach out to the campus helpdesk.';
  }

  const queryTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(' ').filter((w) => w.length > 2);
  const relevantSentences = [];

  for (const chunk of chunks) {
    const sentences = chunk.content.split(/(?<=[.?!])\s+/);
    for (const sentence of sentences) {
      const cleanSent = sentence.trim();
      if (cleanSent.length < 20) continue;
      const lower = cleanSent.toLowerCase();
      let matchCount = 0;
      for (const term of queryTerms) {
        if (lower.includes(term)) matchCount++;
      }
      if (matchCount > 0) {
        relevantSentences.push({ text: cleanSent, matches: matchCount, source: chunk.documentTitle });
      }
    }
  }

  relevantSentences.sort((a, b) => b.matches - a.matches);
  const selected = relevantSentences.slice(0, 4);

  if (selected.length === 0) {
    return `Based on the verified **${chunks[0].documentTitle}** document:\n\n${chunks[0].content.slice(0, 400)}...\n\n*(For full details, please refer to the cited document.)*`;
  }

  let formatted = `Based on the official **${chunks[0].documentTitle}** records:\n\n`;
  selected.forEach((s) => {
    formatted += `• ${s.text}\n\n`;
  });
  formatted += `*(Information retrieved directly from college documentation.)*`;
  return formatted;
}

/**
 * Sanitize AI model output to ensure no raw SVG, HTML fragments, or model-hallucinated
 * confidence/sources metadata footers are leaked into the natural-language answer text.
 */
function sanitizeAiAnswer(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    // Strip any raw SVG elements or tags
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<\/?(svg|path|g|circle|rect|polygon|line|foreignObject)[^>]*>/gi, '')
    // Strip accidental model-hallucinated confidence badges or source lists (the frontend renders these from metadata)
    .replace(/\n*(\*\*|###\s*)?(Verified\s+College\s+Sources|Confidence\s*Score|Sources\s*Cited)[\s\S]*$/gi, '')
    .trim();
}

/**
 * System prompt for RAG answers - Question-first, concise, scope-aware synthesis
 */
const SYSTEM_PROMPT = `You are CampusMind, the official AI-powered academic assistant for college students and staff.
Your role is to answer student questions accurately, concisely, and helpfully based on the provided College Documents Context.

CORE ANSWERING PRINCIPLES:
1. **Question-First & Concise by Default**:
   - Answer the student's exact question in the FIRST sentence.
   - For simple factual or recommendation questions, provide a concise direct answer (normally 2-5 sentences).
   - Do NOT dump or reproduce the entire document policy when only a small portion is relevant.
   - Do NOT begin with lengthy background introductions about document frameworks.

2. **Question-Scope Control**:
   - **RECOMMENDATION** (e.g., "Should I do an internship?", "Is internship useful?", "Why do an internship?"): Provide a short, direct recommendation (2-4 sentences) based on policy benefits (e.g. practical experience, skill development, academic credits, career opportunities) without assuming personal knowledge of the student.
   - **SINGLE FACT** (e.g., "How many credits are required for B.Tech internship?", "What is the curfew time?"): Give a direct 1-3 sentence factual answer stating the exact figure or requirement.
   - **PROCEDURE** (e.g., "Can I arrange my own internship?", "What do I need to submit?"): State whether it is allowed directly (e.g. "Yes, you can..."), then state the required steps only.
   - **LIST** (e.g., "What are the benefits of an internship?"): Provide a focused list of 3-7 concise bullet points.
   - **DETAILED EXPLANATION** (e.g., "Explain the complete internship policy", "Give full details of...", "Explain everything about..."): Only provide a comprehensive structured breakdown with headings and tables when the student explicitly requests complete details or everything.

3. **Follow-Up & Multi-Turn Context**:
   - In multi-turn conversations, use previous turns to understand context (e.g. if the previous turn discussed internship policy and the user asks "What about credits?", answer specifically regarding internship credits).
   - Answer only the new aspect asked without repeating the previous response.

4. **Factual Grounding & Integrity**:
   - Base all college-specific facts strictly on the provided College Documents Context.
   - If the context does not contain enough information, state clearly that the available college documents do not provide enough information on that topic.
   - NEVER invent college policies, dates, fees, faculty names, or rules.

5. **Clean Output Formatting & NO Metadata**:
   - Output ONLY the natural-language response in clean GitHub-Flavored Markdown.
   - NEVER output confidence scores or percentages (e.g. "93% Confidence").
   - NEVER output source citation lists, source cards, or references at the bottom of your message (e.g. "Verified College Sources (3)"). The frontend UI automatically renders verified citations and confidence badges separately from structured metadata.
   - NEVER output SVG tags, HTML tags, or UI code.
   - Do NOT mention internal retrieval, tools, prompts, agents, model names, or reasoning.`;

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
};

/**
 * Orchestrate RAG answer generation with streaming, multi-turn context, and provider dispatcher
 */
async function processChatMessage({
  userId,
  conversationId = null,
  message,
  category = null,
  department = null,
  collectionName = null,
  language = 'en',
  provider = 'gemini',
}) {
  let io = null;
  try {
    io = getIO();
  } catch (err) {
    // Socket not ready, continue HTTP-only
  }

  // 1. Get or Create Conversation
  let conversation = null;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId });
  }

  if (!conversation) {
    const shortTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;
    conversation = await Conversation.create({
      userId,
      title: shortTitle,
    });
  }

  // 2. Fetch Conversation History (last 6 turns)
  const pastMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  pastMessages.reverse();

  // 3. Save User Message
  const userMessageDoc = await Message.create({
    conversationId: conversation._id,
    role: 'user',
    content: message,
    answerable: true,
  });

  // Track analytics event
  await AnalyticsEvent.create({
    type: 'question_asked',
    userId,
    payload: {
      conversationId: conversation._id,
      query: message,
      category: category || 'All',
      language,
      provider: provider || 'gemini',
    },
  });

  const emitToken = (token) => {
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('chat:token', {
        conversationId: conversation._id,
        token,
      });
    }
  };

  let assistantContent = '';
  let providerUsed = 'fallback';
  let sources = [];
  let topScore = 0.90;
  let isAnswerable = true;

  // 4. Try Agentic RAG Pipeline (AI Agent with searchCollegeDocs tool)
  let agentExecutionSucceeded = false;
  const requestedProvider = (provider || 'groq').toLowerCase().trim();

  if (env.GROQ_API_KEY && (requestedProvider === 'groq' || requestedProvider === 'agent' || requestedProvider === 'gemini')) {
    try {
      console.log(`[ChatService] Delegating request to CampusMind AI Agent...`);
      const agentResult = await agentService.runAgent({
        message,
        pastMessages,
        category,
        language,
        emitToken,
      });

      if (agentResult && agentResult.content) {
        assistantContent = agentResult.content;
        sources = agentResult.sources || [];
        topScore = agentResult.confidenceScore || 0.92;
        isAnswerable = agentResult.answerable !== false;
        providerUsed = agentResult.provider || 'groq';
        agentExecutionSucceeded = true;
      }
    } catch (agentErr) {
      console.warn(`[ChatService] Agent execution failed (${agentErr.message}). Falling back to standard pipeline.`);
    }
  }

  // 5. Standard RAG Fallback Pipeline (if Agent was bypassed or failed)
  if (!agentExecutionSucceeded) {
    console.log(`[ChatService] Executing direct RAG pipeline with provider: ${requestedProvider}`);
    const retrievalResult = await retrievalService.retrieveContext({
      query: message,
      category,
      topK: env.RAG_TOP_K,
      threshold: env.RAG_SIMILARITY_THRESHOLD,
    });

    const { chunks, sources: ragSources, topScore: ragTopScore, answerable: ragAnswerable, contextText } = retrievalResult;
    sources = ragSources;
    topScore = ragTopScore;
    isAnswerable = ragAnswerable;

    const targetLang = LANGUAGE_NAMES[language] || 'English';
    let effectiveSystemPrompt = SYSTEM_PROMPT;
    if (language && language !== 'en') {
      effectiveSystemPrompt += `\n\nLANGUAGE INSTRUCTION: The user has requested their response in ${targetLang}. Please write your entire answer in ${targetLang}, formatting clearly with headers and bullet points while strictly basing all facts on the provided College Documents Context.`;
    }

    if (!isAnswerable || chunks.length === 0) {
      isAnswerable = false;
      providerUsed = 'fallback';
      const deptHint = category && category !== 'All' ? `${category} Department` : 'College Administration';
      
      if (language === 'hi') {
        assistantContent = `कॉलेज के आधिकारिक दस्तावेजों में **"${message}"** के संबंध में पर्याप्त जानकारी उपलब्ध नहीं है।\n\nकृपया सत्यापित जानकारी के लिए सीधे **${deptHint}** या कॉलेज पूछताछ केंद्र से संपर्क करें।`;
      } else if (language === 'mr') {
        assistantContent = `कॉलेजच्या अधिकृत कागदपत्रांमध्ये **"${message}"** बाबत पुरेशी माहिती उपलब्ध नाही.\n\nकृपया अधिक माहितीसाठी थेट **${deptHint}** किंवा कॉलेज माहिती केंद्राशी संपर्क साधा.`;
      } else {
        assistantContent = `I do not have sufficient information in the college documents regarding **"${message}"**.\n\nPlease reach out directly to the **${deptHint}** or visit the campus information desk for verified guidance.`;
      }

      const words = assistantContent.split(' ');
      for (const w of words) {
        emitToken(w + ' ');
        await new Promise((r) => setTimeout(r, 20));
      }

      await AnalyticsEvent.create({
        type: 'unanswered',
        userId,
        payload: {
          conversationId: conversation._id,
          query: message,
          topScore,
          category: category || 'All',
          language,
          provider: requestedProvider,
        },
      });
    } else {
      const historyFormatted = pastMessages
        .map((m) => `${m.role === 'user' ? 'Student' : 'CampusMind'}: ${m.content}`)
        .join('\n');

      const promptPayload = `[COLLEGE DOCUMENTS CONTEXT]:\n${contextText}\n\n[RECENT CHAT HISTORY]:\n${historyFormatted || 'None'}\n\n[STUDENT QUESTION]:\n${message}\n\n[TARGET LANGUAGE]:\n${targetLang}`;

      let generationResult = null;
      const providerMap = {
        groq: generateWithGroq,
        openai: generateWithOpenAI,
        gemini: generateWithGemini,
      };

      if (providerMap[requestedProvider]) {
        generationResult = await providerMap[requestedProvider]({
          systemPrompt: effectiveSystemPrompt,
          promptPayload,
          emitToken,
        });
      }

      if (!generationResult) {
        const fallbackOrder = ['gemini', 'groq', 'openai'].filter((p) => p !== requestedProvider);
        for (const fallbackProvider of fallbackOrder) {
          generationResult = await providerMap[fallbackProvider]({
            systemPrompt: effectiveSystemPrompt,
            promptPayload,
            emitToken,
          });
          if (generationResult) break;
        }
      }

      if (generationResult) {
        assistantContent = generationResult.content;
        providerUsed = generationResult.provider;
      } else {
        providerUsed = 'fallback';
        assistantContent = localSynthesizeAnswer(message, chunks);
        const words = assistantContent.split(' ');
        for (const w of words) {
          emitToken(w + ' ');
          await new Promise((r) => setTimeout(r, 25));
        }
      }
    }
  }

  // Track document citations in analytics
  for (const src of sources) {
    if (src.documentId) {
      await AnalyticsEvent.create({
        type: 'document_cited',
        userId,
        payload: {
          documentId: src.documentId,
          title: src.title,
          category: src.category,
        },
      });
    }
  }

  const cleanAnswer = sanitizeAiAnswer(assistantContent);

  // 7. Persist Assistant Message
  const assistantMessageDoc = await Message.create({
    conversationId: conversation._id,
    role: 'assistant',
    content: cleanAnswer,
    sources: isAnswerable ? sources : [],
    answerable: isAnswerable,
    confidenceScore: topScore,
    provider: providerUsed,
  });

  // Update conversation last message timestamp
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // 8. Emit chat:done event via Socket.IO
  if (io) {
    io.to(`conversation:${conversation._id}`).emit('chat:done', {
      conversationId: conversation._id,
      messageId: assistantMessageDoc._id,
      content: cleanAnswer,
      sources: isAnswerable ? sources : [],
      answerable: isAnswerable,
      confidenceScore: topScore,
      provider: providerUsed,
    });
  }

  return {
    conversationId: conversation._id,
    userMessage: userMessageDoc,
    assistantMessage: assistantMessageDoc,
  };
}

const getConversations = async (userId) => {
  return Conversation.find({ userId }).sort({ lastMessageAt: -1 }).lean();
};

const getConversationById = async (userId, conversationId) => {
  const conversation = await Conversation.findOne({ _id: conversationId, userId }).lean();
  if (!conversation) {
    const err = new Error('Conversation not found.');
    err.statusCode = 404;
    throw err;
  }

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
  return { conversation, messages };
};

const deleteConversation = async (userId, conversationId) => {
  const conversation = await Conversation.findOneAndDelete({ _id: conversationId, userId });
  if (!conversation) {
    const err = new Error('Conversation not found.');
    err.statusCode = 404;
    throw err;
  }
  await Message.deleteMany({ conversationId });
  return { message: 'Conversation deleted successfully.' };
};

module.exports = {
  processChatMessage,
  getConversations,
  getConversationById,
  deleteConversation,
};
