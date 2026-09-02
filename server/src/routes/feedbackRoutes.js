const express = require('express');
const { body } = require('express-validator');
const feedbackService = require('../services/feedbackService');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  [
    body('messageId').trim().notEmpty().withMessage('messageId is required'),
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
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { messageId, rating, feedback, comment, reason } = req.body;

      const result = await feedbackService.submitFeedback({
        messageId,
        userId,
        rating,
        feedback,
        comment,
        reason,
      });

      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully.',
        data: { feedback: result },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
