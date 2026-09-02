const express = require('express');
const router = express.Router();
const { upload } = require('../services/uploadService');
const { protect } = require('../middleware/authMiddleware');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  res.json({
    url: req.file.path,
    public_id: req.file.filename
  });
});

module.exports = router;
