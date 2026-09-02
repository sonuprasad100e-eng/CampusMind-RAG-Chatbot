const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['question_asked', 'unanswered', 'document_cited'],
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

analyticsEventSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
