const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    rating: {
      type: String,
      enum: ['up', 'down', 'positive', 'negative'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ messageId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
