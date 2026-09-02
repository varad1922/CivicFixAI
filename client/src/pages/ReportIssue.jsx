import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
            address: '' // could reverse geocode here
          }
        });
        setLoading(false);
        nextStep();
      },
      () => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const analyzeIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload Image
      const uploadData = new FormData();
      uploadData.append('image', formData.image);
      
      const uploadRes = await axios.post('http://localhost:5000/api/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      const imageUrl = uploadRes.data.url;

      // 2. Analyze Image
      const aiRes = await axios.post('http://localhost:5000/api/ai/analyze-issue', { imageUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormData({
        ...formData,
        aiAnalysis: aiRes.data,
        title: aiRes.data.suggestedTitle || '',
        description: aiRes.data.suggestedDescription || '',
        category: aiRes.data.category || 'Other',
        severity: aiRes.data.severity || 'Medium',
        image: uploadRes.data // save the uploaded details instead of file
      });
      setLoading(false);
      nextStep();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const submitIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      const issueData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        images: formData.image?.url ? [formData.image] : [],
        location: formData.location,
        aiAnalysis: formData.aiAnalysis
      };

      await axios.post('http://localhost:5000/api/issues', issueData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoading(false);
      navigate('/dashboard'); // or to issue detail
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-paper text-ink p-6 rounded shadow-sm border border-deep-green/10">
      <h2 className="text-3xl font-bold text-deep-green mb-6 border-b border-deep-green/20 pb-2">Report an Issue</h2>
      
      {error && <div className="bg-danger text-paper p-3 rounded mb-4">{error}</div>}
      
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 1: Capture the problem</h3>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-sand file:text-deep-green hover:file:bg-sand/80"/>
          {formData.imagePreview && <img src={formData.imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded" />}
          <button onClick={nextStep} disabled={!formData.image} className="bg-deep-green text-paper px-4 py-2 rounded hover:bg-civic-green disabled:opacity-50">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 2: Locate the problem</h3>
          <p>We need your location to accurately map the issue.</p>
          <div className="flex gap-4">
            <button onClick={prevStep} className="bg-sand text-ink px-4 py-2 rounded hover:bg-sand/80">Back</button>
            <button onClick={getLocation} className="bg-deep-green text-paper px-4 py-2 rounded hover:bg-civic-green">
              {loading ? 'Locating...' : 'Use My Location'}
            </button>
            {formData.location && <button onClick={nextStep} className="bg-orange text-paper px-4 py-2 rounded">Skip (Already located)</button>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 3: Analyze Issue</h3>
          <p>Let our AI suggest categories and severity based on your image.</p>
          <div className="flex gap-4">
            <button onClick={prevStep} className="bg-sand text-ink px-4 py-2 rounded hover:bg-sand/80">Back</button>
            <button onClick={analyzeIssue} className="bg-deep-green text-paper px-4 py-2 rounded hover:bg-civic-green">
              {loading ? 'Analyzing...' : 'Analyze Issue'}
            </button>
            <button onClick={nextStep} className="text-deep-green underline pt-2">Skip AI Analysis</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 4: Review and Submit</h3>
          <div>
            <label className="block text-sm font-semibold">Title</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-deep-green/30 rounded bg-paper" />
          </div>
          <div>
            <label className="block text-sm font-semibold">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-deep-green/30 rounded bg-paper" rows="4" />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-semibold">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-deep-green/30 rounded bg-paper">
                {['Pothole', 'Garbage Accumulation', 'Water Leakage', 'Broken Streetlight', 'Drainage Issue', 'Damaged Road', 'Illegal Dumping', 'Traffic Signal Issue', 'Public Property Damage', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-semibold">Severity</label>
              <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className="w-full p-2 border border-deep-green/30 rounded bg-paper">
                {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button onClick={prevStep} className="bg-sand text-ink px-4 py-2 rounded hover:bg-sand/80">Back</button>
            <button onClick={submitIssue} disabled={loading} className="bg-orange text-paper px-6 py-2 rounded hover:bg-orange/90 font-bold">
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportIssue;
