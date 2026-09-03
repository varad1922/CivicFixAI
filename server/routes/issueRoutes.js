const express = require('express');
const router = express.Router();
const { createIssue, getIssues, getMyIssues, getMapIssues, getIssueById, checkDuplicates, getQueue, updateStatus } = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/check-duplicates', protect, checkDuplicates);
router.get('/queue', protect, authorize('authority'), getQueue);

router.route('/')
  .post(protect, createIssue)
  .get(getIssues);

router.get('/map', protect, getMapIssues);
router.get('/my-issues', protect, getMyIssues);

router.route('/:id')
  .get(getIssueById);

router.patch('/:id/status', protect, authorize('authority'), updateStatus);

module.exports = router;
