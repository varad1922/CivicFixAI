import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { issuesApi, uploadApi, aiApi } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import confetti from 'canvas-confetti';
import {
  Camera,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';

// Fix for default Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const LocationPickerMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const MapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
};

const CATEGORIES = [
  'Pothole',
  'Garbage Accumulation',
  'Water Leakage',
  'Broken Streetlight',
  'Drainage Issue',
  'Damaged Road',
  'Illegal Dumping',
  'Traffic Signal Issue',
  'Public Property Damage',
  'Other',
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [manualMapOpen, setManualMapOpen] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState(null);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    uploadedImage: null, // { url, public_id }
    location: null, // { coordinates: [lng, lat], address: '' }
    aiAnalysis: null,
    title: '',
    description: '',
    category: 'Pothole',
    severity: 'Medium',
    manualCoords: [18.5204, 73.8567], // Default city coordinates (e.g. Pune/Metro)
  });

  const nextStep = () => {
    setError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Step 1: Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file must be smaller than 8MB');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
      setError(null);
    }
  };

  // Step 2: Location Handling
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please select manually on map.');
      setManualMapOpen(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        setFormData((prev) => ({
          ...prev,
          location: {
            coordinates: [lng, lat],
            address: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          },
          manualCoords: [lat, lng],
        }));
        setLoading(false);
        nextStep();
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err.message);
        setError('Unable to obtain GPS automatically. Please select the incident pin on the map.');
        setLoading(false);
        setManualMapOpen(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualLocationConfirm = () => {
    if (!formData.manualCoords) {
      setError('Please click on the map to place the issue pin.');
      return;
    }
    const [lat, lng] = formData.manualCoords;
    setFormData((prev) => ({
      ...prev,
      location: {
        coordinates: [lng, lat],
        address: `Map Pin: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      },
    }));
    setManualMapOpen(false);
    nextStep();
  };

  // Step 3: AI Analysis Execution
  const runAiAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.image) throw new Error('Please attach a photo of the civic issue.');
      if (!formData.location?.coordinates) throw new Error('Please select an issue location.');

      // 1. Upload image to Supabase storage via backend
      let uploaded = formData.uploadedImage;
      if (!uploaded && formData.image instanceof File) {
        const uploadRes = await uploadApi.uploadImage(formData.image);
        uploaded = uploadRes.data;
        setFormData((prev) => ({ ...prev, uploadedImage: uploaded }));
      }

      // 2. Call Gemini AI image analysis
      try {
        const aiRes = await aiApi.analyzeImage(uploaded.url);
        const analysis = aiRes.data;

        setFormData((prev) => ({
          ...prev,
          aiAnalysis: analysis,
          title: analysis.suggestedTitle || prev.title || `${analysis.category} Reported`,
          description: analysis.suggestedDescription || prev.description,
          category: analysis.category || prev.category,
          severity: analysis.severity || prev.severity,
        }));

        // 3. Check for nearby duplicate reports
        try {
          const dupRes = await issuesApi.checkDuplicates(
            formData.location.coordinates,
            analysis.category || 'Other'
          );
          setDuplicates(dupRes.data || []);
        } catch (dupErr) {
          console.warn('Duplicate check skipped:', dupErr.message);
        }
      } catch (aiErr) {
        // AI is assistive - never block report submission!
        console.warn('AI analysis skipped/failed:', aiErr.message);
        setError('AI analysis is currently unavailable. You can enter details manually.');
        setFormData((prev) => ({
          ...prev,
          title: prev.title || `${prev.category} Issue`,
          description: prev.description || 'Public infrastructure issue reported by citizen.',
        }));
      }

      setLoading(false);
      nextStep();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process photo.');
      setLoading(false);
    }
  };

  // Step 4: Final Submission
  const handleSubmitIssue = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) throw new Error('Issue title is required.');
      if (!formData.location?.coordinates) throw new Error('Location coordinates missing.');

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        images: formData.uploadedImage?.url ? [formData.uploadedImage] : [],
        location: formData.location,
        aiAnalysis: formData.aiAnalysis,
      };

      const res = await issuesApi.create(payload);
      const newIssue = res.data;
      setCreatedIssueId(newIssue?._id || newIssue?.id);
      setLoading(false);
      setStep(5); // Success step

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#2DD4BF', '#F97316', '#3B82F6'],
        });
      } catch (e) {
        // Ignore confetti error
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit issue report.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Step Tracker Header */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Report an Issue • Step {step} of 4
            </span>
            <span className="text-xs text-stone-400 font-semibold">
              {step === 1 && 'Photo Capture'}
              {step === 2 && 'Location Pin'}
              {step === 3 && 'AI Assistant Inspection'}
              {step === 4 && 'Review & Dispatch'}
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="h-2 w-full bg-stone-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Wizard Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-emerald-950/5 p-6 sm:p-10">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-6">
            <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* STEP 1: PHOTO CAPTURE & UPLOAD */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-extrabold text-[#122B22] font-display">
                Upload a Photo of the Problem
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Clear photographs enable our AI to categorize severity and automatically dispatch
                the correct municipal repair crew.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                formData.imagePreview
                  ? 'border-emerald-500/50 bg-emerald-50/20'
                  : 'border-stone-300 hover:border-emerald-500 hover:bg-stone-50/60'
              }`}
            >
              {formData.imagePreview ? (
                <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-emerald-400/40 shadow-md">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                    <Camera size={16} /> Click to change photo
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-100">
                    <Upload size={28} />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    Click or drag image file here
                  </h3>
                  <p className="text-stone-400 text-xs max-w-xs">
                    Supports JPG, PNG, WEBP up to 8MB. Live camera snapshot supported on mobile.
                  </p>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={nextStep}
                disabled={!formData.image}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#122B22] hover:bg-[#1A3E31] text-white font-bold text-sm shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span>Continue to Location</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: LOCATION PIN */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-extrabold text-[#122B22] font-display">
                Confirm Incident Location
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Accurate coordinates ensure city crews find the exact pothole or hazard without
                delays.
              </p>
            </div>

            {!manualMapOpen ? (
              <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200/80 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center mx-auto">
                  <MapPin size={26} />
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  {formData.location?.address || 'Acquire GPS Geolocation'}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  We can auto-detect your location via browser GPS, or you can drop a pin manually on
                  the interactive map.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Detecting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={16} />
                        <span>Use My Current Location</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualMapOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-stone-700 border border-stone-300 font-bold text-sm hover:bg-stone-100 transition-colors"
                  >
                    <span>Pick on Map Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                  <span>Click anywhere on the map to place the issue pin:</span>
                  <span className="text-emerald-700 font-bold">
                    [{formData.manualCoords[0].toFixed(4)}, {formData.manualCoords[1].toFixed(4)}]
                  </span>
                </div>

                <div className="h-72 w-full rounded-2xl overflow-hidden border border-stone-300 shadow-inner">
                  <MapContainer
                    center={formData.manualCoords}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapCenter center={formData.manualCoords} />
                    <LocationPickerMarker
                      position={formData.manualCoords}
                      setPosition={(coords) =>
                        setFormData((prev) => ({ ...prev, manualCoords: coords }))
                      }
                    />
                  </MapContainer>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setManualMapOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleManualLocationConfirm}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Confirm Pin Location
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft size={16} /> Back
              </button>
              {formData.location && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#122B22] text-white font-bold text-sm shadow-md"
                >
                  <span>Continue to AI Inspection</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: AI ASSISTANT ANALYSIS */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
                <Sparkles size={14} /> Gemini Vision Intelligence
              </div>
              <h2 className="text-2xl font-extrabold text-[#122B22] font-display">
                AI Issue Inspection
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Our vision intelligence analyzes your photo to classify the problem, gauge safety
                impact, and verify no duplicates were already reported nearby.
              </p>
            </div>

            {!formData.aiAnalysis ? (
              <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 mx-auto">
                  <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-emerald-600">
                    <Sparkles size={28} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-stone-900">Run Automated Diagnostics</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Click below to scan the uploaded image. If AI is unavailable, you can skip
                  directly to manual entry.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={runAiAnalysis}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Analyzing with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Analyze Image with AI</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="text-xs font-bold text-stone-500 hover:text-stone-800 px-4 py-2"
                  >
                    Skip AI & Enter Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Results Card */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles size={15} className="text-emerald-600" />
                      Gemini Inspection Completed
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      {formData.aiAnalysis.confidence}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                      <span className="text-[11px] font-bold text-stone-400 uppercase block">
                        Detected Category
                      </span>
                      <span className="text-sm font-extrabold text-stone-900 mt-0.5 block">
                        {formData.aiAnalysis.category}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                      <span className="text-[11px] font-bold text-stone-400 uppercase block">
                        Suggested Severity
                      </span>
                      <span className="text-sm font-extrabold text-rose-700 mt-0.5 block">
                        {formData.aiAnalysis.severity}
                      </span>
                    </div>
                  </div>

                  {formData.aiAnalysis.safetyImpact && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs">
                      <span className="font-bold text-stone-800">Safety Impact: </span>
                      <span className="text-stone-600">{formData.aiAnalysis.safetyImpact}</span>
                    </div>
                  )}
                </div>

                {/* Duplicates Warning if found */}
                {duplicates.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={16} className="text-amber-600" />
                      <span>Possible duplicate report nearby:</span>
                    </div>
                    <ul className="space-y-1 pl-5 list-disc text-amber-800">
                      {duplicates.map((dup) => (
                        <li key={dup._id}>
                          <Link
                            to={`/issues/${dup._id}`}
                            target="_blank"
                            className="underline font-semibold hover:text-amber-950 inline-flex items-center gap-1"
                          >
                            <span>{dup.title}</span>
                            <ExternalLink size={12} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#122B22] text-white font-bold text-sm shadow-md"
              >
                <span>Continue to Review</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-extrabold text-[#122B22] font-display">
                Review & Confirm Report
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                You can fine-tune the title, description, or category before dispatching to city
                engineers.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="title">
                  Incident Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  placeholder="e.g. Hazardous deep pothole on MG Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold text-stone-700 mb-1"
                    htmlFor="category"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-bold text-stone-700 mb-1"
                    htmlFor="severity"
                  >
                    Severity Rating
                  </label>
                  <select
                    id="severity"
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, severity: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-bold text-stone-700 mb-1"
                  htmlFor="description"
                >
                  Detailed Description & Hazards
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Provide context on road traffic impact, hazard level, landmarks..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              {/* Summary Pill Preview */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-600">
                  <MapPin size={15} className="text-emerald-700" />
                  <span>
                    Location:{' '}
                    <strong>
                      {formData.location?.address ||
                        `Coordinates: ${formData.location?.coordinates?.join(', ')}`}
                    </strong>
                  </span>
                </div>
                <span className="text-emerald-700 font-bold">Ready for Dispatch</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={handleSubmitIssue}
                disabled={loading || !formData.title.trim()}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Transmitting to Municipal Service...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Dispatch Report</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: CELEBRATION SUCCESS STATE */}
        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={44} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Civic Report Successfully Dispatched
              </span>
              <h2 className="text-3xl font-extrabold text-[#122B22] mt-3 font-display">
                Thank You for Improving Your City!
              </h2>
              <p className="text-stone-600 text-sm max-w-md mx-auto mt-2">
                Your incident has been recorded and automatically routed to the responsible
                department. You will receive live updates as authorities inspect and resolve it.
              </p>
            </div>

            {createdIssueId && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 max-w-sm mx-auto text-xs font-medium text-stone-600">
                <span>Tracking Reference ID: </span>
                <strong className="text-stone-900 font-mono">#{createdIssueId}</strong>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {createdIssueId && (
                <Link
                  to={`/issues/${createdIssueId}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#122B22] text-white font-bold text-sm shadow-md"
                >
                  View Case File
                </Link>
              )}
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 text-stone-800 font-bold text-sm hover:bg-stone-200/70"
              >
                Go to My Dashboard
              </Link>
              <Link
                to="/map"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-50"
              >
                View on Map
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReportIssue;
