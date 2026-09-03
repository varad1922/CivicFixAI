const express = require('express');
const router = express.Router();
const { analyzeIssueImage } = require('../services/ai/aiService');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../services/activityService');

router.post('/analyze-issue', protect, async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400);
      throw new Error('Image URL is required');
    }

    await logActivity('AI_ANALYSIS_STARTED', req.user.id, null, { imageUrl });
    const analysis = await analyzeIssueImage(imageUrl);
    await logActivity('AI_ANALYSIS_COMPLETED', req.user.id, null, { analysis });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
