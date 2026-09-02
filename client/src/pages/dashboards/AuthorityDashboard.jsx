import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Clock, CheckCircle, Search, Filter } from 'lucide-react';

const AuthorityDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null); // For mobile detail view

  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/issues/queue', {
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

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/issues/${id}/status`, { status }, {
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

  const highPriority = queue.filter(i => i.severity === 'Critical' || i.severity === 'High');

  return (
    <div className="max-w-7xl mx-auto w-full relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-deep-green">Authority Dashboard</h1>
        <p className="text-ink/70">Issue Queue & Management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-sand p-4 rounded shadow-sm border border-deep-green/10">
          <p className="text-ink/60 text-xs font-semibold uppercase">Pending</p>
          <p className="text-2xl font-bold text-deep-green">{queue.length}</p>
        </div>
        <div className="bg-sand p-4 rounded shadow-sm border border-danger/30">
          <p className="text-danger text-xs font-semibold uppercase">High Priority</p>
          <p className="text-2xl font-bold text-danger">{highPriority.length}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile: Queue always shows. Desktop: Left pane */}
        <div className={`w-full ${selectedIssue ? 'hidden lg:block lg:w-1/2' : 'lg:w-1/2'}`}>
          <div className="bg-paper rounded shadow-sm border border-deep-green/10 overflow-hidden flex flex-col h-[70vh]">
            <div className="p-4 bg-sand border-b border-deep-green/10 flex justify-between items-center">
              <h2 className="font-bold text-deep-green">Active Queue</h2>
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
