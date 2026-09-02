const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { chatLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Public FAQs endpoint
router.get('/faqs', chatController.getCampusFAQs);

// Protected Chat Endpoints
router.use(auth);

router.post(
  '/message',
  chatLimiter,
  [
    body('message').trim().notEmpty().withMessage('Message content cannot be empty'),
    body('provider').optional().isString().trim(),
  ],
  validate,
  chatController.sendMessage
);

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.delete('/conversations/:id', chatController.deleteConversation);

router.post(
  '/messages/:id/feedback',
  [
    body('rating')
      .optional()
      .isIn(['up', 'down', 'positive', 'negative'])
      .withMessage('Rating must be "up", "down", "positive", or "negative"'),
    body('feedback')
      .optional()
      .isIn(['up', 'down', 'positive', 'negative'])
      .withMessage('Feedback must be "up", "down", "positive", or "negative"'),
    body('comment').optional().isString().trim(),
    body('reason').optional().isString().trim(),
  ],
  validate,
  chatController.submitFeedback
);

module.exports = router;
