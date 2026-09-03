const express = require('express');
const router = express.Router();
const { upload, uploadImage } = require('../services/uploadService');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../services/activityService');

router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image file');
    }

    const result = await uploadImage(req.file, req.user.id);
    await logActivity('IMAGE_UPLOADED', req.user.id, null, { url: result.url });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
