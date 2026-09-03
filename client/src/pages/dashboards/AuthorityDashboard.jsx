import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Clock, CheckCircle, Search, PlusCircle, Map as MapIcon, Check } from 'lucide-react';
import IssueStatusBadge from '../../components/IssueStatusBadge';

const AuthorityDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null); // For mobile detail view
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState('all');

  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/issues/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleNewIssue = (issue) => {
      setQueue((prev) => [issue, ...prev]);
    };

    const handleIssueUpdate = (updatedIssue) => {
      setQueue((prev) => prev.map(issue => issue._id === updatedIssue._id ? updatedIssue : issue));
      setSelectedIssue(prev => prev?._id === updatedIssue._id ? updatedIssue : prev);
    };

    socket.on('issue:assigned', handleNewIssue);
    socket.on('issue:updated', handleIssueUpdate);

    return () => {
      socket.off('issue:assigned', handleNewIssue);
      socket.off('issue:updated', handleIssueUpdate);
    };
  }, [socket]);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/issues/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQueue();
      if (selectedIssue && selectedIssue._id === id) {
        setSelectedIssue({ ...selectedIssue, status });
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const newRequests = queue.filter(i => i.status === 'Reported');
  const highPriority = queue.filter(i => (i.severity === 'Critical' || i.severity === 'High') && i.status !== 'Resolved' && i.status !== 'Closed');
  const inProgress = queue.filter(i => i.status === 'In Progress');
  const resolved = queue.filter(i => i.status === 'Resolved' || i.status === 'Closed');
  const visibleQueue = queue.filter(issue => {
    const matchesSearch = !search || `${issue.title} ${issue.category} ${issue.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = queueFilter === 'all' || (queueFilter === 'new' && issue.status === 'Reported') || (queueFilter === 'high' && ['High', 'Critical'].includes(issue.severity)) || (queueFilter === 'progress' && issue.status === 'In Progress') || (queueFilter === 'resolved' && ['Resolved', 'Closed'].includes(issue.status));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto w-full relative">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep-green">Civic Operations Center</h1>
          <p className="text-ink/70">Incoming Requests & Assigned Work</p>
        </div>
        <div className="flex gap-2">
          <Link to="/map" className="px-4 py-2 border border-deep-green/20 rounded-lg font-semibold flex items-center gap-2 hover:bg-sand transition-all"><MapIcon size={17}/> Map</Link>
          <Link to="/report" className="px-4 py-2 bg-orange text-paper rounded-lg font-bold flex items-center gap-2 hover:bg-orange/90 hover:-translate-y-0.5 transition-all shadow-sm"><PlusCircle size={17}/> Report</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-sand p-4 rounded shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all duration-200 border-deep-green/10 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-ink/60 text-[10px] md:text-xs font-semibold uppercase mb-1">
            <AlertCircle size={14} /> New Requests
          </div>
          <p className="text-3xl font-bold text-deep-green">{newRequests.length}</p>
          <p className="text-[10px] text-ink/50 mt-1">Awaiting assessment</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all duration-200 border-danger/30 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-danger text-[10px] md:text-xs font-semibold uppercase mb-1">
            <AlertCircle size={14} /> High Priority
          </div>
          <p className="text-3xl font-bold text-danger">{highPriority.length}</p>
          <p className="text-[10px] text-ink/50 mt-1">Needs urgent attention</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all duration-200 border-info-blue/30 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-info-blue text-[10px] md:text-xs font-semibold uppercase mb-1">
            <Clock size={14} /> In Progress
          </div>
          <p className="text-3xl font-bold text-info-blue">{inProgress.length}</p>
          <p className="text-[10px] text-ink/50 mt-1">Issues currently being handled</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all duration-200 border-civic-green/30 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-civic-green text-[10px] md:text-xs font-semibold uppercase mb-1">
            <CheckCircle size={14} /> Resolved
          </div>
          <p className="text-3xl font-bold text-civic-green">{resolved.length}</p>
          <p className="text-[10px] text-ink/50 mt-1">Issues completed successfully</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile: Queue always shows. Desktop: Left pane */}
        <div className={`w-full ${selectedIssue ? 'hidden lg:block lg:w-1/2' : 'lg:w-1/2'}`}>
          <div className="bg-paper rounded shadow-sm border border-deep-green/10 overflow-hidden flex flex-col h-[70vh]">
            <div className="p-4 bg-sand border-b border-deep-green/10 flex justify-between items-center">
              <h2 className="font-bold text-deep-green">Assigned Work Queue</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="w-28 md:w-44 pl-7 pr-2 py-1.5 rounded border border-deep-green/15 bg-paper text-xs outline-none focus:border-deep-green" />
                </div>
                <select value={queueFilter} onChange={e => setQueueFilter(e.target.value)} className="text-xs rounded border border-deep-green/15 bg-paper p-1.5" aria-label="Filter assigned work">
                  <option value="all">All</option><option value="new">New</option><option value="high">High</option><option value="progress">In Progress</option><option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-grow p-2 space-y-2">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : visibleQueue.length === 0 ? (
                <div className="p-4 text-center">Queue is empty.</div>
              ) : (
                visibleQueue.map(issue => (
                  <div 
                    key={issue._id} 
                    onClick={() => setSelectedIssue(issue)}
                    className={`p-3 rounded cursor-pointer border transition-colors ${
                      selectedIssue?._id === issue._id 
                        ? 'border-deep-green bg-deep-green/5' 
                        : 'border-deep-green/10 bg-sand/30 hover:border-deep-green/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${issue.severity === 'Critical' ? 'bg-danger text-paper' : 'bg-orange/20 text-orange'}`}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] text-ink/60">{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-sm truncate mb-2">{issue.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-ink/70">{issue.category}</span>
                      <IssueStatusBadge status={issue.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Full screen when selected. Desktop: Right pane */}
        {selectedIssue && (
          <div className="w-full lg:w-1/2 absolute lg:static top-0 left-0 h-full lg:h-auto bg-paper z-20">
            <div className="bg-paper rounded shadow-sm border border-deep-green/10 h-[70vh] flex flex-col">
              <div className="p-4 bg-deep-green text-paper flex justify-between items-center">
                <h2 className="font-bold truncate pr-4">Issue Details</h2>
                <button onClick={() => setSelectedIssue(null)} className="lg:hidden text-sand font-bold">Close</button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-grow">
                <h3 className="text-xl font-bold mb-2">{selectedIssue.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <IssueStatusBadge status={selectedIssue.status} />
                  <span className="text-xs bg-sand text-deep-green px-2 py-1 rounded font-bold">{selectedIssue.category}</span>
                  <span className="text-xs bg-sand text-deep-green px-2 py-1 rounded font-bold">{selectedIssue.severity}</span>
                </div>
                
                {selectedIssue.images?.length > 0 && (
                  <img src={selectedIssue.images[0].url} alt="issue" className="w-full h-48 object-cover rounded mb-4" />
                )}
                
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-1 text-ink/70">Description</h4>
                  <p className="text-sm bg-sand/30 p-3 rounded">{selectedIssue.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 text-ink/70">Quick Actions</h4>
                  <div className="flex flex-col gap-2">
                    {selectedIssue.status === 'Reported' && (
                      <button 
                        onClick={() => updateStatus(selectedIssue._id, 'In Progress')}
                        className="w-full bg-info-blue text-paper py-3 rounded text-sm font-bold hover:bg-info-blue/90 shadow-sm"
                      >
                        Mark In Progress
                      </button>
                    )}
                    
                    {selectedIssue.status === 'In Progress' && (
                      <button 
                        onClick={() => updateStatus(selectedIssue._id, 'Resolved')}
                        className="w-full bg-civic-green text-paper py-3 rounded text-sm font-bold hover:bg-civic-green/90 shadow-sm"
                      >
                        Mark Resolved
                      </button>
                    )}
                    
                    {(selectedIssue.status === 'Resolved' || selectedIssue.status === 'Closed') && (
                      <div className="w-full bg-civic-green/10 text-civic-green border border-civic-green/20 py-3 rounded text-sm font-bold flex items-center justify-center gap-2">
                        <Check size={18} />
                        Resolved
                      </div>
                    )}

                    <Link to={`/issues/${selectedIssue._id}`} className="w-full text-center py-3 border border-deep-green/20 rounded text-sm font-semibold hover:bg-sand/50 mt-2">
                      View Full Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;
