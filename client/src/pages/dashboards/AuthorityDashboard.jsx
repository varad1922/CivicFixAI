import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { issuesApi } from '../../services/api';
import {
  Search,
  MapPin,
  Building2,
  RefreshCw,
  ExternalLink,
  X,
  Map as MapIcon,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IssueStatusBadge from '../../components/IssueStatusBadge';

const AuthorityDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchQueue = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await issuesApi.getQueue();
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch authority queue:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time socket updates for dispatched issues
  useEffect(() => {
    if (!socket) return;

    const handleNewIssue = (newIssue) => {
      setQueue((prev) => [newIssue, ...prev]);
    };

    const handleIssueUpdate = (updatedIssue) => {
      setQueue((prev) =>
        prev.map((item) => (item._id === updatedIssue._id ? { ...item, ...updatedIssue } : item))
      );
      setSelectedIssue((prev) =>
        prev?._id === updatedIssue._id ? { ...prev, ...updatedIssue } : prev
      );
    };

    socket.on('issue:assigned', handleNewIssue);
    socket.on('issue:updated', handleIssueUpdate);

    return () => {
      socket.off('issue:assigned', handleNewIssue);
      socket.off('issue:updated', handleIssueUpdate);
    };
  }, [socket]);

  // Handle status update
  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await issuesApi.updateStatus(id, newStatus);
      setSuccessMsg(`Issue #${id.slice(-6)} updated to "${newStatus}"`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Locally update
      setQueue((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: newStatus } : i))
      );
      if (selectedIssue?._id === id) {
        setSelectedIssue((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue.filter((issue) => {
      const matchesSearch =
        search === '' ||
        issue.title?.toLowerCase().includes(search.toLowerCase()) ||
        issue.category?.toLowerCase().includes(search.toLowerCase()) ||
        issue.location?.address?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'reported') return issue.status === 'Reported';
      if (statusFilter === 'in-progress')
        return (
          issue.status === 'In Progress' ||
          issue.status === 'Under Review' ||
          issue.status === 'Assigned'
        );
      if (statusFilter === 'resolved')
        return issue.status === 'Resolved' || issue.status === 'Closed';

      return true;
    });
  }, [queue, search, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = queue.length;
    const reported = queue.filter((i) => i.status === 'Reported').length;
    const inProgress = queue.filter(
      (i) => i.status === 'In Progress' || i.status === 'Under Review' || i.status === 'Assigned'
    ).length;
    const resolved = queue.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;

    return { total, reported, inProgress, resolved };
  }, [queue]);

  return (
    <div className="w-full space-y-6">
      {/* Operations Command Header */}
      <div className="bg-gradient-to-r from-[#122B22] to-[#1A3E31] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Authority Operations Command
            </span>
            <span className="text-xs text-stone-300 font-medium">
              {user?.department || 'Municipal Department'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {user?.name || 'Authorized Officer'}
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
            <Building2 size={14} className="text-emerald-400" />
            <span>Jurisdiction:</span>
            <span className="font-semibold text-emerald-300">
              {user?.jurisdiction || 'Assigned Municipal Region'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
          >
            <MapIcon size={16} className="text-emerald-400" />
            <span>Jurisdiction Map</span>
          </Link>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Check size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Assigned Queue
          </span>
          <span className="text-3xl font-extrabold text-stone-900 font-display">
            {stats.total}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Total routed complaints</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
            Pending Dispatch
          </span>
          <span className="text-3xl font-extrabold text-orange-600 font-display">
            {stats.reported}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Awaiting inspection</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Under Repair
          </span>
          <span className="text-3xl font-extrabold text-blue-600 font-display">
            {stats.inProgress}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Work in progress</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Resolved
          </span>
          <span className="text-3xl font-extrabold text-emerald-600 font-display">
            {stats.resolved}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Closed successfully</span>
        </div>
      </div>

      {/* Queue Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search queue by title, category, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'All Cases' },
            { key: 'reported', label: 'Reported' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[#122B22] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-emerald-700 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">Loading operations queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-10 text-center text-stone-500 text-sm">
            No incidents currently match your filter in {user?.department || 'this department'}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/90 border-b border-stone-200/80 text-stone-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-5">Incident Case</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Severity</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Dispatched At</th>
                  <th className="py-4 px-5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredQueue.map((issue) => (
                  <tr
                    key={issue._id}
                    className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {issue.images?.[0]?.url ? (
                          <img
                            src={issue.images[0].url}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0 font-bold text-xs">
                            MAP
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <span className="font-bold text-stone-900 text-sm block truncate">
                            {issue.title}
                          </span>
                          <span className="text-xs text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="shrink-0" />
                            {issue.location?.address || 'GPS Coordinates Recorded'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                        {issue.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          issue.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : issue.severity === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <IssueStatusBadge status={issue.status} size="sm" />
                    </td>

                    <td className="py-4 px-4 text-xs text-stone-500">
                      {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {issue.status === 'Reported' && (
                          <button
                            onClick={() => handleUpdateStatus(issue._id, 'In Progress')}
                            disabled={updatingId === issue._id}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {issue.status === 'In Progress' && (
                          <button
                            onClick={() => handleUpdateStatus(issue._id, 'Resolved')}
                            disabled={updatingId === issue._id}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <Link
                          to={`/issues/${issue._id}`}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                          title="Full Details"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal / Drawer for Inspection */}
      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IssueStatusBadge status={selectedIssue.status} size="sm" />
                    <span className="text-xs font-bold text-stone-400">
                      Case #{selectedIssue._id?.slice(-8)}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-stone-900 font-display">
                    {selectedIssue.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedIssue.images?.[0]?.url && (
                <div className="h-56 rounded-2xl overflow-hidden mb-4 border border-stone-200 bg-stone-100">
                  <img
                    src={selectedIssue.images[0].url}
                    alt={selectedIssue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    Description
                  </span>
                  <p className="text-sm text-stone-700 mt-0.5 leading-relaxed">
                    {selectedIssue.description || 'No detailed description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="text-[11px] font-bold text-stone-400 uppercase block">
                      Category
                    </span>
                    <span className="text-xs font-bold text-stone-900 mt-0.5 block">
                      {selectedIssue.category}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="text-[11px] font-bold text-stone-400 uppercase block">
                      Severity
                    </span>
                    <span className="text-xs font-bold text-rose-700 mt-0.5 block">
                      {selectedIssue.severity}
                    </span>
                  </div>
                </div>

                {selectedIssue.location?.coordinates && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <MapPin size={14} className="text-emerald-700" />
                      <span>
                        [{selectedIssue.location.coordinates[1]?.toFixed(4)},{' '}
                        {selectedIssue.location.coordinates[0]?.toFixed(4)}]
                      </span>
                    </div>
                    <Link
                      to={`/map?lat=${selectedIssue.location.coordinates[1]}&lng=${selectedIssue.location.coordinates[0]}`}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Locate on Map
                    </Link>
                  </div>
                )}
              </div>

              {/* Status Update Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to={`/issues/${selectedIssue._id}`}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Open Full Case File
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedIssue.status !== 'In Progress' && selectedIssue.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIssue._id, 'In Progress')}
                      disabled={updatingId === selectedIssue._id}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                    >
                      Set In Progress
                    </button>
                  )}
                  {selectedIssue.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIssue._id, 'Resolved')}
                      disabled={updatingId === selectedIssue._id}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      Resolve Case
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthorityDashboard;
