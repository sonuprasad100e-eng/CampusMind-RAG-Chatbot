/**
 * Vector Math & Local Deterministic Semantic Embedding Engine
 */

/**
 * Calculates cosine similarity between two float vectors.
 * Returns value between -1.0 and 1.0 (or 0.0 to 1.0 for normalized positive vectors).
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalizes vector to unit length
 */
function normalizeVector(vec) {
  let sumSquares = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSquares += vec[i] * vec[i];
  }
  const magnitude = Math.sqrt(sumSquares);
  if (magnitude === 0) return vec;
  return vec.map((v) => v / magnitude);
}

/**
 * Fast string hash helper (Murmur-like 32-bit hash)
 */
function hashString(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Generate a dense 768-dimensional local semantic feature embedding.
 * Uses character & word n-grams with subword projection and position weighting.
 * Ensures consistent semantic similarity without requiring external APIs for local testing.
 */
function generateLocalEmbedding(text, dimensions = 768) {
  if (!text || typeof text !== 'string') {
    return new Array(dimensions).fill(0);
  }

  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleanText.split(' ').filter(Boolean);
  const vector = new Array(dimensions).fill(0);

  if (tokens.length === 0) {
    return vector;
  }

  // Common stop words down-weighting
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of', 'with', 'by']);

  // Word unigrams, bigrams, and character trigrams
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const isStop = stopWords.has(word);
    const weight = isStop ? 0.3 : 1.0;

    // Word embedding projection
    for (let k = 0; k < 5; k++) {
      const h = hashString(word, k * 17);
      const index = Math.abs(h) % dimensions;
      const sign = (h >>> 31) === 1 ? -1 : 1;
      vector[index] += sign * weight * 1.5;
    }

    // Bigrams
    if (i < tokens.length - 1) {
      const bigram = `${word}_${tokens[i + 1]}`;
      for (let k = 0; k < 3; k++) {
        const h = hashString(bigram, k * 31);
        const index = Math.abs(h) % dimensions;
        const sign = (h >>> 31) === 1 ? -1 : 1;
        vector[index] += sign * 1.8;
      }
    }

    // Character subword trigrams
    if (word.length >= 3) {
      for (let c = 0; c <= word.length - 3; c++) {
        const trigram = word.substring(c, c + 3);
        const h = hashString(trigram, 77);
        const index = Math.abs(h) % dimensions;
        const sign = (h >>> 31) === 1 ? -1 : 1;
        vector[index] += sign * 0.4;
      }
    }
  }

  return normalizeVector(vector);
}

module.exports = {
  cosineSimilarity,
  normalizeVector,
  generateLocalEmbedding,
};
