import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import {
  ShieldCheck,
  Users,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Building2,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard = () => {
  const { token, user: currentUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'delete' | 'suspend', user }

  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Unable to load account management data.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleUpdateStatus = async (userId, newStatus, isActive) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      await adminApi.updateUserStatus(userId, { status: newStatus, isActive });
      setMessage({
        type: 'success',
        text: `Account status successfully updated to "${newStatus}".`,
      });
      await fetchAdminData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update account.',
      });
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      await adminApi.deleteUser(userId);
      setMessage({ type: 'success', text: 'Account permanently removed.' });
      await fetchAdminData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete account.',
      });
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        search === '' ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase()) ||
        u.jurisdiction?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'authorities') return u.role === 'authority';
      if (filter === 'citizens') return u.role === 'citizen';
      if (filter === 'pending')
        return u.role === 'authority' && u.verificationStatus === 'pending';
      if (filter === 'suspended') return u.verificationStatus === 'suspended' || !u.isActive;

      return true;
    });
  }, [users, search, filter]);

  return (
    <div className="w-full space-y-8">
      {/* Admin Command Header */}
      <div className="bg-gradient-to-r from-[#122B22] to-[#1A3E31] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Platform Administration
            </span>
            <span className="text-xs text-stone-300 font-medium">Security & Role Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Account Management Control
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-1">
            Review department verification requests, enforce policy status, and audit users.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all self-start md:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Status feedback message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-stone-400 hover:text-stone-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Stats Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Total Users
          </span>
          <span className="text-2xl font-extrabold text-stone-900 font-display mt-0.5 block">
            {stats?.totalUsers ?? '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Active Accounts
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-display mt-0.5 block">
            {stats?.activeUsers ?? '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
            Citizens
          </span>
          <span className="text-2xl font-extrabold text-stone-900 font-display mt-0.5 block">
            {stats?.citizens ?? '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Authorities
          </span>
          <span className="text-2xl font-extrabold text-blue-600 font-display mt-0.5 block">
            {stats?.authorities ?? '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Pending Approval
          </span>
          <span className="text-2xl font-extrabold text-amber-600 font-display mt-0.5 block">
            {stats?.pendingVerifications ?? '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Suspended
          </span>
          <span className="text-2xl font-extrabold text-rose-600 font-display mt-0.5 block">
            {stats?.suspendedUsers ?? '—'}
          </span>
        </div>
      </div>

      {/* User Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search accounts by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'All Users' },
            { key: 'pending', label: 'Pending Verification' },
            { key: 'authorities', label: 'Authorities' },
            { key: 'citizens', label: 'Citizens' },
            { key: 'suspended', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[#122B22] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-emerald-700 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-stone-500 text-sm">
            No accounts found matching your current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/90 border-b border-stone-200/80 text-stone-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-5">User Account</th>
                  <th className="py-4 px-4">Role & Department</th>
                  <th className="py-4 px-4">Verification</th>
                  <th className="py-4 px-4">Activity Status</th>
                  <th className="py-4 px-4">Registered</th>
                  <th className="py-4 px-5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => {
                  const isPendingAuth =
                    u.role === 'authority' && u.verificationStatus === 'pending';
                  const isSuspended = u.verificationStatus === 'suspended' || !u.isActive;

                  return (
                    <tr key={u._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 shrink-0 text-sm">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              u.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-stone-900 text-sm block truncate">
                              {u.name}
                            </span>
                            <span className="text-xs text-stone-400 block truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                              u.role === 'authority'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {u.role}
                          </span>
                          {u.department && (
                            <span className="text-xs text-stone-500 block truncate font-medium">
                              {u.department}
                            </span>
                          )}
                          {u.jurisdiction && (
                            <span className="text-[11px] text-stone-400 block truncate">
                              {u.jurisdiction}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            u.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.verificationStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.verificationStatus || 'standard'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-xs font-medium inline-flex items-center gap-1.5 ${
                            u.isActive ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-stone-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve / Reject pending authorities */}
                          {isPendingAuth && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(u._id, 'verified', true)}
                                disabled={actionLoading === u._id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(u._id, 'rejected', false)}
                                disabled={actionLoading === u._id}
                                className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Suspend / Re-activate toggle */}
                          {!isPendingAuth && (
                            <button
                              onClick={() => {
                                if (isSuspended) {
                                  handleUpdateStatus(u._id, 'verified', true);
                                } else {
                                  setConfirmModal({ type: 'suspend', user: u });
                                }
                              }}
                              disabled={actionLoading === u._id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                isSuspended
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                          )}

                          {/* Delete Account button */}
                          <button
                            onClick={() => setConfirmModal({ type: 'delete', user: u })}
                            disabled={actionLoading === u._id}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal for Destructive Actions */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>

              <h3 className="text-xl font-extrabold text-stone-900 font-display">
                {confirmModal.type === 'delete' ? 'Delete Account Permanently?' : 'Suspend Account?'}
              </h3>

              <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                {confirmModal.type === 'delete' ? (
                  <>
                    Are you sure you want to delete{' '}
                    <strong className="text-stone-900">{confirmModal.user.name}</strong> ({confirmModal.user.email})?
                    This will permanently revoke their access and cannot be undone.
                  </>
                ) : (
                  <>
                    Are you sure you want to suspend{' '}
                    <strong className="text-stone-900">{confirmModal.user.name}</strong>? They will be blocked
                    from logging into the CivicFix platform until reactivated.
                  </>
                )}
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'delete') {
                      handleDeleteUser(confirmModal.user._id);
                    } else {
                      handleUpdateStatus(confirmModal.user._id, 'suspended', false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                >
                  {confirmModal.type === 'delete' ? 'Confirm Delete' : 'Confirm Suspension'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
