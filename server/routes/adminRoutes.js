const express = require('express');
const router = express.Router();
const { getStats, getUsers } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Apply protection and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);

module.exports = router;
