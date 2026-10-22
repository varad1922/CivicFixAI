const supabase = require('../config/supabase');
const {
  isConnectivityError,
  getAllUsers,
  updateUser: updateFallbackUser,
  findUserById
} = require('../utils/authFallbackStore');

const getStats = async (req, res, next) => {
  try {
    const [users, active, citizens, authorities, pending, suspended] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'citizen'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'authority'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'authority').eq('verification_status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'suspended')
    ]);

    const firstError = [users, active, citizens, authorities, pending, suspended].find(result => result.error)?.error;
    if (firstError) {
      if (isConnectivityError(firstError)) {
        const fallbackUsers = getAllUsers();
        return res.json({
          totalUsers: fallbackUsers.length,
          activeUsers: fallbackUsers.filter(u => u.is_active).length,
          citizens: fallbackUsers.filter(u => u.role === 'citizen').length,
          authorities: fallbackUsers.filter(u => u.role === 'authority').length,
          pendingVerifications: fallbackUsers.filter(u => u.role === 'authority' && u.verification_status === 'pending').length,
          suspendedUsers: fallbackUsers.filter(u => u.verification_status === 'suspended').length
        });
      }
      throw new Error(firstError.message);
    }

    res.json({
      totalUsers: users.count || 0,
      activeUsers: active.count || 0,
      citizens: citizens.count || 0,
      authorities: authorities.count || 0,
      pendingVerifications: pending.count || 0,
      suspendedUsers: suspended.count || 0
    });
  } catch (error) {
    if (isConnectivityError(error)) {
      const fallbackUsers = getAllUsers();
      return res.json({
        totalUsers: fallbackUsers.length,
        activeUsers: fallbackUsers.filter(u => u.is_active).length,
        citizens: fallbackUsers.filter(u => u.role === 'citizen').length,
        authorities: fallbackUsers.filter(u => u.role === 'authority').length,
        pendingVerifications: fallbackUsers.filter(u => u.role === 'authority' && u.verification_status === 'pending').length,
        suspendedUsers: fallbackUsers.filter(u => u.verification_status === 'suspended').length
      });
    }
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['citizen', 'authority'])
      .order('created_at', { ascending: false });

    if (error) {
      if (isConnectivityError(error)) {
        const fallbackUsers = getAllUsers().filter(u => ['citizen', 'authority'].includes(u.role));
        return res.json(fallbackUsers.map(u => ({
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
          createdAt: u.created_at,
          department: u.department,
          jurisdiction: u.jurisdiction
        })));
      }
      throw new Error(error.message);
    }

    res.json((data || []).map(u => ({
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
      createdAt: u.created_at,
      department: u.department,
      jurisdiction: u.jurisdiction
    })));
  } catch (error) {
    if (isConnectivityError(error)) {
      const fallbackUsers = getAllUsers().filter(u => ['citizen', 'authority'].includes(u.role));
      return res.json(fallbackUsers.map(u => ({
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
        createdAt: u.created_at,
        department: u.department,
        jurisdiction: u.jurisdiction
      })));
    }
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status, isActive } = req.body;
    const userId = req.params.id;
    const validStatuses = ['pending', 'verified', 'rejected', 'suspended'];

    // Try finding target in Supabase
    let target = null;
    let isDbOffline = false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();
      if (!error && data) target = data;
      if (error && isConnectivityError(error)) isDbOffline = true;
    } catch (err) {
      if (isConnectivityError(err)) isDbOffline = true;
    }

    if (!target && isDbOffline) {
      target = findUserById(userId);
    }

    if (!target) {
      res.status(404);
      throw new Error('User not found');
    }
    if (target.role === 'admin' || target.id === req.user.id) {
      res.status(403);
      throw new Error('Admin accounts cannot be modified from this account-management screen.');
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid account status');
    }

    const updateData = {};
    if (status !== undefined) updateData.verification_status = status;
    if (isActive !== undefined) updateData.is_active = Boolean(isActive);

    if (status === 'suspended') updateData.is_active = false;
    if (status === 'verified') updateData.is_active = true;

    if (Object.keys(updateData).length === 0) {
      return res.json({
        message: 'No changes provided',
        user: target
      });
    }

    if (isDbOffline) {
      const updated = updateFallbackUser(userId, updateData);
      return res.json({
        message: 'Account updated successfully',
        user: updated
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, role, verification_status, is_active');

    if (error) {
      res.status(400);
      throw new Error(error.message);
    }

    res.json({
      message: 'Account updated successfully',
      user: data?.[0] || null
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (userId === req.user.id) {
      res.status(400);
      throw new Error('You cannot delete your own admin account.');
    }

    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (targetError || !target) {
      res.status(404);
      throw new Error('User not found');
    }
    if (target.role === 'admin') {
      res.status(403);
      throw new Error('Admin accounts cannot be deleted here.');
    }

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

module.exports = { getStats, getUsers, updateUserStatus, deleteUser };
