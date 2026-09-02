const Feedback = require('../models/Feedback');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const submitFeedback = async ({ messageId, userId, rating, feedback: altRating, comment, reason }) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const err = new Error('Message not found.');
    err.statusCode = 404;
    throw err;
  }

  // Security: Verify that the conversation belongs to the authenticated user
  const conversation = await Conversation.findOne({ _id: message.conversationId, userId });
  if (!conversation) {
    const err = new Error('Unauthorized. You can only submit feedback for messages in your own conversations.');
    err.statusCode = 403;
    throw err;
  }

  // Normalize rating ('positive' -> 'up', 'negative' -> 'down')
  const rawRating = (rating || altRating || '').toLowerCase().trim();
  let normalizedRating = 'up';
  if (rawRating === 'down' || rawRating === 'negative') {
    normalizedRating = 'down';
  } else if (rawRating === 'up' || rawRating === 'positive') {
    normalizedRating = 'up';
  }

  const feedbackDoc = await Feedback.findOneAndUpdate(
    { messageId, userId },
    {
      rating: normalizedRating,
      comment: comment || reason || '',
      conversationId: message.conversationId,
    },
    { new: true, upsert: true, runValidators: true }
  );

  return feedbackDoc;
};

const getFeedbackSummary = async () => {
  const [upCount, downCount, recentFeedbacks] = await Promise.all([
    Feedback.countDocuments({ rating: 'up' }),
    Feedback.countDocuments({ rating: 'down' }),
    Feedback.find()
      .populate('userId', 'name email')
      .populate('messageId', 'content role')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const total = upCount + downCount;
  const positiveRate = total > 0 ? Math.round((upCount / total) * 100) : 100;

  return {
    total,
    upCount,
    downCount,
    positiveRate,
    recentFeedbacks,
  };
};

module.exports = {
  submitFeedback,
  getFeedbackSummary,
};
