import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import IssueList from '../../components/IssueList';

const CitizenDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchMyIssues = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${apiUrl}/issues/my-issues`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setIssues(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Failed to fetch citizen issues:',
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  /*
   * Initial load
   */
  useEffect(() => {
    fetchMyIssues();
  }, [fetchMyIssues]);

  /*
   * REAL-TIME CIVILIAN UPDATES
   *
   * When an authority changes:
   *
   * Reported → In Progress
   * In Progress → Resolved
   *
   * the backend emits issue:updated.
   *
   * We immediately update the local state AND refetch
   * the authoritative database state.
   */
  useEffect(() => {
    if (!socket || !token || !user?.id) {
      return undefined;
    }

    const handleIssueUpdated = (updatedIssue) => {
      if (!updatedIssue?._id) {
        return;
      }

      console.log(
        '[Citizen] Live issue update received:',
        updatedIssue._id,
        updatedIssue.status
      );

      /*
       * Immediate optimistic/live UI update.
       */
      setIssues((currentIssues) =>
        currentIssues.map((existingIssue) =>
          existingIssue._id === updatedIssue._id
            ? {
                ...existingIssue,
                ...updatedIssue
              }
            : existingIssue
        )
      );

      /*
       * Then get the authoritative database version.
       */
      fetchMyIssues();
    };

    const handleCitizenNotification = (notification) => {
      const updatedIssue = notification?.issue;

      if (!updatedIssue?._id) {
        return;
      }

      console.log(
        '[Citizen] Notification received:',
        updatedIssue._id,
        updatedIssue.status
      );

      setIssues((currentIssues) =>
        currentIssues.map((existingIssue) =>
          existingIssue._id === updatedIssue._id
            ? {
                ...existingIssue,
                ...updatedIssue
              }
            : existingIssue
        )
      );

      fetchMyIssues();
    };

    socket.on('issue:updated', handleIssueUpdated);
    socket.on(
      'notification:citizen',
      handleCitizenNotification
    );

    return () => {
      socket.off('issue:updated', handleIssueUpdated);
      socket.off(
        'notification:citizen',
        handleCitizenNotification
      );
    };
  }, [socket, token, user?.id, fetchMyIssues]);

  const activeIssues = issues.filter(
    (issue) =>
      issue.status !== 'Resolved' &&
      issue.status !== 'Closed'
  );

  const resolvedIssues = issues.filter(
    (issue) =>
      issue.status === 'Resolved' ||
      issue.status === 'Closed'
  );

  return (
    <div className="max-w-7xl mx-auto w-full">

      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep-green">
            Citizen Dashboard
          </h1>

          <p className="text-ink/70">
            Welcome back, {user?.name}
          </p>
        </div>

        <Link
          to="/report"
          className="bg-orange text-paper px-6 py-3 rounded font-bold
                     hover:bg-orange/90 active:scale-[0.98]
                     transition-all flex items-center justify-center
                     gap-2 shadow-sm"
        >
          <PlusCircle size={20} />
          Report New Issue
        </Link>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        {/* TOTAL */}
        <div
          className="bg-sand p-6 rounded-lg shadow-sm
                     border border-deep-green/10
                     flex items-center gap-4
                     hover:-translate-y-1 hover:shadow-md
                     transition-all duration-200"
        >
          <div className="p-3 bg-deep-green text-paper rounded-full">
            <AlertTriangle size={24} />
          </div>

          <div>
            <p className="text-ink/60 text-sm font-semibold uppercase tracking-wider">
              Total Reported
            </p>

            <p className="text-3xl font-bold text-deep-green">
              {issues.length}
            </p>
          </div>
        </div>

        {/* ACTIVE */}
        <div
          className="bg-sand p-6 rounded-lg shadow-sm
                     border border-deep-green/10
                     flex items-center gap-4
                     hover:-translate-y-1 hover:shadow-md
                     transition-all duration-200"
        >
          <div className="p-3 bg-amber text-paper rounded-full">
            <Clock size={24} />
          </div>

          <div>
            <p className="text-ink/60 text-sm font-semibold uppercase tracking-wider">
              Active Issues
            </p>

            <p className="text-3xl font-bold text-deep-green">
              {activeIssues.length}
            </p>
          </div>
        </div>

        {/* RESOLVED */}
        <div
          className="bg-sand p-6 rounded-lg shadow-sm
                     border border-deep-green/10
                     flex items-center gap-4
                     hover:-translate-y-1 hover:shadow-md
                     transition-all duration-200"
        >
          <div className="p-3 bg-civic-green text-paper rounded-full">
            <CheckCircle size={24} />
          </div>

          <div>
            <p className="text-ink/60 text-sm font-semibold uppercase tracking-wider">
              Resolved
            </p>

            <p className="text-3xl font-bold text-deep-green">
              {resolvedIssues.length}
            </p>
          </div>
        </div>
      </div>

      {/* REPORTS */}
      <div
        className="bg-paper rounded-lg shadow-sm
                   border border-deep-green/10
                   overflow-hidden mt-6"
      >
        <div className="p-4 bg-sand border-b border-deep-green/10">
          <h2 className="text-xl font-bold text-deep-green">
            My Reports
          </h2>
        </div>

        <div className="p-4 md:p-6">

          {loading ? (
            <div className="text-center text-ink/60 py-8">
              Loading your issues...
            </div>
          ) : (
            <IssueList
              issues={issues}
              emptyMessage="You haven't reported any issues yet."
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;