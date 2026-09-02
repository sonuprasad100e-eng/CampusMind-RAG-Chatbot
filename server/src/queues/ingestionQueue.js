const env = require('../config/env');
let documentQueue = null;

// Initialize BullMQ if Redis is explicitly enabled / available
try {
  if (env.REDIS_HOST && process.env.ENABLE_REDIS_QUEUE === 'true') {
    const { Queue, Worker } = require('bullmq');
    const Redis = require('ioredis');

    const redisConnection = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

    documentQueue = new Queue('document-ingestion', { connection: redisConnection });

    const worker = new Worker(
      'document-ingestion',
      async (job) => {
        const { documentId } = job.data;
        const documentService = require('../services/documentService');
        await documentService.processDocumentIngestion(documentId);
      },
      { connection: redisConnection }
    );

    worker.on('completed', (job) => {
      console.log(`[IngestionQueue] Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[IngestionQueue] Job ${job.id} failed:`, err.message);
    });

    console.log('[IngestionQueue] BullMQ Redis Queue initialized.');
  } else {
    console.log('[IngestionQueue] Redis not enabled. Using Synchronous In-Process Ingestion pipeline.');
  }
} catch (err) {
  console.warn('[IngestionQueue] Failed to initialize BullMQ. Falling back to Synchronous In-Process pipeline:', err.message);
}

const addIngestionJob = async (documentId) => {
  if (documentQueue) {
    await documentQueue.add('process-document', { documentId });
  } else {
    // Synchronous in-process execution
    const documentService = require('../services/documentService');
    // Run in background without blocking current request
    setImmediate(async () => {
      try {
        await documentService.processDocumentIngestion(documentId);
      } catch (err) {
        console.error(`[IngestionQueue:Fallback] Ingestion failed for ${documentId}:`, err.message);
      }
    });
  }
};

module.exports = {
  addIngestionJob,
};
