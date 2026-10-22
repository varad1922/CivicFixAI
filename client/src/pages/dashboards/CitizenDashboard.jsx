import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { issuesApi } from '../../services/api';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import IssueList from '../../components/IssueList';

const CitizenDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchMyIssues = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await issuesApi.getMyIssues();
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch citizen issues:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyIssues();
  }, [fetchMyIssues]);

  // Real-time socket listeners for live updates
  useEffect(() => {
    if (!socket) return;

    const handleIssueUpdate = (updatedIssue) => {
      setIssues((prev) =>
        prev.map((item) => (item._id === updatedIssue._id ? { ...item, ...updatedIssue } : item))
      );
    };

    const handleNewIssue = (newIssue) => {
      if (newIssue.reportedBy === user?.id || newIssue.reported_by === user?.id) {
        setIssues((prev) => [newIssue, ...prev]);
      }
    };

    socket.on('issue:status:updated', handleIssueUpdate);
    socket.on('issue:created', handleNewIssue);

    return () => {
      socket.off('issue:status:updated', handleIssueUpdate);
      socket.off('issue:created', handleNewIssue);
    };
  }, [socket, user?.id]);

  // Derived metrics
  const stats = useMemo(() => {
    const total = issues.length;
    const reported = issues.filter((i) => i.status === 'Reported').length;
    const inProgress = issues.filter(
      (i) => i.status === 'In Progress' || i.status === 'Under Review' || i.status === 'Assigned'
    ).length;
    const resolved = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;

    return { total, reported, inProgress, resolved };
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        search === '' ||
        issue.title?.toLowerCase().includes(search.toLowerCase()) ||
        issue.category?.toLowerCase().includes(search.toLowerCase()) ||
        issue.description?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'reported') return issue.status === 'Reported';
      if (filter === 'in-progress')
        return (
          issue.status === 'In Progress' ||
          issue.status === 'Under Review' ||
          issue.status === 'Assigned'
        );
      if (filter === 'resolved')
        return issue.status === 'Resolved' || issue.status === 'Closed';

      return true;
    });
  }, [issues, search, filter]);

  return (
    <div className="w-full space-y-8">
      {/* Welcome / Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#151520] via-[#101018] to-[#1e1333] text-[#F5F3FF] p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#292938] relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Citizen Community Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] mt-1 font-display">
            Welcome back, {user?.name || 'Citizen'}
          </h1>
          <p className="text-[#A1A1B5] text-sm mt-1 max-w-xl">
            Track your submitted civic reports, inspect real-time municipal responses, and help keep
            our public infrastructure sound.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-95 shrink-0"
          >
            <PlusCircle size={18} />
            <span>Report Civic Issue</span>
          </Link>
          <button
            onClick={fetchMyIssues}
            disabled={loading}
            className="p-3 rounded-xl bg-[#151520] hover:bg-[#1f1f2e] border border-[#292938] text-[#A1A1B5] hover:text-[#F5F3FF] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-purple-400' : ''} />
          </button>
        </div>

        <div className="absolute right-0 bottom-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A1A1B5] uppercase tracking-wider">
              Total Reports
            </span>
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <TrendingUp size={16} />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-[#F5F3FF] font-display">
            {stats.total}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Lifetime filed by you</span>
        </div>

        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Reported
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle size={16} />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-amber-400 font-display">
            {stats.reported}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Awaiting authority dispatch</span>
        </div>

        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              In Progress
            </span>
            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Clock size={16} />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-sky-400 font-display">
            {stats.inProgress}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Active municipal work</span>
        </div>

        <div className="bg-[#151520] p-5 rounded-2xl border border-[#292938] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Resolved
            </span>
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-purple-400 font-display">
            {stats.resolved}
          </span>
          <span className="text-[11px] text-[#A1A1B5] mt-1 block">Completed & verified</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#151520] p-4 rounded-2xl border border-[#292938] shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1B5]/60" />
          <input
            type="text"
            placeholder="Search reports by title, category, or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'All Issues' },
            { key: 'reported', label: 'Reported' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-[#101018] border border-[#292938] text-[#A1A1B5] hover:text-[#F5F3FF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#F5F3FF] font-display">
            My Incident Reports ({filteredIssues.length})
          </h2>
          <Link
            to="/map"
            className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
          >
            <MapPin size={14} />
            <span>View All on Civic Map</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-[#151520] rounded-2xl border border-[#292938]">
            <RefreshCw size={24} className="animate-spin text-purple-400 mx-auto mb-2" />
            <p className="text-[#A1A1B5] text-sm font-medium">Synchronizing reports...</p>
          </div>
        ) : (
          <IssueList
            issues={filteredIssues}
            emptyMessage={
              search
                ? 'No reports match your current search query.'
                : 'You have not submitted any civic reports yet. Help improve your neighborhood by reporting an issue today!'
            }
          />
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;