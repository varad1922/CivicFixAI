import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [manualMapOpen, setManualMapOpen] = useState(false);
  const [manualPosition, setManualPosition] = useState(null);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    location: null, // { coordinates: [lng, lat], address: '' }
    aiAnalysis: null,
    title: '',
    description: '',
    category: 'Other',
    severity: 'Medium'
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          location: {
            coordinates: [position.coords.longitude, position.coords.latitude],
            address: '' 
          }
        });
        setLoading(false);
        nextStep();
      },
      () => {
        setError('Unable to retrieve your location. Please select it manually on the map.');
        setLoading(false);
        setManualMapOpen(true);
      }
    );
  };

  const handleManualLocationConfirm = () => {
    if (!manualPosition) {
      setError('Please tap on the map to select a location');
      return;
    }
    setFormData({
      ...formData,
      location: {
        coordinates: [manualPosition[1], manualPosition[0]],
        address: ''
      }
    });
    setManualMapOpen(false);
    nextStep();
  };

  const analyzeIssue = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.image) throw new Error('Please add an issue photo first.');
      if (!formData.location?.coordinates) throw new Error('Please select the issue location first.');

      // Upload first. The uploaded object is retained even if Gemini is unavailable,
      // so the user can still submit the report manually without uploading twice.
      let uploadedImage = formData.image;
      if (formData.image instanceof File) {
        const uploadData = new FormData();
        uploadData.append('image', formData.image);
        const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        uploadedImage = uploadRes.data;
        setFormData(prev => ({ ...prev, image: uploadedImage }));
      }

      try {
        const aiRes = await axios.post(
          `${import.meta.env.VITE_API_URL}/ai/analyze-issue`,
          { imageUrl: uploadedImage.url },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const analysis = aiRes.data;
        setFormData(prev => ({
          ...prev,
          image: uploadedImage,
          aiAnalysis: analysis,
          title: analysis.suggestedTitle || prev.title,
          description: analysis.suggestedDescription || prev.description,
          category: analysis.category || prev.category,
          severity: analysis.severity || prev.severity
        }));

        try {
          const dupRes = await axios.post(
            `${import.meta.env.VITE_API_URL}/issues/check-duplicates`,
            { coordinates: formData.location.coordinates, category: analysis.category || 'Other' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setDuplicates(dupRes.data || []);
        } catch (duplicateError) {
          console.warn('Duplicate check unavailable:', duplicateError.response?.data?.message || duplicateError.message);
        }
      } catch (aiError) {
        // AI is assistive, never a prerequisite for filing a civic report.
        console.warn('AI analysis unavailable:', aiError.response?.data?.message || aiError.message);
        setFormData(prev => ({ ...prev, image: uploadedImage, aiAnalysis: null }));
        setError('AI analysis is unavailable right now. You can continue manually and still submit the report.');
      }

      setLoading(false);
      nextStep();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to prepare the report.');
      setLoading(false);
    }
  };

  const submitIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      let finalImage = formData.image;
      
      // If image is a File (has no url), we need to upload it now
      if (finalImage && !finalImage.url && finalImage instanceof File) {
        const uploadData = new FormData();
        uploadData.append('image', finalImage);
        
        const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        finalImage = uploadRes.data;
        setFormData(prev => ({ ...prev, image: finalImage }));
      }

      const issueData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        images: finalImage?.url ? [finalImage] : [],
        location: formData.location,
        aiAnalysis: formData.aiAnalysis
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/issues`, issueData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoading(false);
      setStep(5); // Transition to success state
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4 md:mt-8 bg-paper text-ink p-4 md:p-8 rounded-xl shadow-sm border border-deep-green/10">
      <h2 className="text-2xl md:text-3xl font-bold text-deep-green mb-6 border-b border-deep-green/10 pb-4">Report an Issue</h2>
      
      {/* Progress Indicator */}
      {step < 5 && (
        <div className="flex justify-between mb-8 relative px-2">
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-deep-green/10 -z-10 transform -translate-y-1/2 rounded"></div>
          <div className="absolute top-1/2 left-4 h-1 bg-deep-green -z-10 transform -translate-y-1/2 transition-all duration-300 rounded" style={{ width: `calc(${((step - 1) / 3) * 100}% - 2rem)` }}></div>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-deep-green text-paper shadow-md' : 'bg-sand text-ink/40 border border-deep-green/20'}`}>
              {s}
            </div>
          ))}
        </div>
      )}
      
      {error && <div className="bg-danger text-paper p-4 rounded-lg mb-6 shadow-sm font-medium">{error}</div>}
      
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-deep-green mb-2">Step 1: Capture the problem</h3>
            <p className="text-ink/70">Upload a clear photo of the issue to help authorities identify it.</p>
          </div>
          
          <div className="bg-sand/30 p-6 rounded-xl border border-dashed border-deep-green/30 flex flex-col items-center justify-center relative min-h-[200px]">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            {!formData.imagePreview ? (
              <div className="text-center text-ink/60 pointer-events-none">
                <div className="bg-deep-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-deep-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <p className="font-semibold">Tap to take a photo or upload</p>
                <p className="text-xs mt-1">JPEG, PNG up to 10MB</p>
              </div>
            ) : (
              <img src={formData.imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg shadow-sm" />
            )}
          </div>
          
          <button onClick={nextStep} disabled={!formData.image} className="w-full bg-deep-green text-paper px-6 py-4 rounded-lg text-lg font-bold hover:bg-civic-green disabled:opacity-50 transition-colors shadow-md">
            Continue to Location
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-deep-green mb-2">Step 2: Locate the problem</h3>
            <p className="text-ink/70">We need your location to accurately map the issue for authorities.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button onClick={getLocation} className="w-full bg-deep-green text-paper px-6 py-4 rounded-lg text-lg font-bold hover:bg-civic-green shadow-md flex justify-center items-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-paper border-t-transparent rounded-full"></span> Locating...</span>
              ) : (
                'Use My Current Location'
              )}
            </button>

            {!manualMapOpen && (
              <button onClick={() => setManualMapOpen(true)} className="w-full bg-paper border-2 border-deep-green text-deep-green px-6 py-4 rounded-lg text-lg font-bold hover:bg-sand/50 transition-colors shadow-sm">
                Select Location Manually
              </button>
            )}

            {manualMapOpen && (
              <div className="border border-deep-green/20 p-2 rounded-lg bg-sand shadow-inner animate-in fade-in zoom-in-95 duration-300">
                <p className="text-sm font-semibold mb-2 text-deep-green">Tap on the map to pinpoint the issue</p>
                <div className="h-64 w-full rounded overflow-hidden relative z-0">
                  <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={manualPosition} setPosition={setManualPosition} />
                  </MapContainer>
                </div>
                <button onClick={handleManualLocationConfirm} className="w-full bg-civic-green text-paper px-4 py-3 rounded-lg font-bold hover:bg-civic-green/90 mt-2 shadow-sm">
                  Confirm Selected Location
                </button>
              </div>
            )}

            {formData.location && (
              <button onClick={nextStep} className="w-full bg-orange text-paper px-6 py-4 rounded-lg text-lg font-bold hover:bg-orange/90 shadow-md">
                Skip (Already Located)
              </button>
            )}
            <button onClick={prevStep} className="w-full bg-sand text-deep-green px-6 py-4 rounded-lg text-lg font-bold hover:bg-sand/80 transition-colors mt-2">
              Back to Photo
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-deep-green mb-2">Step 3: Analyze Issue</h3>
            <p className="text-ink/70">Let our AI suggest categories and severity based on your image to save you time.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button onClick={analyzeIssue} className="w-full bg-deep-green text-paper px-6 py-4 rounded-lg text-lg font-bold hover:bg-civic-green shadow-md flex justify-center items-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-paper border-t-transparent rounded-full"></span> Analyzing Image...</span>
              ) : (
                'Run AI Analysis'
              )}
            </button>
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <button onClick={prevStep} className="w-full md:w-1/2 bg-sand text-deep-green px-6 py-4 rounded-lg text-lg font-bold hover:bg-sand/80 transition-colors">
                Back
              </button>
              <button onClick={nextStep} className="w-full md:w-1/2 bg-paper border-2 border-deep-green text-deep-green px-6 py-4 rounded-lg text-lg font-bold hover:bg-sand/50 transition-colors">
                Continue manually
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-deep-green mb-2">Step 4: Review and Submit</h3>
            <p className="text-ink/70">Please review the details below. You can edit them if needed.</p>
          </div>
          
          {duplicates.length > 0 && (
            <div className="bg-amber/10 p-4 rounded-lg border border-amber/30">
              <h4 className="font-bold text-amber-600 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Similar Issues Nearby
              </h4>
              <ul className="space-y-2 mb-2">
                {duplicates.map(d => (
                  <li key={d._id} className="text-sm bg-paper p-2 rounded border border-amber/20 shadow-sm flex justify-between items-center">
                    <span className="font-semibold truncate mr-2">{d.title}</span>
                    <span className="text-xs bg-amber/20 text-amber-800 px-2 py-1 rounded">{d.status}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs italic text-ink/60">If your issue is already reported above, you may not need to submit this.</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-deep-green mb-1">Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50" placeholder="E.g., Large pothole near the main gate" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-deep-green mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50" rows="4" placeholder="Provide more details..." />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-bold text-deep-green mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50">
                  {['Pothole', 'Garbage Accumulation', 'Water Leakage', 'Broken Streetlight', 'Drainage Issue', 'Damaged Road', 'Illegal Dumping', 'Traffic Signal Issue', 'Public Property Damage', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-bold text-deep-green mb-1">Severity</label>
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50">
                  {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8 pt-4 border-t border-deep-green/10">
            <button onClick={prevStep} className="w-full md:w-1/3 bg-sand text-deep-green px-6 py-4 rounded-lg text-lg font-bold hover:bg-sand/80 transition-colors order-2 md:order-1">
              Back
            </button>
            <button onClick={submitIssue} disabled={loading} className="w-full md:w-2/3 bg-orange text-paper px-6 py-4 rounded-lg text-lg font-bold hover:bg-orange/90 shadow-md flex justify-center items-center gap-2 order-1 md:order-2">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-paper border-t-transparent rounded-full"></span> Submitting...</span>
              ) : (
                'Submit Issue'
              )}
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center py-8">
          <div className="w-24 h-24 bg-civic-green/20 text-civic-green rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-3xl font-extrabold text-deep-green mb-2">Issue Reported Successfully!</h3>
          <p className="text-ink/70 text-lg mb-8 max-w-md mx-auto">
            Thank you for helping improve the community. Authorities have been notified and you can track the progress on your dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="bg-deep-green text-paper px-8 py-4 rounded-lg text-lg font-bold hover:bg-civic-green shadow-md transition-all">
              View My Issues
            </button>
            <button onClick={() => {
              setStep(1);
              setFormData({
                image: null,
                imagePreview: null,
                location: null,
                aiAnalysis: null,
                title: '',
                description: '',
                category: 'Other',
                severity: 'Medium'
              });
            }} className="bg-sand text-deep-green border-2 border-deep-green px-8 py-4 rounded-lg text-lg font-bold hover:bg-deep-green/10 transition-all">
              Report Another Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportIssue;
