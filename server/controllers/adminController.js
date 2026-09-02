const Issue = require('../models/Issue');
const User = require('../models/User');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const pendingIssues = totalIssues - resolvedIssues;

    const categoryTrends = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const activeUsers = await User.countDocuments({ isActive: true });
    
    // For resolution rate, simple percentage:
    const resolutionRate = totalIssues === 0 ? 0 : Math.round((resolvedIssues / totalIssues) * 100);

    res.json({
      totalUsers,
      activeUsers,
      totalIssues,
      resolvedIssues,
      pendingIssues,
      resolutionRate,
      categoryTrends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers
};
