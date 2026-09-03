import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { CheckCircle, Clock, ShieldCheck, Users, UserX, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to load account management data.' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchAdminData(); }, [token, fetchAdminData]);

  const handleUpdateStatus = async (userId, status) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Account status updated.' });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update account.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this account? This cannot be undone.')) return;
    setActionLoading(userId);
    setMessage(null);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Account deleted.' });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete account.' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (filter === 'authority') return users.filter(u => u.role === 'authority');
    if (filter === 'citizen') return users.filter(u => u.role === 'citizen');
    if (filter === 'pending') return users.filter(u => u.role === 'authority' && u.verificationStatus === 'pending');
    if (filter === 'suspended') return users.filter(u => u.verificationStatus === 'suspended' || !u.isActive);
    return users;
  }, [users, filter]);

  const statCards = [
    ['Total Accounts', stats?.totalUsers || 0, Users, 'all'],
    ['Citizens', stats?.citizens || 0, Users, 'citizen'],
    ['Authorities', stats?.authorities || 0, ShieldCheck, 'authority'],
    ['Pending Verification', stats?.pendingVerifications || 0, Clock, 'pending'],
    ['Suspended', stats?.suspendedUsers || 0, UserX, 'suspended']
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-0 py-4 md:py-2">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-civic-green mb-2">Administration</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-deep-green">Account Management</h1>
        <p className="text-ink/70 mt-1">Verify authorities and manage civilian and authority accounts. Complaints are handled by authorities.</p>
      </div>

      {message && (
        <div className={`mb-5 p-4 rounded-lg font-semibold ${message.type === 'error' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-civic-green/10 text-civic-green border border-civic-green/20'}`}>
          {message.text}
        </div>
      )}

      {loading && !stats ? <div className="p-10 text-center text-ink/60">Loading account management...</div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-7">
            {statCards.map(([label, value, Icon, targetFilter]) => (
              <button key={label} onClick={() => setFilter(targetFilter)} className="text-left bg-sand p-4 md:p-5 rounded-xl border border-deep-green/10 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
                <Icon size={21} className="text-deep-green mb-3" />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-ink/60">{label}</p>
                <p className="text-2xl md:text-3xl font-extrabold text-deep-green mt-1">{value}</p>
              </button>
            ))}
          </div>

          <section className="bg-paper rounded-xl border border-deep-green/10 overflow-hidden shadow-sm">
            <div className="p-4 md:p-5 bg-sand border-b border-deep-green/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-deep-green text-lg">User Accounts</h2>
                <p className="text-sm text-ink/60">{filteredUsers.length} account{filteredUsers.length === 1 ? '' : 's'} shown</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ['all', 'All'], ['pending', 'Pending'], ['authority', 'Authorities'], ['citizen', 'Citizens'], ['suspended', 'Suspended']
                ].map(([value, label]) => (
                  <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filter === value ? 'bg-deep-green text-paper shadow-sm' : 'bg-paper border border-deep-green/15 text-deep-green hover:bg-deep-green/5'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-deep-green/5 text-xs uppercase tracking-wider text-deep-green">
                  <th className="p-4">Account</th><th className="p-4">Role</th><th className="p-4">Department / Jurisdiction</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="border-t border-deep-green/5 hover:bg-sand/20 transition-colors">
                      <td className="p-4"><p className="font-bold">{u.name}</p><p className="text-xs text-ink/60">{u.email}</p></td>
                      <td className="p-4"><span className="text-xs font-bold uppercase px-2 py-1 rounded bg-deep-green/10 text-deep-green">{u.role}</span></td>
                      <td className="p-4 text-sm text-ink/70">{u.role === 'authority' ? `${u.department || '—'} • ${u.jurisdiction || '—'}` : '—'}</td>
                      <td className="p-4"><StatusBadge user={u} /></td>
                      <td className="p-4 text-right"><Actions user={u} actionLoading={actionLoading} onUpdate={handleUpdateStatus} onDelete={handleDelete} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-deep-green/10">
              {filteredUsers.map(u => (
                <div key={u._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{u.name}</p><p className="text-xs text-ink/60 break-all">{u.email}</p></div><StatusBadge user={u} /></div>
                  <div className="text-xs text-ink/60">{u.role.toUpperCase()}{u.role === 'authority' && ` • ${u.department || 'No department'} • ${u.jurisdiction || 'No jurisdiction'}`}</div>
                  <Actions user={u} actionLoading={actionLoading} onUpdate={handleUpdateStatus} onDelete={handleDelete} mobile />
                </div>
              ))}
            </div>

            {!filteredUsers.length && <div className="p-10 text-center text-ink/60">No accounts match this filter.</div>}
          </section>
        </>
      )}
    </div>
  );
};

const StatusBadge = ({ user }) => {
  const status = user.verificationStatus || (user.isActive ? 'verified' : 'suspended');
  const classes = status === 'pending' ? 'bg-amber/15 text-amber' : status === 'rejected' ? 'bg-danger/10 text-danger' : status === 'suspended' || !user.isActive ? 'bg-ink/10 text-ink/70' : 'bg-civic-green/10 text-civic-green';
  return <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${classes}`}>{status}</span>;
};

const Actions = ({ user, actionLoading, onUpdate, onDelete, mobile }) => {
  const busy = actionLoading === user._id;
  const common = 'px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5';
  return (
    <div className={`flex ${mobile ? 'flex-wrap' : 'justify-end'} gap-2`}>
      {user.role === 'authority' && user.verificationStatus === 'pending' && <button disabled={busy} onClick={() => onUpdate(user._id, 'verified')} className={`${common} bg-civic-green text-paper`}><CheckCircle size={14} className="inline mr-1"/>Verify</button>}
      {user.role === 'authority' && user.verificationStatus === 'pending' && <button disabled={busy} onClick={() => onUpdate(user._id, 'rejected')} className={`${common} bg-danger text-paper`}><XCircle size={14} className="inline mr-1"/>Reject</button>}
      {user.verificationStatus !== 'suspended' && user.isActive && <button disabled={busy} onClick={() => onUpdate(user._id, 'suspended')} className={`${common} bg-ink/10 text-ink`}>Suspend</button>}
      {(user.verificationStatus === 'suspended' || !user.isActive) && <button disabled={busy} onClick={() => onUpdate(user._id, 'verified')} className={`${common} bg-civic-green text-paper`}>Activate</button>}
      <button disabled={busy} onClick={() => onDelete(user._id)} className={`${common} bg-danger/10 text-danger`}>Delete</button>
    </div>
  );
};

export default AdminDashboard;
