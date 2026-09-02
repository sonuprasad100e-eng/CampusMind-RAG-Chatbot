const retrievalService = require('./retrievalService');
const env = require('../config/env');

let groqClient = null;

// Initialize Groq client for Agentic Tool-Calling
if (env.GROQ_API_KEY) {
  try {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  } catch (err) {
    console.warn('[AgentService] Groq client init failed:', err.message);
  }
}

/**
 * Maximum tool-calling iterations to prevent infinite agent loops
 */
const MAX_AGENT_ITERATIONS = 3;

/**
 * Tool Definition Schema (OpenAI / Groq function-calling standard)
 */
const SEARCH_COLLEGE_DOCS_TOOL = {
  type: 'function',
  function: {
    name: 'searchCollegeDocs',
    description:
      'Search the official college knowledge base for verified college policies, regulations, syllabus, fee structures, hostel rules, curfew timings, admissions, exam schedules, and placement statistics.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The search query to retrieve relevant college documents for (e.g. "hostel curfew timings on weekends", "refund policy on admission cancellation", "minimum attendance required for exams").',
        },
        category: {
          type: 'string',
          description:
            'Optional category filter (e.g. "Admissions", "Fees", "Hostel", "Exams", "Placements", "Scholarships", "Policies", "All").',
        },
      },
      required: ['query'],
    },
  },
};

/**
 * Execute the searchCollegeDocs tool by reusing the existing retrievalService
 */
async function executeSearchCollegeDocs({ query, category = null }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      success: false,
      error: 'Query parameter is required and cannot be empty.',
      chunks: [],
      sources: [],
      contextText: '',
      topScore: 0,
      answerable: false,
    };
  }

  const cleanQuery = query.trim();
  console.log(`[Agent Tool] Executing searchCollegeDocs for query: "${cleanQuery}" (Category: ${category || 'All'})`);

  try {
    const retrievalResult = await retrievalService.retrieveContext({
      query: cleanQuery,
      category: category && category !== 'All' ? category : null,
      topK: env.RAG_TOP_K,
      threshold: env.RAG_SIMILARITY_THRESHOLD,
    });

    console.log(
      `[Agent Tool] Retrieved ${retrievalResult.chunks.length} chunks from ${retrievalResult.sources.length} sources (Top Score: ${retrievalResult.topScore})`
    );

    return {
      success: true,
      query: cleanQuery,
      answerable: retrievalResult.answerable,
      topScore: retrievalResult.topScore,
      sources: retrievalResult.sources,
      contextText: retrievalResult.contextText,
      chunksCount: retrievalResult.chunks.length,
    };
  } catch (err) {
    console.error(`[Agent Tool Error] searchCollegeDocs failed:`, err.message);
    return {
      success: false,
      error: err.message,
      chunks: [],
      sources: [],
      contextText: '',
      topScore: 0,
      answerable: false,
    };
  }
}

/**
 * System prompt instructing the Agent on question-first, concise, scope-aware synthesis
 */
const AGENT_SYSTEM_PROMPT = `You are CampusMind, the official AI Agent and academic assistant for college students and staff.
You have access to the searchCollegeDocs tool to search verified college documents, handbooks, rules, and records.

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
   - Base all college-specific facts strictly on the context returned by searchCollegeDocs.
   - If the retrieved context does not contain enough information, state clearly that the available college documents do not provide enough information on that topic.
   - NEVER invent college policies, dates, fees, faculty names, or rules.

5. **Clean Output Formatting**:
   - Output ONLY the natural-language response in clean GitHub-Flavored Markdown.
   - NEVER output confidence scores, percentages (e.g. "93% Confidence"), citation cards, SVG tags, HTML tags, or UI markup in your text (the frontend automatically renders citations and confidence badges from metadata).
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
 * Main Agent Orchestrator loop
 * Decides whether to invoke searchCollegeDocs tool, executes it, and streams the final grounded answer.
 */
async function runAgent({
  message,
  pastMessages = [],
  category = null,
  language = 'en',
  emitToken = () => {},
}) {
  if (!groqClient || !env.GROQ_API_KEY) {
    console.warn('[Agent] Groq API key not configured. Bypassing agent to standard provider.');
    return null;
  }

  console.log(`[Agent] Received user query: "${message}"`);

  const targetLang = LANGUAGE_NAMES[language] || 'English';
  let effectiveSystemPrompt = AGENT_SYSTEM_PROMPT;
  if (language && language !== 'en') {
    effectiveSystemPrompt += `\n\nLANGUAGE INSTRUCTION: The user has requested their response in ${targetLang}. Please write your entire final answer in ${targetLang}, formatting clearly with headers and bullet points while strictly basing all facts on the retrieved College Documents Context.`;
  }

  // Build message history for the Agent
  const agentMessages = [{ role: 'system', content: effectiveSystemPrompt }];

  // Include recent conversation turns
  for (const m of pastMessages) {
    if (m.role === 'user' || m.role === 'assistant') {
      agentMessages.push({
        role: m.role,
        content: m.content || '',
      });
    }
  }

  // Append current user message
  agentMessages.push({
    role: 'user',
    content: category && category !== 'All' ? `[Category: ${category}] ${message}` : message,
  });

  const candidateModels = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'llama-3.3-70b-versatile',
  ];

  let collectedSources = [];
  let highestConfidence = 0.92;
  let isAnswerable = true;
  let toolWasCalled = false;
  let finalAnswerContent = '';

  for (const model of candidateModels) {
    try {
      let iteration = 0;
      let finished = false;

      while (iteration < MAX_AGENT_ITERATIONS && !finished) {
        iteration++;
        console.log(`[Agent Loop] Iteration ${iteration}/${MAX_AGENT_ITERATIONS} with model: ${model}`);

        // Step 1: Query Agent (allows tool calls)
        const response = await groqClient.chat.completions.create({
          model,
          messages: agentMessages,
          tools: [SEARCH_COLLEGE_DOCS_TOOL],
          tool_choice: 'auto',
          temperature: 0.2,
        });

        const choice = response.choices[0];
        const responseMessage = choice?.message;

        if (!responseMessage) {
          throw new Error('Empty response message received from Agent model.');
        }

        // Check if Agent decided to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          toolWasCalled = true;
          agentMessages.push(responseMessage); // Add assistant's tool-call intent to history

          for (const toolCall of responseMessage.tool_calls) {
            if (toolCall.function.name === 'searchCollegeDocs') {
              let parsedArgs = {};
              try {
                parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
              } catch (e) {
                parsedArgs = { query: message };
              }

              const queryToSearch = parsedArgs.query || message;
              const categoryToSearch = parsedArgs.category || category;

              console.log(`[Agent] Calling searchCollegeDocs for: "${queryToSearch}"`);
              const toolResult = await executeSearchCollegeDocs({
                query: queryToSearch,
                category: categoryToSearch,
              });

              if (toolResult.sources && toolResult.sources.length > 0) {
                collectedSources = toolResult.sources;
                highestConfidence = toolResult.topScore || 0.90;
                isAnswerable = toolResult.answerable !== false;
              } else {
                highestConfidence = toolResult.topScore || 0;
                isAnswerable = false;
              }

              // Return tool result to Agent message history
              agentMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: toolResult.success,
                  query: toolResult.query,
                  answerable: toolResult.answerable,
                  topScore: toolResult.topScore,
                  context: toolResult.contextText || 'No relevant college documents found.',
                  sourcesCount: toolResult.sources?.length || 0,
                  instruction:
                    'Answer the user\'s exact question in the first sentence. Be concise (2-5 sentences for simple questions). Extract only facts directly answering the question. Do not dump the entire document.',
                }),
              });
            }
          }

          // Step 2: Now stream the final grounded answer to the user
          console.log(`[Agent] Generating and streaming final answer with model: ${model}`);
          const stream = await groqClient.chat.completions.create({
            model,
            messages: agentMessages,
            stream: true,
            temperature: 0.2,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              finalAnswerContent += delta;
              emitToken(delta);
            }
          }

          finished = true;
          break;
        } else {
          // Agent answered directly (e.g. greeting or general query)
          const directContent = responseMessage.content || '';
          if (directContent) {
            finalAnswerContent = directContent;
            // Emit tokens with readable cadence
            const words = directContent.split(' ');
            for (const w of words) {
              emitToken(w + ' ');
              await new Promise((r) => setTimeout(r, 15));
            }
          }
          finished = true;
          break;
        }
      }

      if (finalAnswerContent) {
        console.log(`[Agent] Completed successfully with ${collectedSources.length} sources.`);
        return {
          content: finalAnswerContent,
          sources: collectedSources,
          confidenceScore: highestConfidence,
          answerable: isAnswerable,
          provider: 'groq',
          toolUsed: toolWasCalled ? 'searchCollegeDocs' : 'none',
        };
      }
    } catch (modelErr) {
      console.warn(`[Agent Model ${model}] failed:`, modelErr.message);
      finalAnswerContent = '';
    }
  }

  console.warn('[Agent] All Groq agent models exhausted. Returning null for graceful fallback.');
  return null;
}

module.exports = {
  runAgent,
  executeSearchCollegeDocs,
  SEARCH_COLLEGE_DOCS_TOOL,
};
