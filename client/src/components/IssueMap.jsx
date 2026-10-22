import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { issuesApi } from '../services/api';
import { MAP_LAYERS } from '../services/mapsService';
import IssueStatusBadge from './IssueStatusBadge';
import {
  Crosshair,
  ExternalLink,
  RefreshCw,
  Layers
} from 'lucide-react';

// Default Leaflet icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom User Location Pin with electric-blue radar animation
const userIcon = new L.DivIcon({
  className: 'user-location-pin',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="
        position: absolute;
        inset: -8px;
        background: rgba(56, 189, 248, 0.4);
        border-radius: 50%;
        animation: pulseGlow 2s infinite ease-in-out;
      "></div>
      <div style="
        width: 24px;
        height: 24px;
        background: #38BDF8;
        border: 3px solid #07070B;
        border-radius: 50%;
        box-shadow: 0 0 15px #38BDF8;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Status marker icons with neon glows
const createStatusMarker = (status) => {
  let color = '#F59E0B'; // Reported neon amber
  let glowColor = 'rgba(245, 158, 11, 0.8)';

  if (status === 'In Progress' || status === 'Under Review' || status === 'Assigned') {
    color = '#38BDF8'; // In Progress electric blue
    glowColor = 'rgba(56, 189, 248, 0.8)';
  } else if (status === 'Resolved' || status === 'Closed') {
    color = '#A855F7'; // Resolved neon purple
    glowColor = 'rgba(168, 85, 247, 0.8)';
  }

  return new L.DivIcon({
    className: 'custom-civic-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid #07070B;
        box-shadow: 0 0 12px ${glowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 150ms ease;
      ">
        <div style="width: 7px; height: 7px; background: #FFFFFF; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

const MapCenterer = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, map]);
  return null;
};

const IssueMap = () => {
  const [searchParams] = useSearchParams();
  const queryLat = parseFloat(searchParams.get('lat'));
  const queryLng = parseFloat(searchParams.get('lng'));

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentLayer, setCurrentLayer] = useState('DARK_CARTO');
  const [centerTarget, setCenterTarget] = useState(
    !isNaN(queryLat) && !isNaN(queryLng)
      ? [queryLat, queryLng]
      : [18.5204, 73.8567] // Default metro coordinates
  );

  const { socket } = useSocket();

  // Load map issues from backend (works with or without token)
  const fetchMapIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await issuesApi.getMapIssues();
      const valid = (Array.isArray(res.data) ? res.data : []).filter(
        (i) =>
          i.location?.coordinates &&
          !isNaN(i.location.coordinates[0]) &&
          !isNaN(i.location.coordinates[1])
      );
      setIssues(valid);

      // If no query param and we have issues, center on the most recent issue
      if (isNaN(queryLat) && valid.length > 0 && !userLocation) {
        setCenterTarget([valid[0].location.coordinates[1], valid[0].location.coordinates[0]]);
      }
    } catch (err) {
      console.warn('Map issues fetch fallback to public issues:', err.message);
      try {
        const fallbackRes = await issuesApi.getAll();
        const valid = (Array.isArray(fallbackRes.data) ? fallbackRes.data : []).filter(
          (i) => i.location?.coordinates
        );
        setIssues(valid);
      } catch (e) {
        console.error('All issue queries failed:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [queryLat, userLocation]);

  useEffect(() => {
    fetchMapIssues();
  }, [fetchMapIssues]);

  // Request browser geolocation for the user marker
  const locateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setCenterTarget(coords);
      },
      (err) => {
        console.warn('User location denied:', err.message);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  // Real-time socket updates for map markers
  useEffect(() => {
    if (!socket) return;

    const handleNewIssue = (newIssue) => {
      if (newIssue.location?.coordinates) {
        setIssues((prev) => {
          if (prev.some((i) => i._id === newIssue._id)) return prev;
          return [newIssue, ...prev];
        });
      }
    };

    const handleIssueUpdate = (updated) => {
      setIssues((prev) =>
        prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i))
      );
    };

    socket.on('issue:map:new', handleNewIssue);
    socket.on('issue:assigned', handleNewIssue);
    socket.on('issue:updated', handleIssueUpdate);
    socket.on('issue:status:updated', handleIssueUpdate);

    return () => {
      socket.off('issue:map:new', handleNewIssue);
      socket.off('issue:assigned', handleNewIssue);
      socket.off('issue:updated', handleIssueUpdate);
      socket.off('issue:status:updated', handleIssueUpdate);
    };
  }, [socket]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set(issues.map((i) => i.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'reported' && issue.status !== 'Reported') return false;
        if (
          statusFilter === 'in-progress' &&
          issue.status !== 'In Progress' &&
          issue.status !== 'Under Review' &&
          issue.status !== 'Assigned'
        )
          return false;
        if (
          statusFilter === 'resolved' &&
          issue.status !== 'Resolved' &&
          issue.status !== 'Closed'
        )
          return false;
      }
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
      return true;
    });
  }, [issues, statusFilter, categoryFilter]);

  return (
    <div className="relative w-full h-[650px] md:h-[720px] rounded-3xl overflow-hidden border border-[#292938] shadow-2xl shadow-purple-950/20 bg-[#07070B] flex flex-col">
      {/* Floating Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Filter Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#151520]/90 backdrop-blur-md border border-[#292938] shadow-xl overflow-x-auto max-w-full">
          {[
            { key: 'all', label: `All (${issues.length})` },
            { key: 'reported', label: 'Reported' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-[#A1A1B5] hover:text-[#F5F3FF] hover:bg-[#101018]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="ml-1 px-2.5 py-1.5 rounded-xl bg-[#101018] text-[#F5F3FF] text-xs font-bold border border-[#292938] focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-[#101018]">All Categories</option>
              {categories
                .filter((c) => c !== 'all')
                .map((c) => (
                  <option key={c} value={c} className="bg-[#101018]">
                    {c}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Right Tools */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Map Layer Selector */}
          <div className="relative">
            <select
              value={currentLayer}
              onChange={(e) => setCurrentLayer(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-[#151520]/90 backdrop-blur-md border border-[#292938] text-[#F5F3FF] text-xs font-bold hover:border-purple-500/50 shadow-xl focus:outline-none transition-all cursor-pointer"
              title="Change Map Style"
            >
              <option value="DARK_CARTO" className="bg-[#101018]">Dark Neon Map</option>
              <option value="GOOGLE_ROAD" className="bg-[#101018]">Google Roadmap</option>
              <option value="GOOGLE_SATELLITE" className="bg-[#101018]">Google Satellite</option>
            </select>
          </div>

          <button
            onClick={locateUser}
            className="p-3 rounded-2xl bg-[#151520]/90 backdrop-blur-md border border-[#292938] text-[#F5F3FF] hover:text-sky-400 hover:border-sky-500/50 shadow-xl transition-all"
            title="Center on My Location"
          >
            <Crosshair size={18} />
          </button>
          <button
            onClick={fetchMapIssues}
            disabled={loading}
            className="p-3 rounded-2xl bg-[#151520]/90 backdrop-blur-md border border-[#292938] text-[#F5F3FF] hover:text-purple-400 hover:border-purple-500/50 shadow-xl transition-all"
            title="Refresh Map Markers"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map with Google Maps / Dark Carto Layers */}
      <MapContainer
        center={centerTarget}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#07070B' }}
        className="z-0"
      >
        <TileLayer
          key={currentLayer}
          attribution={MAP_LAYERS[currentLayer]?.attribution || MAP_LAYERS.DARK_CARTO.attribution}
          url={MAP_LAYERS[currentLayer]?.url || MAP_LAYERS.DARK_CARTO.url}
          maxZoom={MAP_LAYERS[currentLayer]?.maxZoom || 20}
        />

        <MapCenterer center={centerTarget} zoom={14} />

        {/* User Current Location Marker */}
        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div className="p-2 text-center text-xs font-bold text-sky-400">Your Current Position</div>
              </Popup>
            </Marker>
            <Circle
              center={userLocation}
              radius={200}
              pathOptions={{
                color: '#38BDF8',
                fillColor: '#38BDF8',
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            />
          </>
        )}

        {/* Real Issue Pins */}
        {filteredIssues.map((issue) => {
          const lat = issue.location.coordinates[1];
          const lng = issue.location.coordinates[0];
          const markerIcon = createStatusMarker(issue.status);

          return (
            <Marker key={issue._id} position={[lat, lng]} icon={markerIcon}>
              <Popup className="civic-custom-popup">
                <div className="p-3 w-56 space-y-2 bg-[#151520] text-[#F5F3FF] rounded-xl">
                  {issue.images?.[0]?.url && (
                    <div className="h-28 w-full rounded-xl overflow-hidden mb-2 bg-[#101018] border border-[#292938]">
                      <img
                        src={issue.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <IssueStatusBadge status={issue.status} size="sm" />
                    <span className="text-[10px] font-bold text-[#A1A1B5]">
                      {issue.category}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-[#F5F3FF] text-xs line-clamp-2 leading-tight">
                    {issue.title}
                  </h4>

                  <div className="pt-2 border-t border-[#292938] flex items-center justify-between text-[11px]">
                    <span className="text-[#A1A1B5]">
                      {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <Link
                      to={`/issues/${issue._id}`}
                      className="text-purple-400 hover:text-purple-300 font-extrabold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Case File</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] p-2.5 rounded-2xl bg-[#151520]/90 backdrop-blur-md border border-[#292938] shadow-xl flex items-center gap-4 text-xs font-semibold text-[#F5F3FF]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 border border-[#07070B] shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="text-amber-300">Reported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-400 border border-[#07070B] shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="text-sky-300">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500 border border-[#07070B] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <span className="text-purple-300">Resolved</span>
        </div>
      </div>
    </div>
  );
};

export default IssueMap;
