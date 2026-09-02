const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    score: {
      type: Number,
      default: 0,
    },
    fileName: {
      type: String,
    },
    originalFileUrl: {
      type: String,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
    answerable: {
      type: Boolean,
      default: true,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
    provider: {
      type: String,
      enum: ['gemini', 'openai', 'groq', 'openrouter', 'fallback'],
      default: 'fallback',
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
