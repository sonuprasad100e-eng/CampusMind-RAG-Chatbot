const analyticsService = require('../services/analyticsService');

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverviewStats();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getUnanswered = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const data = await analyticsService.getUnansweredLogs({ page, limit });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getUnanswered,
};
