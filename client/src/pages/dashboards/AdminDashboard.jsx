import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { Users, FileText, CheckCircle, Clock, TrendingUp, BarChart2 } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchAdminData();
  }, [token]);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center text-center">
              <Users size={24} className="text-deep-green mb-2" />
              <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase">Total Users</p>
              <p className="text-2xl md:text-3xl font-bold text-deep-green">{stats?.totalUsers || 0}</p>
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
            <div className="p-4 bg-sand border-b border-deep-green/10">
              <h2 className="font-bold text-deep-green">User Management</h2>
            </div>
            
            {/* Mobile Stacked List, Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-deep-green/5">
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Name</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Email</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Role</th>
                    <th className="p-3 border-b text-sm font-semibold text-deep-green">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-sand/30 border-b border-deep-green/5">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-ink/70">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.role === 'admin' ? 'bg-danger/20 text-danger' : 
                          u.role === 'authority' ? 'bg-info-blue/20 text-info-blue' : 'bg-sand text-deep-green'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-ink/60 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col">
              {users.map(u => (
                <div key={u._id} className="p-4 border-b border-deep-green/10 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">{u.name}</h3>
                    <p className="text-xs text-ink/60">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-block mb-1 ${
                      u.role === 'admin' ? 'bg-danger/20 text-danger' : 
                      u.role === 'authority' ? 'bg-info-blue/20 text-info-blue' : 'bg-sand text-deep-green'
                    }`}>
                      {u.role}
                    </span>
                    <p className="text-[10px] text-ink/40">{new Date(u.createdAt).toLocaleDateString()}</p>
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
