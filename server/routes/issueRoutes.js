const express = require('express');
const router = express.Router();
const { createIssue, getIssues, checkDuplicates } = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-duplicates', protect, checkDuplicates);

router.route('/')
  .post(protect, createIssue)
  .get(getIssues);

module.exports = router;
