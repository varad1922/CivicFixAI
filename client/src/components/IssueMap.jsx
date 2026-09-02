import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/issues`);
        setIssues(res.data);
      } catch (err) {
        console.error('Failed to fetch issues', err);
      } finally {
        setLoadingIssues(false);
      }
    };
    fetchIssues();
  }, []);

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

  const defaultCenter = [40.7128, -74.0060]; // Fallback NY
  
  // Decide the center
  const center = userLocation || (issues.length > 0 ? [issues[0].location.coordinates[1], issues[0].location.coordinates[0]] : defaultCenter);

  if (loadingIssues) return <div className="p-4 text-center">Loading issues map...</div>;

  return (
    <div className="flex flex-col h-full w-full">
      {locationError && (
        <div className="bg-amber/20 text-amber p-3 mb-2 flex justify-between items-center rounded text-sm md:text-base">
          <span>{locationStatus} We are showing a default location.</span>
          <button onClick={handleRetryLocation} className="bg-amber text-paper px-3 py-1 rounded text-sm hover:bg-amber/90">Use My Location</button>
        </div>
      )}
      
      {!userLocation && !locationError && (
        <div className="bg-info-blue/10 text-info-blue p-3 mb-2 text-center rounded text-sm">
          {locationStatus}
        </div>
      )}
      
      <div className="h-[500px] md:h-[600px] w-full rounded overflow-hidden shadow-sm border border-deep-green/10 relative z-0">
        <MapContainer 
          center={center} 
          zoom={13} 
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
              >
                <Popup>
                  <div className="text-ink">
                    <h3 className="font-bold text-deep-green">{issue.title}</h3>
                    <p className="text-sm my-1">{issue.category} • <span className={`font-semibold ${issue.severity === 'Critical' ? 'text-danger' : 'text-orange'}`}>{issue.severity}</span></p>
                    <Link to={`/issues/${issue._id}`} className="text-info-blue hover:underline text-sm">View Details</Link>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default IssueMap;
