import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const IssueMap = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/issues`);
        setIssues(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch issues', err);
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  if (loading) return <div>Loading Map...</div>;

  const defaultCenter = [40.7128, -74.0060]; // e.g. NY

  return (
    <div className="h-[600px] w-full rounded overflow-hidden shadow-sm border border-deep-green/10">
      <MapContainer 
        center={issues.length > 0 ? [issues[0].location.coordinates[1], issues[0].location.coordinates[0]] : defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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
  );
};

export default IssueMap;
