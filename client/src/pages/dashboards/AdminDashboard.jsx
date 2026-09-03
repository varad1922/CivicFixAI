import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { Users, FileText, CheckCircle, Clock, TrendingUp, BarChart2 } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleUpdateStatus = async (userId, status) => {
    setActionLoading(userId);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh data
      await fetchAdminData();
    } catch (error) {
      console.error('Failed to update user status', error);
      alert('Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-deep-green">Admin Dashboard</h1>
        <p className="text-ink/70">Platform Analytics and Management</p>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center text-center">
              <Users size={24} className="text-deep-green mb-2" />
              <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase">Total Users</p>
              <p className="text-2xl md:text-3xl font-bold text-deep-green">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center text-center">
              <FileText size={24} className="text-amber mb-2" />
              <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase">Pending Auth</p>
              <p className="text-2xl md:text-3xl font-bold text-amber">{stats?.pendingVerifications || 0}</p>
            </div>
            <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center text-center">
              <TrendingUp size={24} className="text-info-blue mb-2" />
              <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase">Resolution Rate</p>
              <p className="text-2xl md:text-3xl font-bold text-info-blue">{stats?.resolutionRate || 0}%</p>
            </div>
            <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center text-center">
              <Clock size={24} className="text-amber mb-2" />
              <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase">Pending Issues</p>
              <p className="text-2xl md:text-3xl font-bold text-amber">{stats?.pendingIssues || 0}</p>
            </div>
            <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center text-center">
              <CheckCircle size={24} className="text-civic-green mb-2" />
              <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase">Resolved Issues</p>
              <p className="text-2xl md:text-3xl font-bold text-civic-green">{stats?.resolvedIssues || 0}</p>
            </div>
          </div>

          <div className="mb-8 bg-paper rounded shadow-sm border border-deep-green/10 overflow-hidden">
            <div className="p-4 bg-sand border-b border-deep-green/10 flex items-center gap-2">
              <BarChart2 size={20} className="text-deep-green" />
              <h2 className="font-bold text-deep-green">Category Trends</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                {stats?.categoryTrends?.slice(0, 5).map((trend, idx) => {
                  // simple pure css bar chart
                  const percentage = Math.round((trend.count / (stats.totalIssues || 1)) * 100);
                  return (
                    <div key={trend._id} className="w-full">
                      <div className="flex justify-between text-xs mb-1 font-semibold">
                        <span>{trend._id || 'Unknown'}</span>
                        <span>{trend.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-sand rounded-full h-2">
                        <div 
                          className="bg-deep-green h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-paper rounded shadow-sm border border-deep-green/10 overflow-hidden">
            <div className="p-4 bg-sand border-b border-deep-green/10 flex justify-between items-center">
              <h2 className="font-bold text-deep-green">Authority Management</h2>
            </div>
            
            {/* Mobile Stacked List, Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-deep-green/5">
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Name</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Email</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Department</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Jurisdiction</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Status</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'authority').map(u => (
                    <tr key={u._id} className="hover:bg-sand/30 border-b border-deep-green/5">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-ink/70">{u.email}</td>
                      <td className="p-3 text-ink/70">{u.department || 'N/A'}</td>
                      <td className="p-3 text-ink/70">{u.jurisdiction || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.verificationStatus === 'pending' ? 'bg-amber/20 text-amber' : 
                          u.verificationStatus === 'rejected' ? 'bg-danger/20 text-danger' : 
                          u.verificationStatus === 'suspended' ? 'bg-ink/20 text-ink' : 
                          'bg-civic-green/20 text-civic-green'
                        }`}>
                          {u.verificationStatus || 'verified'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.verificationStatus === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(u._id, 'verified')}
                              disabled={actionLoading === u._id}
                              className="px-2 py-1 bg-civic-green text-paper rounded text-xs font-semibold disabled:opacity-50"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(u._id, 'rejected')}
                              disabled={actionLoading === u._id}
                              className="px-2 py-1 bg-danger text-paper rounded text-xs font-semibold disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {u.verificationStatus !== 'pending' && u.verificationStatus !== 'suspended' && (
                           <button 
                             onClick={() => handleUpdateStatus(u._id, 'suspended')}
                             disabled={actionLoading === u._id}
                             className="px-2 py-1 bg-ink/20 text-ink rounded text-xs font-semibold disabled:opacity-50 ml-2"
                           >
                             Suspend
                           </button>
                        )}
                        {u.verificationStatus === 'suspended' && (
                           <button 
                             onClick={() => handleUpdateStatus(u._id, 'verified')}
                             disabled={actionLoading === u._id}
                             className="px-2 py-1 bg-civic-green text-paper rounded text-xs font-semibold disabled:opacity-50 ml-2"
                           >
                             Unsuspend
                           </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Authority */}
            <div className="md:hidden flex flex-col">
              {users.filter(u => u.role === 'authority').map(u => (
                <div key={u._id} className="p-4 border-b border-deep-green/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm">{u.name}</h3>
                      <p className="text-xs text-ink/60">{u.email}</p>
                      <p className="text-xs text-info-blue mt-1">{u.department} | {u.jurisdiction}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          u.verificationStatus === 'pending' ? 'bg-amber/20 text-amber' : 
                          u.verificationStatus === 'rejected' ? 'bg-danger/20 text-danger' : 
                          u.verificationStatus === 'suspended' ? 'bg-ink/20 text-ink' : 
                          'bg-civic-green/20 text-civic-green'
                        }`}>
                          {u.verificationStatus || 'verified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    {u.verificationStatus === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(u._id, 'verified')}
                          disabled={actionLoading === u._id}
                          className="px-3 py-1.5 bg-civic-green text-paper rounded text-xs font-semibold disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(u._id, 'rejected')}
                          disabled={actionLoading === u._id}
                          className="px-3 py-1.5 bg-danger text-paper rounded text-xs font-semibold disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {u.verificationStatus !== 'pending' && u.verificationStatus !== 'suspended' && (
                       <button 
                         onClick={() => handleUpdateStatus(u._id, 'suspended')}
                         disabled={actionLoading === u._id}
                         className="px-3 py-1.5 bg-ink/20 text-ink rounded text-xs font-semibold disabled:opacity-50"
                       >
                         Suspend
                       </button>
                    )}
                    {u.verificationStatus === 'suspended' && (
                       <button 
                         onClick={() => handleUpdateStatus(u._id, 'verified')}
                         disabled={actionLoading === u._id}
                         className="px-3 py-1.5 bg-civic-green text-paper rounded text-xs font-semibold disabled:opacity-50"
                       >
                         Unsuspend
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-paper rounded shadow-sm border border-deep-green/10 overflow-hidden mt-6">
            <div className="p-4 bg-sand border-b border-deep-green/10">
              <h2 className="font-bold text-deep-green">Civilian Accounts</h2>
            </div>
            
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-deep-green/5">
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Name</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Email</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Status</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'citizen').map(u => (
                    <tr key={u._id} className="hover:bg-sand/30 border-b border-deep-green/5">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-ink/70">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.verificationStatus === 'suspended' ? 'bg-ink/20 text-ink' : 
                          'bg-civic-green/20 text-civic-green'
                        }`}>
                          {u.verificationStatus || 'verified'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.verificationStatus !== 'suspended' && (
                           <button 
                             onClick={() => handleUpdateStatus(u._id, 'suspended')}
                             disabled={actionLoading === u._id}
                             className="px-2 py-1 bg-ink/20 text-ink rounded text-xs font-semibold disabled:opacity-50 ml-2"
                           >
                             Suspend
                           </button>
                        )}
                        {u.verificationStatus === 'suspended' && (
                           <button 
                             onClick={() => handleUpdateStatus(u._id, 'verified')}
                             disabled={actionLoading === u._id}
                             className="px-2 py-1 bg-civic-green text-paper rounded text-xs font-semibold disabled:opacity-50 ml-2"
                           >
                             Unsuspend
                           </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col">
              {users.filter(u => u.role === 'citizen').map(u => (
                <div key={u._id} className="p-4 border-b border-deep-green/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm">{u.name}</h3>
                      <p className="text-xs text-ink/60">{u.email}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          u.verificationStatus === 'suspended' ? 'bg-ink/20 text-ink' : 
                          'bg-civic-green/20 text-civic-green'
                        }`}>
                          {u.verificationStatus || 'verified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    {u.verificationStatus !== 'suspended' && (
                       <button 
                         onClick={() => handleUpdateStatus(u._id, 'suspended')}
                         disabled={actionLoading === u._id}
                         className="px-3 py-1.5 bg-ink/20 text-ink rounded text-xs font-semibold disabled:opacity-50"
                       >
                         Suspend
                       </button>
                    )}
                    {u.verificationStatus === 'suspended' && (
                       <button 
                         onClick={() => handleUpdateStatus(u._id, 'verified')}
                         disabled={actionLoading === u._id}
                         className="px-3 py-1.5 bg-civic-green text-paper rounded text-xs font-semibold disabled:opacity-50"
                       >
                         Unsuspend
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
