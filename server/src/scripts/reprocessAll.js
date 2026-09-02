const { connectDB, disconnectDB } = require('../config/db');
require('../models/User');
const Document = require('../models/Document');
const documentService = require('../services/documentService');

async function reprocessAll() {
  try {
    await connectDB();
    const docs = await Document.find();
    console.log(`[Reprocess] Found ${docs.length} documents to reprocess with enhanced spacing & chunking.`);

    for (const doc of docs) {
      console.log(`[Reprocess] Reprocessing "${doc.title}" (${doc.fileName})...`);
      await documentService.reprocessDocument(doc._id);
      console.log(`✅ Reprocessed "${doc.title}" -> ${doc.chunkCount} chunks.`);
    }

    console.log('\n[Reprocess] All documents updated successfully.');
  } catch (err) {
    console.error('Reprocess failed:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

reprocessAll();
