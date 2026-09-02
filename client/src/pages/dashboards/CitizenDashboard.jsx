import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const CitizenDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/issues/my-issues', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIssues(res.data);
      } catch (err) {
        console.error('Failed to fetch my issues');
      } finally {
        setLoading(false);
      }
    };
    fetchMyIssues();
  }, [token]);

  const activeIssues = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
  const resolvedIssues = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed');

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep-green">Citizen Dashboard</h1>
          <p className="text-ink/70">Welcome back, {user?.name}</p>
        </div>
        <Link 
          to="/report" 
          className="bg-orange text-paper px-6 py-3 rounded font-bold hover:bg-orange/90 flex items-center justify-center gap-2 shadow-sm"
        >
          <PlusCircle size={20} />
          Report New Issue
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-sand p-6 rounded-lg shadow-sm border border-deep-green/10 flex items-center gap-4">
          <div className="p-3 bg-deep-green text-paper rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-ink/60 text-sm font-semibold uppercase tracking-wider">Total Reported</p>
            <p className="text-3xl font-bold text-deep-green">{issues.length}</p>
          </div>
        </div>
        <div className="bg-sand p-6 rounded-lg shadow-sm border border-deep-green/10 flex items-center gap-4">
          <div className="p-3 bg-amber text-paper rounded-full">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-ink/60 text-sm font-semibold uppercase tracking-wider">Active Issues</p>
            <p className="text-3xl font-bold text-deep-green">{activeIssues.length}</p>
          </div>
        </div>
        <div className="bg-sand p-6 rounded-lg shadow-sm border border-deep-green/10 flex items-center gap-4">
          <div className="p-3 bg-civic-green text-paper rounded-full">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-ink/60 text-sm font-semibold uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-bold text-deep-green">{resolvedIssues.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-paper rounded-lg shadow-sm border border-deep-green/10 overflow-hidden">
        <div className="p-4 bg-sand border-b border-deep-green/10">
          <h2 className="text-xl font-bold text-deep-green">My Active Reports</h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-ink/60">Loading your issues...</div>
          ) : activeIssues.length === 0 ? (
            <div className="p-8 text-center text-ink/60">
              <p>You have no active issues.</p>
              <Link to="/report" className="text-info-blue hover:underline mt-2 inline-block">Report an issue now</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {activeIssues.map(issue => (
                <Link 
                  key={issue._id} 
                  to={`/issues/${issue._id}`}
                  className="block bg-sand/30 p-4 rounded border border-deep-green/10 hover:border-deep-green/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold bg-deep-green/10 text-deep-green px-2 py-1 rounded">
                      {issue.status}
                    </span>
                    <span className="text-xs text-ink/60">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate">{issue.title}</h3>
                  <p className="text-sm text-ink/80 mb-2 truncate">{issue.description}</p>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>{issue.category}</span>
                    <span className={issue.severity === 'Critical' ? 'text-danger' : 'text-orange'}>
                      {issue.severity}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
