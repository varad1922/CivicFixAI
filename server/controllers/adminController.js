const supabase = require('../config/supabase');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res, next) => {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    const { count: activeUsers } = await supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
      
    const { count: totalIssues } = await supabase.from('issues').select('*', { count: 'exact', head: true });
    
    const { count: resolvedIssues } = await supabase.from('issues')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Resolved', 'Closed']);
      
    const pendingIssues = totalIssues - resolvedIssues;

    const { count: authoritiesCount } = await supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'authority');

    const { count: citizensCount } = await supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'citizen');

    const { count: pendingVerifications } = await supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'authority')
      .eq('verification_status', 'pending');

    const { data: trendsData } = await supabase.rpc('get_category_trends');
    const categoryTrends = (trendsData || []).map(t => ({
       _id: t.category,
       count: Number(t.count)
    }));

    // For resolution rate, simple percentage:
    const resolutionRate = totalIssues === 0 ? 0 : Math.round((resolvedIssues / totalIssues) * 100);

    res.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      citizens: citizensCount || 0,
      authorities: authoritiesCount || 0,
      pendingVerifications: pendingVerifications || 0,
      totalIssues: totalIssues || 0,
      resolvedIssues: resolvedIssues || 0,
      pendingIssues: pendingIssues || 0,
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw new Error(error.message);
    
    // map to old format
    const users = data.map(u => ({
      _id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      authProvider: u.auth_provider,
      verificationStatus: u.verification_status,
      isActive: u.is_active,
      lastLogin: u.last_login,
      lastActive: u.last_active,
      createdAt: u.created_at
    }));

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user verification status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status, isActive } = req.body;
    const userId = req.params.id;
    
    const updateData = {};
    if (status !== undefined) updateData.verification_status = status;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      res.status(400);
      throw new Error(error.message);
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser
};
