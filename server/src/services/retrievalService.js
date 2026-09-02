const DocumentChunk = require('../models/DocumentChunk');
const Document = require('../models/Document');
const embeddingService = require('./embeddingService');
const { cosineSimilarity } = require('../utils/vectorMath');
const env = require('../config/env');

/**
 * Calculates keyword relevance score (BM25-style term frequency + exact phrase matching).
 * Returns normalized score between 0.0 and 1.0.
 */
function stemTerm(term) {
  if (!term || term.length <= 3) return term;
  return term
    .replace(/(?:ations?|tions?|sions?)$/, '')
    .replace(/(?:ing|ies|es|ed|s)$/, '')
    .replace(/(?:al|ic|ive)$/, '');
}

/**
 * Calculates keyword relevance score (BM25-style term frequency + exact phrase matching + stemming).
 * Returns normalized score between 0.0 and 1.0.
 */
function calculateKeywordScore(query, content, docTitle = '') {
  if (!query || (!content && !docTitle)) return 0;

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for',
    'of', 'with', 'by', 'what', 'are', 'how', 'when', 'where', 'who', 'does',
    'can', 'about', 'tell', 'me', 'please', 'give', 'list', 'explain', 'show',
  ]);

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  if (queryTerms.length === 0) return 0.2;

  const fullText = `${docTitle} ${docTitle} ${content}`.toLowerCase();
  let matches = 0;
  let termFrequencySum = 0;

  // Exact phrase match bonus
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  let exactPhraseBonus = 0;
  if (cleanQuery.length > 5 && fullText.includes(cleanQuery)) {
    exactPhraseBonus = 0.4;
  }

  for (const term of queryTerms) {
    const stem = stemTerm(term);
    const termRegex = new RegExp(`\\b${term}`, 'i');
    const stemRegex = stem.length >= 3 ? new RegExp(`\\b${stem}`, 'i') : null;

    if (termRegex.test(fullText)) {
      matches++;
      const occurrences = (fullText.match(new RegExp(term, 'gi')) || []).length;
      termFrequencySum += Math.min(occurrences, 6);
    } else if (stemRegex && stemRegex.test(fullText)) {
      matches += 0.85;
      const occurrences = (fullText.match(new RegExp(stem, 'gi')) || []).length;
      termFrequencySum += Math.min(occurrences, 4);
    } else if (fullText.includes(term)) {
      matches += 0.6;
    }
  }

  const coverageRatio = matches / queryTerms.length;
  const frequencyBoost = Math.min(0.25, (termFrequencySum / (queryTerms.length * 6)) * 0.25);

  return Math.min(1.0, coverageRatio * 0.7 + frequencyBoost + exactPhraseBonus);
}

/**
 * Perform Hybrid Vector Search (Semantic Vector Embeddings + Keyword Matching)
 */
async function retrieveContext({
  query,
  category = null,
  topK = env.RAG_TOP_K,
  threshold = env.RAG_SIMILARITY_THRESHOLD,
}) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) {
    return {
      chunks: [],
      sources: [],
      topScore: 0,
      answerable: false,
      contextText: '',
      provider: 'none',
    };
  }

  // 1. Generate query embedding vector
  const { vector: queryVector, provider: embeddingProvider } = await embeddingService.generateEmbedding(cleanQuery);

  let scoredChunks = [];

  // 2. Load candidate chunks with embeddings & populated document details
  const filter = {};
  if (category && category !== 'All') {
    filter.category = category;
  }

  const allChunks = await DocumentChunk.find(filter)
    .select('+embedding documentId content pageNumber chunkIndex category')
    .populate({
      path: 'documentId',
      select: 'title category originalFileUrl fileName status',
      match: { status: 'READY' },
    })
    .lean();

  // 3. Compute Hybrid Score for each chunk
  for (const chunk of allChunks) {
    if (!chunk.documentId) continue; // Skip orphaned or non-ready docs

    const rawVectorScore = cosineSimilarity(queryVector, chunk.embedding);
    const keywordScore = calculateKeywordScore(cleanQuery, chunk.content, chunk.documentId.title);

    let finalScore = 0;
    if (embeddingProvider === 'fallback') {
      // Local calibrated dense hybrid engine
      const scaledVector = Math.min(1.0, Math.max(0.0, (rawVectorScore / 0.16) * 0.70));
      const rawHybrid = scaledVector * 0.5 + keywordScore * 0.5;
      
      // Calibrate so relevant matches map smoothly between 0.75 - 0.98
      if (rawHybrid >= 0.35 || keywordScore >= 0.5) {
        finalScore = Math.min(0.98, 0.75 + (rawHybrid - 0.35) * 0.4);
      } else {
        finalScore = Math.min(0.55, rawHybrid * 1.2);
      }
    } else {
      // Direct API embeddings (OpenAI / Gemini)
      const baseScore = rawVectorScore * 0.65 + keywordScore * 0.35;
      if (rawVectorScore >= 0.52 || (rawVectorScore >= 0.42 && keywordScore >= 0.35)) {
        finalScore = Math.min(0.98, Math.max(0.76, baseScore * 1.18));
      } else {
        finalScore = baseScore;
      }
    }

    scoredChunks.push({
      _id: chunk._id,
      documentId: chunk.documentId._id,
      document: chunk.documentId,
      documentTitle: chunk.documentId.title,
      documentCategory: chunk.documentId.category,
      originalFileUrl: chunk.documentId.originalFileUrl,
      fileName: chunk.documentId.fileName,
      content: chunk.content,
      pageNumber: chunk.pageNumber || 1,
      chunkIndex: chunk.chunkIndex,
      category: chunk.category,
      keywordScore: parseFloat(keywordScore.toFixed(4)),
      score: parseFloat(finalScore.toFixed(4)),
    });
  }

  // Sort descending by hybrid score
  scoredChunks.sort((a, b) => b.score - a.score);

  // 4. Extract Top-K Results
  const populatedChunks = scoredChunks.slice(0, topK);
  const topScore = populatedChunks.length > 0 ? populatedChunks[0].score : 0;

  // Determine answerability
  const isAnswerable = populatedChunks.length > 0 && topScore >= threshold;

  // 5. Build deduplicated sources list
  const sourceMap = new Map();
  for (const c of populatedChunks) {
    const key = `${c.documentId}-${c.pageNumber}`;
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        documentId: c.documentId,
        title: c.documentTitle,
        category: c.category || c.documentCategory,
        pageNumber: c.pageNumber,
        score: c.score,
        fileName: c.fileName,
        originalFileUrl: c.originalFileUrl,
      });
    }
  }
  const sources = Array.from(sourceMap.values());

  // 6. Assemble context block for LLM
  let contextText = '';
  if (populatedChunks.length > 0) {
    contextText = populatedChunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: "${c.documentTitle}" (Category: ${c.category}, Page: ${c.pageNumber})]\n${c.content}`
      )
      .join('\n\n---\n\n');
  }

  return {
    chunks: populatedChunks,
    sources,
    topScore,
    answerable: isAnswerable,
    contextText,
    provider: embeddingProvider,
  };
}

module.exports = {
  retrieveContext,
  calculateKeywordScore,
};
