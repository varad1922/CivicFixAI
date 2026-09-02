import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/issues/${id}`);
        setIssue(res.data);
        setLoading(false);
      } catch (err) {
        setError('Issue not found');
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  if (loading) return <div className="text-center mt-12">Loading issue details...</div>;
  if (error) return <div className="text-center mt-12 text-danger">{error}</div>;
  if (!issue) return null;

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-paper text-ink p-6 rounded shadow-sm border border-deep-green/10">
      <div className="mb-4">
        <Link to="/map" className="text-info-blue hover:underline">&larr; Back to Map</Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold text-deep-green mb-2">{issue.title}</h1>
          <div className="flex gap-4 mb-4 text-sm text-ink/80 border-b border-deep-green/20 pb-4">
            <span className="font-semibold">{issue.category}</span>
            <span>Severity: <strong className={issue.severity === 'Critical' ? 'text-danger' : 'text-orange'}>{issue.severity}</strong></span>
            <span>Status: <strong>{issue.status}</strong></span>
            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>

          {issue.images && issue.images.length > 0 && (
            <img src={issue.images[0].url} alt={issue.title} className="w-full h-auto max-h-96 object-cover rounded mb-6 shadow-sm" />
          )}

          <h3 className="text-xl font-semibold mb-2">Description</h3>
          <p className="whitespace-pre-wrap leading-relaxed">{issue.description}</p>

          {issue.aiAnalysis && issue.aiAnalysis.category && (
            <div className="mt-8 bg-sand/50 p-4 rounded border border-deep-green/10">
              <h4 className="font-bold text-deep-green mb-2 flex items-center gap-2">
                <span>🤖</span> AI Analysis Summary
              </h4>
              <p className="text-sm"><strong>Suggested Category:</strong> {issue.aiAnalysis.category}</p>
              <p className="text-sm"><strong>Safety Impact:</strong> {issue.aiAnalysis.safetyImpact}</p>
            </div>
          )}
        </div>

        <div className="md:w-1/3">
          <div className="bg-sand p-4 rounded shadow-sm mb-6">
            <h3 className="font-bold text-deep-green mb-4">Location</h3>
            {issue.location && issue.location.coordinates && (
              <div className="h-64 w-full rounded overflow-hidden">
                <MapContainer 
                  center={[issue.location.coordinates[1], issue.location.coordinates[0]]} 
                  zoom={15} 
                  scrollWheelZoom={false} 
                  className="h-full w-full"
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[issue.location.coordinates[1], issue.location.coordinates[0]]} />
                </MapContainer>
              </div>
            )}
          </div>
          
          <div className="bg-sand p-4 rounded shadow-sm">
            <h3 className="font-bold text-deep-green mb-4">Reported By</h3>
            <div className="flex items-center gap-3">
              {issue.reportedBy?.avatar ? (
                <img src={issue.reportedBy.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-deep-green text-paper flex items-center justify-center font-bold">
                  {issue.reportedBy?.name?.charAt(0) || '?'}
                </div>
              )}
              <span className="font-medium">{issue.reportedBy?.name || 'Anonymous User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
