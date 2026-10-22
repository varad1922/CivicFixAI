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
  Share2,
  ExternalLink,
  ZoomIn,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Neon pin setup for mini-map
const customMiniPin = new L.DivIcon({
  className: 'custom-mini-pin',
  html: `
    <div style="
      background-color: #A855F7;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #07070B;
      box-shadow: 0 0 12px #A855F7;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background: #FFFFFF; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
        <p className="text-[#A1A1B5] text-sm font-semibold">Loading case file...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(244,63,94,0.3)]">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-[#F5F3FF] font-display">Incident Not Found</h2>
        <p className="text-[#A1A1B5] text-sm">
          {error || 'This report may have been archived or the URL is invalid.'}
        </p>
        <Link
          to="/map"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)]"
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
    <div className="max-w-5xl mx-auto space-y-6 py-2 text-[#F5F3FF]">
      {/* Back button and share toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A1B5] hover:text-[#F5F3FF] transition-colors"
        >
          <ArrowLeft size={16} /> Back to previous view
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#151520] border border-[#292938] text-xs font-bold text-[#F5F3FF] hover:border-purple-500/50 transition-colors shadow-md"
        >
          <Share2 size={14} className="text-purple-400" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Case File'}</span>
        </button>
      </div>

      {/* Main Incident Card */}
      <div className="bg-[#151520] rounded-3xl border border-[#292938] shadow-2xl shadow-purple-950/20 overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 sm:p-8 border-b border-[#292938] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101018]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <IssueStatusBadge status={issue.status} size="lg" />
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#151520] border border-[#292938] text-[#F5F3FF]">
                {issue.category}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  issue.severity === 'Critical'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                    : issue.severity === 'High'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : 'bg-[#151520] border border-[#292938] text-[#A1A1B5]'
                }`}
              >
                Severity: {issue.severity}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] font-display">
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A1A1B5] mt-2">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-purple-400" />
                Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
              </span>
              {issue.reportedBy && (
                <span className="flex items-center gap-1">
                  <User size={13} className="text-sky-400" />
                  By {issue.reportedBy.name || 'Verified Citizen'}
                </span>
              )}
            </div>
          </div>

          {/* Authority In-Place Status Action */}
          {isAuthority && (
            <div className="p-4 rounded-2xl bg-[#151520] border border-[#292938] space-y-2 shrink-0">
              <span className="text-[11px] font-bold text-[#A1A1B5] uppercase tracking-wider block">
                Authority Action
              </span>
              <div className="flex items-center gap-2">
                {issue.status !== 'In Progress' && (
                  <button
                    onClick={() => handleUpdateStatus('In Progress')}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-colors"
                  >
                    Mark In Progress
                  </button>
                )}
                {issue.status !== 'Resolved' && (
                  <button
                    onClick={() => handleUpdateStatus('Resolved')}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(168,85,247,0.35)] transition-colors"
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1B5] mb-2">
                Incident Description
              </h3>
              <p className="text-[#F5F3FF]/90 text-base leading-relaxed bg-[#101018] p-4 rounded-2xl border border-[#292938]">
                {issue.description || 'No specific description provided by citizen.'}
              </p>
            </div>

            {/* Photos Lightbox Grid */}
            {issue.images && issue.images.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1B5] mb-2">
                  Captured Photographic Evidence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {issue.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhoto(img.url)}
                      className="group relative h-56 rounded-2xl overflow-hidden border border-[#292938] shadow-md cursor-pointer bg-[#101018]"
                    >
                      <img
                        src={img.url}
                        alt="Civic hazard evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <ZoomIn size={18} /> Click to Enlarge
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Breakdown */}
            {issue.aiAnalysis && (
              <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={16} className="text-purple-400" />
                    Gemini Vision Intelligence Report
                  </span>
                  {issue.aiAnalysis.confidence > 0 && (
                    <span className="text-xs font-extrabold text-purple-200 bg-purple-600/30 border border-purple-500/40 px-2.5 py-0.5 rounded shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                      {issue.aiAnalysis.confidence}% Confidence
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#101018] rounded-xl border border-[#292938]">
                    <span className="text-[#A1A1B5] uppercase font-semibold text-[10px] block">
                      Assigned Category
                    </span>
                    <span className="font-extrabold text-[#F5F3FF] mt-0.5 block">
                      {issue.aiAnalysis.category || issue.category}
                    </span>
                  </div>

                  <div className="p-3 bg-[#101018] rounded-xl border border-[#292938]">
                    <span className="text-[#A1A1B5] uppercase font-semibold text-[10px] block">
                      Assessed Severity
                    </span>
                    <span className="font-extrabold text-rose-400 mt-0.5 block">
                      {issue.aiAnalysis.severity || issue.severity}
                    </span>
                  </div>
                </div>

                {issue.aiAnalysis.safetyImpact && (
                  <div className="p-3 bg-[#101018] rounded-xl border border-[#292938] text-xs">
                    <span className="font-bold text-[#F5F3FF]">Public Safety Assessment: </span>
                    <span className="text-[#A1A1B5]">{issue.aiAnalysis.safetyImpact}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status Timeline Progression */}
            <div className="pt-4 border-t border-[#292938]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1B5] mb-2">
                Resolution Lifecycle Progression
              </h3>
              <IssueTimeline currentStatus={issue.status} timeline={issue.timeline} />
            </div>
          </div>

          {/* Right Column: Location Map & Coordinates */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1B5] mb-2">
                Geographic Coordinates
              </h3>
              <div className="p-4 rounded-2xl bg-[#101018] border border-[#292938] space-y-3">
                <div className="flex items-start gap-2 text-xs text-[#F5F3FF]">
                  <MapPin size={16} className="text-sky-400 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    {issue.location?.address || 'GPS Coordinates Documented'}
                  </span>
                </div>

                {coordinates && (
                  <div className="text-[11px] text-[#A1A1B5] font-mono">
                    Lat: {coordinates[0].toFixed(5)}, Lng: {coordinates[1].toFixed(5)}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Mini-Map with CartoDB Dark Matter */}
            {coordinates && (
              <div className="h-64 rounded-2xl overflow-hidden border border-[#292938] shadow-inner bg-[#07070B]">
                <MapContainer
                  center={coordinates}
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%', background: '#07070B' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={coordinates} icon={customMiniPin}>
                    <Popup>
                      <div className="p-1 bg-[#151520] text-[#F5F3FF]">
                        <strong className="text-xs block text-[#F5F3FF]">{issue.title}</strong>
                        <span className="text-[10px] text-purple-400">{issue.category}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            {coordinates && (
              <Link
                to={`/map?lat=${coordinates[0]}&lng=${coordinates[1]}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#101018] hover:bg-[#151520] text-[#F5F3FF] border border-[#292938] hover:border-purple-500/50 font-bold text-xs transition-colors shadow-md"
              >
                <span>View in Global Civic Map</span>
                <ExternalLink size={14} className="text-sky-400" />
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
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-[#292938]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedPhoto} alt="Zoomed view" className="w-full h-auto max-h-[85vh] object-contain" />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
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