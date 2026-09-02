const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Chunk content is required'],
    },
    embedding: {
      type: [Number],
      required: true,
      select: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
