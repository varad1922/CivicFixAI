const express = require('express');
const router = express.Router();
const { createIssue } = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createIssue);

module.exports = router;
