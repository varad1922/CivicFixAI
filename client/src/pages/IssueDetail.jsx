import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { issuesApi } from '../services/api';
import IssueStatusBadge from '../components/IssueStatusBadge';
import IssueTimeline from '../components/IssueTimeline';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MapPin,
  Calendar,
  User,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Building2,
  Share2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ZoomIn,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Marker setup
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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await issuesApi.getById(id);
      setIssue(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch issue details:', err);
      setError('Civic incident not found or unable to connect.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  // Subscribe to real-time events for this specific issue
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('subscribe_issue', id);

    const handleIssueUpdate = (updatedIssue) => {
      if (updatedIssue._id === id || updatedIssue.id === id) {
        setIssue((prev) => ({ ...prev, ...updatedIssue }));
      }
    };

    socket.on('issue:status:updated', handleIssueUpdate);
    socket.on('issue:updated', handleIssueUpdate);

    return () => {
      socket.emit('unsubscribe_issue', id);
      socket.off('issue:status:updated', handleIssueUpdate);
      socket.off('issue:updated', handleIssueUpdate);
    };
  }, [socket, id]);

  const handleUpdateStatus = async (newStatus) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await issuesApi.updateStatus(id, newStatus);
      setIssue((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-500 text-sm font-semibold">Loading case file...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 font-display">Incident Not Found</h2>
        <p className="text-stone-500 text-sm">
          {error || 'This report may have been archived or the URL is invalid.'}
        </p>
        <Link
          to="/map"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#122B22] text-white font-bold text-sm shadow-md"
        >
          Explore All Map Incidents
        </Link>
      </div>
    );
  }

  const coordinates = issue.location?.coordinates
    ? [issue.location.coordinates[1], issue.location.coordinates[0]] // [lat, lng]
    : null;

  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Back button and share toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to previous view
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
        >
          <Share2 size={14} />
          <span>{copiedLink ? 'Link Copied!' : 'Share Case File'}</span>
        </button>
      </div>

      {/* Main Incident Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-emerald-950/5 overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 sm:p-8 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <IssueStatusBadge status={issue.status} size="lg" />
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
                {issue.category}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  issue.severity === 'Critical'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : issue.severity === 'High'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                Severity: {issue.severity}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#122B22] font-display">
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 mt-2">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
              </span>
              {issue.reportedBy && (
                <span className="flex items-center gap-1">
                  <User size={13} />
                  By {issue.reportedBy.name || 'Verified Citizen'}
                </span>
              )}
            </div>
          </div>

          {/* Authority In-Place Status Action */}
          {isAuthority && (
            <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200/80 space-y-2 shrink-0">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Authority Action
              </span>
              <div className="flex items-center gap-2">
                {issue.status !== 'In Progress' && (
                  <button
                    onClick={() => handleUpdateStatus('In Progress')}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Mark In Progress
                  </button>
                )}
                {issue.status !== 'Resolved' && (
                  <button
                    onClick={() => handleUpdateStatus('Resolved')}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Body Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Description, Media & AI Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Incident Description
              </h3>
              <p className="text-stone-700 text-base leading-relaxed bg-stone-50/70 p-4 rounded-2xl border border-stone-200/60">
                {issue.description || 'No specific description provided by citizen.'}
              </p>
            </div>

            {/* Photos Lightbox Grid */}
            {issue.images && issue.images.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Captured Photographic Evidence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {issue.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhoto(img.url)}
                      className="group relative h-56 rounded-2xl overflow-hidden border border-stone-200 shadow-xs cursor-pointer bg-stone-100"
                    >
                      <img
                        src={img.url}
                        alt="Civic hazard evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <ZoomIn size={18} /> Click to Enlarge
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Breakdown */}
            {issue.aiAnalysis && (
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={16} className="text-emerald-600" />
                    Gemini Vision Intelligence Report
                  </span>
                  {issue.aiAnalysis.confidence > 0 && (
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {issue.aiAnalysis.confidence}% Confidence
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-stone-400 uppercase font-semibold text-[10px] block">
                      Assigned Category
                    </span>
                    <span className="font-extrabold text-stone-900 mt-0.5 block">
                      {issue.aiAnalysis.category || issue.category}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-stone-400 uppercase font-semibold text-[10px] block">
                      Assessed Severity
                    </span>
                    <span className="font-extrabold text-rose-700 mt-0.5 block">
                      {issue.aiAnalysis.severity || issue.severity}
                    </span>
                  </div>
                </div>

                {issue.aiAnalysis.safetyImpact && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs">
                    <span className="font-bold text-stone-800">Public Safety Assessment: </span>
                    <span className="text-stone-600">{issue.aiAnalysis.safetyImpact}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status Timeline Progression */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Resolution Lifecycle Progression
              </h3>
              <IssueTimeline currentStatus={issue.status} timeline={issue.timeline} />
            </div>
          </div>

          {/* Right Column: Location Map & Coordinates */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Geographic Coordinates
              </h3>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                <div className="flex items-start gap-2 text-xs text-stone-700">
                  <MapPin size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    {issue.location?.address || 'GPS Coordinates Documented'}
                  </span>
                </div>

                {coordinates && (
                  <div className="text-[11px] text-stone-400 font-mono">
                    Lat: {coordinates[0].toFixed(5)}, Lng: {coordinates[1].toFixed(5)}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Mini-Map */}
            {coordinates && (
              <div className="h-64 rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
                <MapContainer
                  center={coordinates}
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={coordinates}>
                    <Popup>
                      <div className="p-1">
                        <strong className="text-xs block">{issue.title}</strong>
                        <span className="text-[10px] text-stone-500">{issue.category}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            {coordinates && (
              <Link
                to={`/map?lat=${coordinates[0]}&lng=${coordinates[1]}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-bold text-xs transition-colors"
              >
                <span>View in Global Civic Map</span>
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Photo Lightbox Zoom Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedPhoto} alt="Zoomed view" className="w-full h-auto max-h-[85vh] object-contain" />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueDetail;