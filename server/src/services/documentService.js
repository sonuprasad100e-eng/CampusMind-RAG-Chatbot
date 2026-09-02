const path = require('path');
const fs = require('fs').promises;
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { extractDocumentContent } = require('../utils/documentExtractor');
const { chunkDocumentPages } = require('../utils/chunker');
const embeddingService = require('./embeddingService');
const { getIO } = require('../config/socket');

const emitAdminEvent = (eventName, data) => {
  try {
    const io = getIO();
    if (io) {
      io.to('admin-room').emit(eventName, data);
      io.emit(eventName, data); // Also broadcast to general admin listeners
    }
  } catch (err) {
    // Socket might not be initialized
  }
};

/**
 * Execute document ingestion pipeline:
 * Extract text -> Chunk -> Generate Embeddings -> Save Chunks -> Set READY
 */
async function processDocumentIngestion(documentId) {
  const doc = await Document.findById(documentId);
  if (!doc) {
    throw new Error(`Document ${documentId} not found`);
  }

  try {
    // 1. Mark status as PROCESSING
    doc.status = 'PROCESSING';
    doc.errorReason = null;
    await doc.save();
    emitAdminEvent('document:processing', { documentId: doc._id, status: 'PROCESSING', title: doc.title });

    // 2. Extract content
    const pages = await extractDocumentContent(doc.originalFileUrl, doc.fileType);
    if (!pages || pages.length === 0) {
      throw new Error('No readable text content could be extracted from this document.');
    }

    // 3. Recursive chunking
    const chunks = chunkDocumentPages(pages, 800, 150);
    if (chunks.length === 0) {
      throw new Error('Extracted text was insufficient to generate document chunks.');
    }

    // 4. Remove any existing chunks for this document (e.g. on reprocess)
    await DocumentChunk.deleteMany({ documentId: doc._id });

    // 5. Generate embeddings for each chunk
    const chunkDocs = [];
    for (const chunk of chunks) {
      const { vector } = await embeddingService.generateEmbedding(chunk.content);
      chunkDocs.push({
        documentId: doc._id,
        content: chunk.content,
        embedding: vector,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        category: doc.category,
      });
    }

    // 6. Bulk insert chunks
    await DocumentChunk.insertMany(chunkDocs);

    // 7. Update document status to READY
    doc.status = 'READY';
    doc.chunkCount = chunkDocs.length;
    doc.version = (doc.version || 1) + 1;
    await doc.save();

    emitAdminEvent('document:ready', {
      documentId: doc._id,
      status: 'READY',
      chunkCount: doc.chunkCount,
      title: doc.title,
    });

    console.log(`[DocumentService] Ingestion complete for "${doc.title}" (${doc.chunkCount} chunks)`);
    return doc;
  } catch (err) {
    console.error(`[DocumentService] Ingestion failed for "${doc.title}":`, err.message);
    doc.status = 'FAILED';
    doc.errorReason = err.message;
    await doc.save();

    emitAdminEvent('document:failed', {
      documentId: doc._id,
      status: 'FAILED',
      error: err.message,
      title: doc.title,
    });
    throw err;
  }
}

/**
 * Create document records and trigger ingestion
 */
async function createAndIngestDocument({
  title,
  category,
  filePath,
  fileName,
  fileType,
  fileSize,
  uploadedBy,
}) {
  const doc = await Document.create({
    title,
    category,
    originalFileUrl: filePath,
    fileName,
    fileType: fileType.toLowerCase(),
    fileSize,
    uploadedBy,
    status: 'UPLOADED',
  });

  // Run ingestion pipeline
  try {
    await processDocumentIngestion(doc._id);
  } catch (ingestErr) {
    console.warn(`[DocumentService] Async ingestion encountered error: ${ingestErr.message}`);
  }

  return Document.findById(doc._id).populate('uploadedBy', 'name email');
}

/**
 * List documents with filtering and search
 */
async function listDocuments({ category, status, search, page = 1, limit = 50 }) {
  const filter = {};
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (status && status !== 'All') {
    filter.status = status;
  }
  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(filter),
  ]);

  return {
    documents,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Reprocess an existing document
 */
async function reprocessDocument(documentId) {
  const doc = await Document.findById(documentId);
  if (!doc) {
    const err = new Error('Document not found');
    err.statusCode = 404;
    throw err;
  }

  await processDocumentIngestion(doc._id);
  return Document.findById(doc._id).populate('uploadedBy', 'name email');
}

/**
 * Delete a document and its chunks & physical file
 */
async function deleteDocument(documentId) {
  const doc = await Document.findById(documentId);
  if (!doc) {
    const err = new Error('Document not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete chunks
  await DocumentChunk.deleteMany({ documentId: doc._id });

  // Delete file on disk if exists
  try {
    if (doc.originalFileUrl) {
      await fs.unlink(doc.originalFileUrl).catch(() => {});
    }
  } catch (err) {
    console.warn('[DocumentService] File cleanup error:', err.message);
  }

  // Delete document
  await Document.findByIdAndDelete(doc._id);
  return { message: 'Document and its vector chunks deleted successfully.' };
}

/**
 * Get single document status
 */
async function getDocumentStatus(documentId) {
  const doc = await Document.findById(documentId).select('status chunkCount errorReason title category').lean();
  if (!doc) {
    const err = new Error('Document not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
}

module.exports = {
  createAndIngestDocument,
  processDocumentIngestion,
  listDocuments,
  reprocessDocument,
  deleteDocument,
  getDocumentStatus,
};
