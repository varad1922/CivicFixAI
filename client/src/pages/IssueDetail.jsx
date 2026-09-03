import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import IssueStatusBadge from '../components/IssueStatusBadge';
import IssueTimeline from '../components/IssueTimeline';

import {
  MapContainer,
  TileLayer,
  Marker
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const IssueDetail = () => {
  const { id } = useParams();
  const { socket } = useSocket();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  /*
   * Fetch the authoritative issue from the backend.
   */
  const fetchIssue = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axios.get(
        `${apiUrl}/issues/${id}`
      );

      setIssue(response.data);
      setError(null);
    } catch (requestError) {
      console.error(
        'Failed to fetch issue:',
        requestError.response?.data || requestError.message
      );

      setError('Issue not found');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, id]);

  /*
   * Initial issue load.
   */
  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  /*
   * REAL-TIME ISSUE STATUS
   */
  useEffect(() => {
    if (!socket || !id) {
      return undefined;
    }

    /*
     * Subscribe to this particular issue.
     */
    socket.emit('subscribe_issue', id);

    const handleIssueUpdated = (updatedIssue) => {
      if (!updatedIssue?._id) {
        return;
      }

      if (String(updatedIssue._id) !== String(id)) {
        return;
      }

      console.log(
        '[IssueDetail] Live update:',
        updatedIssue.status
      );

      /*
       * Immediately update the screen.
       */
      setIssue((currentIssue) => ({
        ...currentIssue,
        ...updatedIssue
      }));

      /*
       * Refetch from DB so the screen contains the
       * canonical server-side state.
       */
      fetchIssue();
    };

    const handleCitizenNotification = (notification) => {
      const updatedIssue = notification?.issue;

      if (!updatedIssue?._id) {
        return;
      }

      if (String(updatedIssue._id) !== String(id)) {
        return;
      }

      console.log(
        '[IssueDetail] Citizen notification:',
        updatedIssue.status
      );

      setIssue((currentIssue) => ({
        ...currentIssue,
        ...updatedIssue
      }));

      fetchIssue();
    };

    socket.on('issue:updated', handleIssueUpdated);

    socket.on(
      'notification:citizen',
      handleCitizenNotification
    );

    return () => {
      socket.off(
        'issue:updated',
        handleIssueUpdated
      );

      socket.off(
        'notification:citizen',
        handleCitizenNotification
      );

      socket.emit('unsubscribe_issue', id);
    };
  }, [socket, id, fetchIssue]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-paper rounded shadow-sm border border-deep-green/10 animate-pulse">
        <div className="h-4 bg-sand rounded w-1/4 mb-6" />

        <div className="flex flex-col md:flex-row gap-8">

          <div className="md:w-2/3 w-full">
            <div className="h-8 bg-sand rounded w-3/4 mb-4" />
            <div className="h-4 bg-sand rounded w-full mb-6" />
            <div className="h-64 bg-sand rounded w-full mb-6" />
            <div className="h-4 bg-sand rounded w-full mb-2" />
            <div className="h-4 bg-sand rounded w-5/6" />
          </div>

          <div className="md:w-1/3 w-full space-y-6">
            <div className="h-48 bg-sand rounded w-full" />
            <div className="h-20 bg-sand rounded w-full" />
          </div>

        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-12 text-danger">
        {error}
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  const coordinates =
    issue.location?.coordinates || [];

  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);

  const hasValidLocation =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-paper text-ink p-6 rounded shadow-sm border border-deep-green/10">

      <div className="mb-4">
        <Link
          to="/map"
          className="text-info-blue hover:underline"
        >
          &larr; Back to Map
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">

        <div className="md:w-2/3">

          <h1 className="text-3xl font-bold text-deep-green mb-2">
            {issue.title}
          </h1>

          <div className="flex flex-wrap gap-4 mb-4 text-sm text-ink/80 border-b border-deep-green/20 pb-4">

            <span className="font-semibold">
              {issue.category}
            </span>

            <span>
              Severity:{' '}
              <strong
                className={
                  issue.severity === 'Critical'
                    ? 'text-danger'
                    : 'text-orange'
                }
              >
                {issue.severity}
              </strong>
            </span>

            <span className="flex items-center gap-2">
              Status:{' '}
              <IssueStatusBadge status={issue.status} />
            </span>

            <span>
              {new Date(
                issue.createdAt
              ).toLocaleDateString()}
            </span>

          </div>

          {issue.images?.length > 0 && (
            <img
              src={issue.images[0].url}
              alt={issue.title}
              className="w-full h-auto max-h-96 object-cover rounded mb-6 shadow-sm"
            />
          )}

          <h3 className="text-xl font-semibold mb-2">
            Description
          </h3>

          <p className="whitespace-pre-wrap leading-relaxed">
            {issue.description}
          </p>

          {issue.aiAnalysis?.category && (
            <div className="mt-8 bg-sand/50 p-4 rounded border border-deep-green/10">

              <h4 className="font-bold text-deep-green mb-2 flex items-center gap-2">
                <span>🤖</span>
                AI Analysis Summary
              </h4>

              <p className="text-sm">
                <strong>Suggested Category:</strong>{' '}
                {issue.aiAnalysis.category}
              </p>

              <p className="text-sm">
                <strong>Safety Impact:</strong>{' '}
                {issue.aiAnalysis.safetyImpact}
              </p>

            </div>
          )}

        </div>

        <div className="md:w-1/3 w-full space-y-6">

          {/* STATUS */}
          <div className="bg-sand p-5 rounded-lg border border-deep-green/10">

            <h3 className="font-bold text-deep-green mb-3">
              Current Status
            </h3>

            <div className="mt-2">
              <IssueStatusBadge status={issue.status} />
            </div>

            <p className="text-xs text-ink/60 mt-3">
              Status updates are received automatically.
            </p>

          </div>

          {/* LOCATION */}
          {hasValidLocation && (
            <div className="bg-paper rounded-lg border border-deep-green/10 overflow-hidden">

              <div className="p-4">
                <h3 className="font-bold text-deep-green">
                  Location
                </h3>

                {issue.location?.address && (
                  <p className="text-sm text-ink/70 mt-1">
                    {issue.location.address}
                  </p>
                )}
              </div>

              <MapContainer
                center={[lat, lng]}
                zoom={15}
                scrollWheelZoom={false}
                className="h-56 w-full"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[lat, lng]} />
              </MapContainer>

            </div>
          )}

          {/* TIMELINE */}
          <div className="bg-sand p-5 rounded-lg border border-deep-green/10">
            <h3 className="font-bold text-deep-green mb-2">
              Status Timeline
            </h3>
            <IssueTimeline currentStatus={issue.status} />
            
            {issue.timeline?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-deep-green/10 space-y-4">
                <h4 className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-3">Activity Log</h4>
                {issue.timeline.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="border-l-2 border-deep-green/20 pl-4">
                    <p className="font-semibold text-sm">{entry.status}</p>
                    {entry.note && <p className="text-xs text-ink/60 mt-1">{entry.note}</p>}
                    {entry.timestamp && <p className="text-[11px] text-ink/50 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default IssueDetail;