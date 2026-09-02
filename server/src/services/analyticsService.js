const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const Message = require('../models/Message');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const feedbackService = require('./feedbackService');

const getOverviewStats = async () => {
  const [
    totalDocs,
    totalChunks,
    totalQuestions,
    unansweredQuestions,
    categoryBreakdown,
    feedbackStats,
  ] = await Promise.all([
    Document.countDocuments(),
    DocumentChunk.countDocuments(),
    Message.countDocuments({ role: 'user' }),
    Message.countDocuments({ role: 'assistant', answerable: false }),
    Document.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, chunks: { $sum: '$chunkCount' } } },
      { $sort: { count: -1 } },
    ]),
    feedbackService.getFeedbackSummary(),
  ]);

  // Most cited documents
  const topCitedDocs = await AnalyticsEvent.aggregate([
    { $match: { type: 'document_cited' } },
    {
      $group: {
        _id: '$payload.title',
        category: { $first: '$payload.category' },
        documentId: { $first: '$payload.documentId' },
        citations: { $sum: 1 },
      },
    },
    { $sort: { citations: -1 } },
    { $limit: 8 },
  ]);

  // Unanswered rate calculation
  const totalAssistantReplies = await Message.countDocuments({ role: 'assistant' });
  const unansweredRate =
    totalAssistantReplies > 0
      ? Math.round((unansweredQuestions / totalAssistantReplies) * 100)
      : 0;

  // Ingestion health
  const [readyDocs, processingDocs, failedDocs] = await Promise.all([
    Document.countDocuments({ status: 'READY' }),
    Document.countDocuments({ status: 'PROCESSING' }),
    Document.countDocuments({ status: 'FAILED' }),
  ]);

  return {
    totalDocs,
    totalChunks,
    totalQuestions,
    unansweredQuestions,
    unansweredRate,
    ingestionHealth: {
      ready: readyDocs,
      processing: processingDocs,
      failed: failedDocs,
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c._id || 'Uncategorized',
      count: c.count,
      chunks: c.chunks,
    })),
    topCitedDocs: topCitedDocs.map((d) => ({
      title: d._id || 'Unknown Document',
      category: d.category || 'General',
      citations: d.citations,
    })),
    feedback: feedbackStats,
  };
};

const getUnansweredLogs = async ({ page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    AnalyticsEvent.find({ type: 'unanswered' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AnalyticsEvent.countDocuments({ type: 'unanswered' }),
  ]);

  return {
    logs: events.map((e) => ({
      id: e._id,
      query: e.payload?.query || 'Unknown Query',
      category: e.payload?.category || 'General',
      topScore: e.payload?.topScore || 0,
      user: e.userId ? { name: e.userId.name, email: e.userId.email } : null,
      createdAt: e.createdAt,
    })),
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  getOverviewStats,
  getUnansweredLogs,
};
