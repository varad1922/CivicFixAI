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
      setSuccessMsg(`Incident #${id.slice(-6)} updated to "${newStatus}"`);
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
      <div className="bg-gradient-to-r from-[#151520] via-[#101018] to-[#1e1333] text-[#F5F3FF] p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#292938] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Authority Operations Command
            </span>
            <span className="text-xs text-[#A1A1B5] font-medium">
              {user?.department || 'Municipal Department'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] font-display">
            {user?.name || 'Authorized Officer'}
          </h1>
          <p className="text-[#A1A1B5] text-xs sm:text-sm mt-1 flex items-center gap-1.5">
            <Building2 size={14} className="text-sky-400" />
            <span>Jurisdiction:</span>
            <span className="font-semibold text-purple-300">
              {user?.jurisdiction || 'Assigned Municipal Region'}
            </span>
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#151520] hover:bg-[#1f1f2e] text-[#F5F3FF] font-bold text-xs border border-[#292938] hover:border-purple-500/50 transition-all active:scale-95 shadow-md"
          >
            <MapIcon size={16} className="text-sky-400" />
            <span>Jurisdiction Map</span>
          </Link>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#151520] hover:bg-[#1f1f2e] text-[#A1A1B5] hover:text-[#F5F3FF] border border-[#292938] transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-purple-400' : ''} />
          </button>
        </div>

        <div className="absolute right-0 bottom-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Check size={16} className="text-purple-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <span className="text-xs font-bold text-[#A1A1B5] uppercase tracking-wider block mb-1">
            Assigned Queue
          </span>
          <span className="text-3xl font-extrabold text-[#F5F3FF] font-display">
            {stats.total}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Total routed complaints</span>
        </div>

        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Pending Dispatch
          </span>
          <span className="text-3xl font-extrabold text-amber-400 font-display">
            {stats.reported}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Awaiting inspection</span>
        </div>

        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
            Under Repair
          </span>
          <span className="text-3xl font-extrabold text-sky-400 font-display">
            {stats.inProgress}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Work in progress</span>
        </div>

        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
            Resolved
          </span>
          <span className="text-3xl font-extrabold text-purple-400 font-display">
            {stats.resolved}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Closed successfully</span>
        </div>
      </div>

      {/* Queue Filter & Search Bar */}
      <div className="bg-[#151520] p-4 rounded-2xl border border-[#292938] shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1B5]/60" />
          <input
            type="text"
            placeholder="Search queue by title, category, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-[#101018] border border-[#292938] text-[#A1A1B5] hover:text-[#F5F3FF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-[#151520] rounded-2xl border border-[#292938] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-purple-400 mx-auto mb-2" />
            <p className="text-[#A1A1B5] text-sm">Loading operations queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-10 text-center text-[#A1A1B5] text-sm">
            No incidents currently match your filter in {user?.department || 'this department'}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#101018] border-b border-[#292938] text-[#A1A1B5] text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-5">Incident Case</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Severity</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Dispatched At</th>
                  <th className="py-4 px-5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292938]/60">
                {filteredQueue.map((issue) => (
                  <tr
                    key={issue._id}
                    className="hover:bg-[#1a1a26] transition-colors cursor-pointer"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {issue.images?.[0]?.url ? (
                          <img
                            src={issue.images[0].url}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-[#292938] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#101018] border border-[#292938] flex items-center justify-center text-[#A1A1B5] shrink-0 font-bold text-xs">
                            MAP
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <span className="font-bold text-[#F5F3FF] text-sm block truncate">
                            {issue.title}
                          </span>
                          <span className="text-xs text-[#A1A1B5] flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="shrink-0 text-sky-400" />
                            {issue.location?.address || 'GPS Coordinates Recorded'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#101018] border border-[#292938] text-[#F5F3FF]">
                        {issue.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          issue.severity === 'Critical'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                            : issue.severity === 'High'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-[#101018] border border-[#292938] text-[#A1A1B5]'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <IssueStatusBadge status={issue.status} size="sm" />
                    </td>

                    <td className="py-4 px-4 text-xs text-[#A1A1B5]">
                      {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {issue.status === 'Reported' && (
                          <button
                            onClick={() => handleUpdateStatus(issue._id, 'In Progress')}
                            disabled={updatingId === issue._id}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 transition-colors shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {issue.status === 'In Progress' && (
                          <button
                            onClick={() => handleUpdateStatus(issue._id, 'Resolved')}
                            disabled={updatingId === issue._id}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition-colors shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <Link
                          to={`/issues/${issue._id}`}
                          className="p-1.5 text-[#A1A1B5] hover:text-[#F5F3FF] rounded-lg hover:bg-[#101018] transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#151520] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl shadow-purple-950/50 border border-[#292938] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-[#292938]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IssueStatusBadge status={selectedIssue.status} size="sm" />
                    <span className="text-xs font-bold text-[#A1A1B5]">
                      Case #{selectedIssue._id?.slice(-8)}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#F5F3FF] font-display">
                    {selectedIssue.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-1.5 rounded-xl text-[#A1A1B5] hover:text-[#F5F3FF] hover:bg-[#101018]"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedIssue.images?.[0]?.url && (
                <div className="h-56 rounded-2xl overflow-hidden mb-4 border border-[#292938] bg-[#101018]">
                  <img
                    src={selectedIssue.images[0].url}
                    alt={selectedIssue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1B5] block">
                    Description
                  </span>
                  <p className="text-sm text-[#F5F3FF]/90 mt-0.5 leading-relaxed">
                    {selectedIssue.description || 'No detailed description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#101018] border border-[#292938]">
                    <span className="text-[11px] font-bold text-[#A1A1B5] uppercase block">
                      Category
                    </span>
                    <span className="text-xs font-bold text-[#F5F3FF] mt-0.5 block">
                      {selectedIssue.category}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#101018] border border-[#292938]">
                    <span className="text-[11px] font-bold text-[#A1A1B5] uppercase block">
                      Severity
                    </span>
                    <span className="text-xs font-bold text-rose-400 mt-0.5 block">
                      {selectedIssue.severity}
                    </span>
                  </div>
                </div>

                {selectedIssue.location?.coordinates && (
                  <div className="p-3 rounded-xl bg-[#101018] border border-[#292938] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[#A1A1B5]">
                      <MapPin size={14} className="text-sky-400" />
                      <span>
                        [{selectedIssue.location.coordinates[1]?.toFixed(4)},{' '}
                        {selectedIssue.location.coordinates[0]?.toFixed(4)}]
                      </span>
                    </div>
                    <Link
                      to={`/map?lat=${selectedIssue.location.coordinates[1]}&lng=${selectedIssue.location.coordinates[0]}`}
                      className="text-purple-400 font-bold hover:underline"
                    >
                      Locate on Map
                    </Link>
                  </div>
                )}
              </div>

              {/* Status Update Action Buttons */}
              <div className="pt-4 border-t border-[#292938] flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to={`/issues/${selectedIssue._id}`}
                  className="text-xs font-bold text-[#A1A1B5] hover:text-[#F5F3FF]"
                >
                  Open Full Case File
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedIssue.status !== 'In Progress' && selectedIssue.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIssue._id, 'In Progress')}
                      disabled={updatingId === selectedIssue._id}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                    >
                      Set In Progress
                    </button>
                  )}
                  {selectedIssue.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIssue._id, 'Resolved')}
                      disabled={updatingId === selectedIssue._id}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(168,85,247,0.35)]"
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
