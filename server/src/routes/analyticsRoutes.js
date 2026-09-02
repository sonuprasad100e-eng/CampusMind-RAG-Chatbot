const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get('/overview', analyticsController.getOverview);
router.get('/unanswered', analyticsController.getUnanswered);

module.exports = router;
