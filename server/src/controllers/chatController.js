const chatService = require('../services/chatService');
const feedbackService = require('../services/feedbackService');
const aiEnhancementService = require('../services/aiEnhancementService');

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, message, category, department, collectionName, language, provider } = req.body;
    const userId = req.user.id;

    const result = await chatService.processChatMessage({
      userId,
      conversationId,
      message,
      category,
      department,
      collectionName,
      language: language || 'en',
      provider,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await chatService.getConversations(userId);
    return res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (err) {
    next(err);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const data = await chatService.getConversationById(userId, id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await chatService.deleteConversation(userId, id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: messageId } = req.params;
    const { rating, comment } = req.body;

    const feedback = await feedbackService.submitFeedback({
      messageId,
      userId,
      rating,
      comment,
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully.',
      data: { feedback },
    });
  } catch (err) {
    next(err);
  }
};

const getCampusFAQs = async (req, res, next) => {
  try {
    const faqs = await aiEnhancementService.getAllCampusFAQs();
    return res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  submitFeedback,
  getCampusFAQs,
};
