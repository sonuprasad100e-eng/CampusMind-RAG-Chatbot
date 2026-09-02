const { GoogleGenerativeAI } = require('@google/generative-ai');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const env = require('../config/env');

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

const withTimeout = (promise, ms = 3000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM call timed out')), ms)),
  ]);
};

/**
 * Generate structured executive summary for an uploaded document
 */
exports.generateDocumentSummary = async (documentId) => {
  const doc = await Document.findById(documentId);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Fetch top chunks for this document
  const chunks = await DocumentChunk.find({ documentId }).limit(10).sort({ chunkIndex: 1 });
  if (!chunks || chunks.length === 0) {
    throw new Error('No chunk content found for this document.');
  }

  const combinedContent = chunks.map((c) => c.content).join('\n\n');

  if (!genAI) {
    // Fallback summary
    const summary = `Executive Summary for ${doc.title} (${doc.category}): Covers official campus regulations, procedures, and criteria based on ${chunks.length} key sections.`;
    doc.summary = summary;
    await doc.save();
    return summary;
  }

  let summary = '';
  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `You are an academic administrator at CampusMind University.
Analyze the following excerpts from the official college document "${doc.title}" (Category: ${doc.category}):

---
${combinedContent.slice(0, 10000)}
---

Generate a concise, highly structured Executive Summary (maximum 200 words) using Markdown with bullet points:
- **Core Purpose & Overview**
- **Key Policies / Deadlines / Highlights**
- **Target Audience & Requirements**`;

      const result = await withTimeout(model.generateContent(prompt), 3500);
      summary = result.response.text().trim();
      if (summary) break;
    } catch (e) {
      // Try next model or fallback
    }
  }

  if (!summary) {
    summary = `Executive Summary for ${doc.title} (${doc.category}): Covers official campus regulations, criteria, and departmental procedures based on ${chunks.length} analyzed sections.`;
  }

  doc.summary = summary;
  await doc.save();
  return summary;
};

/**
 * Generate 3-5 Student FAQs with answers based on the document content
 */
exports.generateDocumentFAQs = async (documentId) => {
  const doc = await Document.findById(documentId);
  if (!doc) {
    throw new Error('Document not found');
  }

  const chunks = await DocumentChunk.find({ documentId }).limit(10).sort({ chunkIndex: 1 });
  if (!chunks || chunks.length === 0) {
    throw new Error('No chunk content found for this document.');
  }

  const combinedContent = chunks.map((c) => c.content).join('\n\n');

  if (!genAI) {
    const fallbackFaqs = [
      {
        question: `What is the main purpose of ${doc.title}?`,
        answer: `It outlines the official ${doc.category} policies, rules, and procedures.`,
      },
    ];
    doc.faqs = fallbackFaqs;
    await doc.save();
    return fallbackFaqs;
  }

  let faqs = [];
  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `You are a college assistant. Read these excerpts from "${doc.title}" (${doc.category}):
---
${combinedContent.slice(0, 10000)}
---

Generate 3 to 5 realistic Frequently Asked Questions (FAQs) that students commonly ask, with clear, grounded answers strictly derived from the text.
Output a JSON array of objects with "question" and "answer" properties:
[
  { "question": "...", "answer": "..." }
]`;

      const result = await withTimeout(model.generateContent(prompt), 3500);
      const text = result.response.text().trim();
      faqs = JSON.parse(text);
      if (Array.isArray(faqs) && faqs.length > 0) break;
    } catch (e) {
      // Try next model or fallback
    }
  }

  if (!Array.isArray(faqs) || faqs.length === 0) {
    faqs = [
      {
        question: `What are the key details in ${doc.title}?`,
        answer: `Covers official guidelines, criteria, and administrative regulations for ${doc.category}.`,
      },
    ];
  }

  doc.faqs = faqs;
  await doc.save();
  return faqs;
};

/**
 * Get all FAQs across all ingested documents for the student FAQ portal
 */
exports.getAllCampusFAQs = async () => {
  const docs = await Document.find({ status: 'READY', 'faqs.0': { $exists: true } })
    .select('title category department faqs')
    .sort({ category: 1 });

  const faqList = [];
  docs.forEach((d) => {
    (d.faqs || []).forEach((f) => {
      faqList.push({
        id: f._id,
        documentId: d._id,
        documentTitle: d.title,
        category: d.category,
        department: d.department,
        question: f.question,
        answer: f.answer,
      });
    });
  });

  return faqList;
};
