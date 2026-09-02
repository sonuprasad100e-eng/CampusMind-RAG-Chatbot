const env = require('../config/env');
const { generateLocalEmbedding } = require('../utils/vectorMath');

let openaiClient = null;
let googleAI = null;

// Initialize OpenAI client if API key is provided
if (env.OPENAI_API_KEY) {
  try {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  } catch (err) {
    console.warn('[EmbeddingService] OpenAI init failed:', err.message);
  }
}

// Initialize Gemini client if API key is provided
if (env.GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    googleAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  } catch (err) {
    console.warn('[EmbeddingService] Gemini init failed:', err.message);
  }
}

/**
 * Generate embedding vector for a single text chunk or query.
 * Fallback chain: OpenAI text-embedding-3-small -> Gemini text-embedding-004 -> Local Dense Feature Vector
 */
async function generateEmbedding(text) {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    return {
      vector: generateLocalEmbedding(''),
      provider: 'fallback',
      dimensions: 768,
    };
  }

  // 1. Primary: OpenAI
  if (openaiClient && env.OPENAI_API_KEY) {
    try {
      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanText,
        encoding_format: 'float',
      });
      if (response?.data?.[0]?.embedding) {
        return {
          vector: response.data[0].embedding,
          provider: 'openai',
          dimensions: response.data[0].embedding.length,
        };
      }
    } catch (err) {
      console.warn(`[EmbeddingService] OpenAI embedding failed (${err.message}). Trying Gemini fallback.`);
    }
  }

  // 2. Secondary Fallback: Google Gemini
  if (googleAI && env.GEMINI_API_KEY) {
    const embeddingModels = ['gemini-embedding-001', 'text-embedding-004', 'embedding-001'];
    for (const modelName of embeddingModels) {
      try {
        const model = googleAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(cleanText);
        if (result?.embedding?.values) {
          return {
            vector: result.embedding.values,
            provider: 'gemini',
            dimensions: result.embedding.values.length,
          };
        }
      } catch (err) {
        // Try next model candidate
      }
    }
  }

  // 3. Offline / Dev Fallback: Local deterministic dense semantic vector
  return {
    vector: generateLocalEmbedding(cleanText, 768),
    provider: 'fallback',
    dimensions: 768,
  };
}

/**
 * Batch generate embeddings for multiple texts
 */
async function generateBatchEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    const res = await generateEmbedding(text);
    results.push(res);
  }
  return results;
}

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
};
