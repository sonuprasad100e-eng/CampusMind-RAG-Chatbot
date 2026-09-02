const { connectDB, disconnectDB } = require('../config/db');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const retrievalService = require('../services/retrievalService');

async function diagnose() {
  try {
    await connectDB();
    const docs = await Document.find().lean();
    console.log(`\n=== DOCUMENTS IN DATABASE (${docs.length}) ===`);
    docs.forEach((d) => {
      console.log(`ID: ${d._id} | Status: ${d.status} | Category: ${d.category} | Chunks: ${d.chunkCount} | Title: "${d.title}" | File: ${d.fileName}`);
      if (d.errorReason) {
        console.log(`  -> Error Reason: ${d.errorReason}`);
      }
    });

    const totalChunks = await DocumentChunk.countDocuments();
    console.log(`\nTotal DocumentChunks in DB: ${totalChunks}`);

    // Check chunks content for 'minor' or 'track'
    const matchingChunks = await DocumentChunk.find({
      content: { $regex: 'minor|track', $options: 'i' },
    }).lean();
    console.log(`Chunks containing 'minor' or 'track': ${matchingChunks.length}`);
    matchingChunks.forEach((c, idx) => {
      console.log(`\n[Match ${idx + 1}] Category: ${c.category} | Page: ${c.pageNumber}`);
      console.log(c.content.slice(0, 300) + '...');
    });

    // Test query retrieval
    const query = 'what are the minor track';
    console.log(`\n=== TESTING RETRIEVAL FOR: "${query}" ===`);
    const ret = await retrievalService.retrieveContext({ query });
    console.log(`Top Score: ${ret.topScore}`);
    console.log(`Answerable: ${ret.answerable}`);
    console.log(`Chunks Returned: ${ret.chunks.length}`);
    ret.chunks.forEach((c, i) => {
      console.log(`\nChunk #${i + 1}: [${c.documentTitle}] Score: ${c.score}`);
      console.log(c.content.slice(0, 200) + '...');
    });
  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

diagnose();
