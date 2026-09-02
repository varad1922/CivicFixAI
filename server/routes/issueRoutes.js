const express = require('express');
const router = express.Router();
const { createIssue, getIssues, getMyIssues, getIssueById, checkDuplicates } = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-duplicates', protect, checkDuplicates);

router.route('/')
  .post(protect, createIssue)
  .get(getIssues);

router.get('/my-issues', protect, getMyIssues);

router.route('/:id').get(getIssueById);

module.exports = router;
