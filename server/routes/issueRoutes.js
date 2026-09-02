const express = require('express');
const router = express.Router();
const { createIssue, getIssues } = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createIssue)
  .get(getIssues);

module.exports = router;
