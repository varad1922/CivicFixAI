import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Clock, CheckCircle, Search, Filter } from 'lucide-react';

const AuthorityDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null); // For mobile detail view

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
      if (selectedIssue && selectedIssue._id === updatedIssue._id) {
        setSelectedIssue(updatedIssue);
      }
    };

    socket.on('issue:created', handleNewIssue);
    socket.on('issue:assigned', handleNewIssue);
    socket.on('issue:updated', handleIssueUpdate);

    return () => {
      socket.off('issue:created', handleNewIssue);
      socket.off('issue:assigned', handleNewIssue);
      socket.off('issue:updated', handleIssueUpdate);
    };
  }, [socket, selectedIssue]);

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

  return (
    <div className="max-w-7xl mx-auto w-full relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-deep-green">Civic Operations Center</h1>
        <p className="text-ink/70">Incoming Requests & Assigned Work</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10 flex flex-col items-center justify-center">
          <p className="text-ink/60 text-[10px] md:text-xs font-semibold uppercase text-center">New Requests</p>
          <p className="text-2xl font-bold text-deep-green">{newRequests.length}</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border border-danger/30 flex flex-col items-center justify-center">
          <p className="text-danger text-[10px] md:text-xs font-semibold uppercase text-center">High Priority</p>
          <p className="text-2xl font-bold text-danger">{highPriority.length}</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border border-info-blue/30 flex flex-col items-center justify-center">
          <p className="text-info-blue text-[10px] md:text-xs font-semibold uppercase text-center">In Progress</p>
          <p className="text-2xl font-bold text-info-blue">{inProgress.length}</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border border-civic-green/30 flex flex-col items-center justify-center">
          <p className="text-civic-green text-[10px] md:text-xs font-semibold uppercase text-center">Resolved</p>
          <p className="text-2xl font-bold text-civic-green">{resolved.length}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile: Queue always shows. Desktop: Left pane */}
        <div className={`w-full ${selectedIssue ? 'hidden lg:block lg:w-1/2' : 'lg:w-1/2'}`}>
          <div className="bg-paper rounded shadow-sm border border-deep-green/10 overflow-hidden flex flex-col h-[70vh]">
            <div className="p-4 bg-sand border-b border-deep-green/10 flex justify-between items-center">
              <h2 className="font-bold text-deep-green">Assigned Work Queue</h2>
              <div className="flex gap-2 text-ink/60">
                <Search size={18} />
                <Filter size={18} />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-grow p-2 space-y-2">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : queue.length === 0 ? (
                <div className="p-4 text-center">Queue is empty.</div>
              ) : (
                queue.map(issue => (
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
                    <h3 className="font-bold text-sm truncate">{issue.title}</h3>
                    <p className="text-xs text-ink/70 flex justify-between mt-2">
                      <span>{issue.category}</span>
                      <span className="font-semibold">{issue.status}</span>
                    </p>
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
                <div className="flex gap-2 mb-4">
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
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateStatus(selectedIssue._id, 'In Progress')}
                      disabled={selectedIssue.status === 'In Progress'}
                      className="bg-info-blue text-paper py-2 rounded text-sm font-bold disabled:opacity-50"
                    >
                      Mark In Progress
                    </button>
                    <button 
                      onClick={() => updateStatus(selectedIssue._id, 'Resolved')}
                      disabled={selectedIssue.status === 'Resolved'}
                      className="bg-civic-green text-paper py-2 rounded text-sm font-bold disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                    <Link to={`/issues/${selectedIssue._id}`} className="col-span-2 text-center py-2 border border-deep-green/20 rounded text-sm font-semibold hover:bg-sand/50">
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
