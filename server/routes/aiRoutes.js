const express = require('express');
const router = express.Router();
const { analyzeIssueImage } = require('../services/ai/aiService');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../services/activityService');

// @desc    Analyze issue image with AI
// @route   POST /api/ai/analyze-issue
// @access  Private
router.post('/analyze-issue', protect, async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
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
