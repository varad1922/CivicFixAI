import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Custom Icon for User Location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper for Status Marker Icons
const getStatusIcon = (status) => {
  let color = '#f97316'; // orange for Reported
  if (status === 'In Progress' || status === 'Under Review' || status === 'Assigned') {
    color = '#3b82f6'; // blue for active
  } else if (status === 'Resolved' || status === 'Closed') {
    color = '#10b981'; // green for resolved
  }
  
  return new L.DivIcon({
    className: 'custom-status-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Component to programmatically center the map
const MapCenterer = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const IssueMap = () => {
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Finding your location...');
  const [locationError, setLocationError] = useState(false);

  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/issues/map`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIssues(res.data);
      } catch (err) {
        console.error('Failed to fetch issues', err);
      } finally {
        setLoadingIssues(false);
      }
    };
    if (token) fetchIssues();
  }, [token]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewIssue = (issue) => {
      setIssues((prev) => {
        if (prev.some(i => i._id === issue._id)) return prev;
        return [...prev, issue];
      });
    };

    const handleIssueUpdate = (updatedIssue) => {
      setIssues((prev) => prev.map(issue => issue._id === updatedIssue._id ? { ...issue, ...updatedIssue } : issue));
    };

    socket.on('issue:map:new', handleNewIssue);
    socket.on('issue:updated', handleIssueUpdate);

    return () => {
      socket.off('issue:map:new', handleNewIssue);
      socket.off('issue:updated', handleIssueUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('Location found');
      },
      (error) => {
        setLocationError(true);
        setLocationStatus('Location permission denied or unavailable.');
      },
      { timeout: 10000 }
    );
  }, []);

  const handleRetryLocation = () => {
    setLocationStatus('Finding your location...');
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('Location found');
        setLocationError(false);
      },
      (error) => {
        setLocationError(true);
        setLocationStatus('Location permission denied or unavailable.');
      },
      { timeout: 10000 }
    );
  };

  const defaultZoom = userLocation || issues.length > 0 ? 13 : 2;
  
  // Decide the center
  const center = userLocation || (issues.length > 0 ? [issues[0].location.coordinates[1], issues[0].location.coordinates[0]] : null);

  if (loadingIssues) return <div className="p-4 text-center">Loading issues map...</div>;

  return (
    <div className="flex flex-col h-full w-full">
      {locationError && (
        <div className="bg-amber/20 text-amber p-3 mb-2 flex justify-between items-center rounded text-sm md:text-base">
          <span>{locationStatus} The map is not using a fake fallback location.</span>
          <button onClick={handleRetryLocation} className="bg-amber text-paper px-3 py-1 rounded text-sm hover:bg-amber/90">Use My Location</button>
        </div>
      )}
      
      {!userLocation && !locationError && (
        <div className="bg-info-blue/10 text-info-blue p-3 mb-2 text-center rounded text-sm">
          {locationStatus}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 text-xs sm:text-sm px-2">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#f97316]"></span> Reported</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span> In Progress</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Resolved</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-4 bg-blue-500 clip-path-pin rounded-sm"></span> You</div>
      </div>
      
      <div className="h-[500px] md:h-[600px] w-full rounded overflow-hidden shadow-sm border border-deep-green/10 relative z-0 bg-sand flex items-center justify-center text-ink/60 font-semibold">
        {center ? (
          <MapContainer 
            center={center} 
            zoom={defaultZoom} 
            scrollWheelZoom={true} 
            className="h-full w-full"
          >
            <MapCenterer center={center} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <div className="font-bold">Your Current Location</div>
                </Popup>
              </Marker>
            )}

            {issues.map(issue => (
              issue.location && issue.location.coordinates && (
                <Marker 
                  key={issue._id} 
                  position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                  icon={getStatusIcon(issue.status)}
                >
                  <Popup>
                    <div className="text-ink w-48">
                      <h3 className="font-bold text-deep-green truncate">{issue.title}</h3>
                      <p className="text-sm my-1">{issue.category}</p>
                      <p className="text-xs font-semibold mb-2" style={{
                        color: issue.status === 'Resolved' || issue.status === 'Closed' ? '#10b981' : 
                               (issue.status === 'Reported' ? '#f97316' : '#3b82f6')
                      }}>
                        ● {issue.status.toUpperCase()}
                      </p>
                      <p className="text-xs text-ink/60 mb-2">Reported: {new Date(issue.createdAt).toLocaleDateString()}</p>
                      <Link to={`/issues/${issue._id}`} className="text-info-blue hover:underline text-sm font-semibold">View Details</Link>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        ) : (
          <div className="text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-ink/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-lg">Map location unavailable.</p>
            <p className="text-sm mt-2 max-w-md mx-auto">Please allow location access or submit a report to initialize the map.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueMap;
