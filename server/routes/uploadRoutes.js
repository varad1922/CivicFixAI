const express = require('express');
const router = express.Router();
const { upload } = require('../services/uploadService');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../services/activityService');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  await logActivity('IMAGE_UPLOADED', req.user.id, null, { url: req.file.path });

  res.json({
    url: req.file.path,
    public_id: req.file.filename
  });
});

module.exports = router;
