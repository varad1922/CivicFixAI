import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Loader2,
  ExternalLink
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

// Custom neon pin for manual picker
const customPickerIcon = new L.DivIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      background-color: #A855F7;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid #07070B;
      box-shadow: 0 0 15px #A855F7;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: #FFFFFF; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const LocationPickerMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={customPickerIcon} /> : null;
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
    manualCoords: [18.5204, 73.8567], // Default metro coordinates
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
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#A855F7', '#38BDF8', '#C084FC', '#818CF8'],
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
    <div className="max-w-3xl mx-auto py-6 text-[#F5F3FF]">
      {/* Step Tracker Header */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Report an Issue • Step {step} of 4
            </span>
            <span className="text-xs text-[#A1A1B5] font-semibold">
              {step === 1 && 'Photo Capture'}
              {step === 2 && 'Location Pin'}
              {step === 3 && 'AI Assistant Inspection'}
              {step === 4 && 'Review & Dispatch'}
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="h-2 w-full bg-[#101018] border border-[#292938] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Wizard Card */}
      <div className="bg-[#151520]/95 backdrop-blur-xl rounded-3xl border border-[#292938] shadow-2xl shadow-purple-950/30 p-6 sm:p-10 relative overflow-hidden">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-6">
            <AlertTriangle size={18} className="shrink-0 text-rose-400 mt-0.5" />
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
              <h2 className="text-2xl font-extrabold text-[#F5F3FF] font-display">
                Upload a Photo of the Problem
              </h2>
              <p className="text-[#A1A1B5] text-sm mt-1">
                Clear photographs enable our AI to categorize severity and automatically dispatch
                the correct municipal repair crew.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                formData.imagePreview
                  ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                  : 'border-[#292938] hover:border-purple-500/50 hover:bg-[#101018]'
              }`}
            >
              {formData.imagePreview ? (
                <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-purple-500/40 shadow-xl">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                    <Camera size={16} /> Click to change photo
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Upload size={28} />
                  </div>
                  <h3 className="font-bold text-[#F5F3FF] text-base mb-1">
                    Click or drag image file here
                  </h3>
                  <p className="text-[#A1A1B5] text-xs max-w-xs">
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
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
              <h2 className="text-2xl font-extrabold text-[#F5F3FF] font-display">
                Confirm Incident Location
              </h2>
              <p className="text-[#A1A1B5] text-sm mt-1">
                Accurate coordinates ensure city crews find the exact pothole or hazard without
                delays.
              </p>
            </div>

            {!manualMapOpen ? (
              <div className="p-8 rounded-3xl bg-[#101018] border border-[#292938] text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                  <MapPin size={26} />
                </div>
                <h3 className="text-lg font-bold text-[#F5F3FF]">
                  {formData.location?.address || 'Acquire GPS Geolocation'}
                </h3>
                <p className="text-xs text-[#A1A1B5] max-w-sm mx-auto">
                  We can auto-detect your location via browser GPS, or you can drop a pin manually on
                  the interactive map.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all active:scale-95"
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#151520] text-[#F5F3FF] border border-[#292938] font-bold text-sm hover:border-purple-500/40 transition-colors"
                  >
                    <span>Pick on Map Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1B5]">
                  <span>Click anywhere on the map to place the issue pin:</span>
                  <span className="text-purple-400 font-mono font-bold">
                    [{formData.manualCoords[0].toFixed(4)}, {formData.manualCoords[1].toFixed(4)}]
                  </span>
                </div>

                <div className="h-72 w-full rounded-2xl overflow-hidden border border-[#292938] shadow-inner bg-[#07070B]">
                  <MapContainer
                    center={formData.manualCoords}
                    zoom={14}
                    style={{ height: '100%', width: '100%', background: '#07070B' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#A1A1B5] hover:bg-[#101018]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleManualLocationConfirm}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                  >
                    Confirm Pin Location
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#292938]">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A1B5] hover:text-[#F5F3FF]"
              >
                <ArrowLeft size={16} /> Back
              </button>
              {formData.location && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)]"
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
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30 mb-2 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                <Sparkles size={14} className="text-purple-400" /> Gemini Vision Intelligence
              </div>
              <h2 className="text-2xl font-extrabold text-[#F5F3FF] font-display">
                AI Issue Inspection
              </h2>
              <p className="text-[#A1A1B5] text-sm mt-1">
                Our vision intelligence analyzes your photo to classify the problem, gauge safety
                impact, and verify no duplicates were already reported nearby.
              </p>
            </div>

            {!formData.aiAnalysis ? (
              <div className="p-8 rounded-3xl bg-[#101018] border border-[#292938] text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-sky-400 p-0.5 mx-auto shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  <div className="w-full h-full bg-[#151520] rounded-[22px] flex items-center justify-center text-purple-400">
                    <Sparkles size={28} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#F5F3FF]">Run Automated Diagnostics</h3>
                <p className="text-xs text-[#A1A1B5] max-w-sm mx-auto">
                  Click below to scan the uploaded image. If AI is unavailable, you can skip
                  directly to manual entry.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={runAiAnalysis}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
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
                    className="text-xs font-bold text-[#A1A1B5] hover:text-[#F5F3FF] px-4 py-2"
                  >
                    Skip AI & Enter Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Results Card */}
                <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles size={15} className="text-purple-400" />
                      Gemini Inspection Completed
                    </span>
                    <span className="text-xs font-extrabold text-purple-200 bg-purple-600/30 border border-purple-500/40 px-2.5 py-0.5 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                      {formData.aiAnalysis.confidence}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-[#101018] rounded-xl border border-[#292938]">
                      <span className="text-[11px] font-bold text-[#A1A1B5] uppercase block">
                        Detected Category
                      </span>
                      <span className="text-sm font-extrabold text-[#F5F3FF] mt-0.5 block">
                        {formData.aiAnalysis.category}
                      </span>
                    </div>

                    <div className="p-3 bg-[#101018] rounded-xl border border-[#292938]">
                      <span className="text-[11px] font-bold text-[#A1A1B5] uppercase block">
                        Suggested Severity
                      </span>
                      <span className="text-sm font-extrabold text-rose-400 mt-0.5 block">
                        {formData.aiAnalysis.severity}
                      </span>
                    </div>
                  </div>

                  {formData.aiAnalysis.safetyImpact && (
                    <div className="p-3 bg-[#101018] rounded-xl border border-[#292938] text-xs">
                      <span className="font-bold text-[#F5F3FF]">Safety Impact: </span>
                      <span className="text-[#A1A1B5]">{formData.aiAnalysis.safetyImpact}</span>
                    </div>
                  )}
                </div>

                {/* Duplicates Warning if found */}
                {duplicates.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={16} className="text-amber-400" />
                      <span>Possible duplicate report nearby:</span>
                    </div>
                    <ul className="space-y-1 pl-5 list-disc text-amber-200/90">
                      {duplicates.map((dup) => (
                        <li key={dup._id}>
                          <Link
                            to={`/issues/${dup._id}`}
                            target="_blank"
                            className="underline font-semibold hover:text-white inline-flex items-center gap-1"
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

            <div className="flex items-center justify-between pt-4 border-t border-[#292938]">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A1B5] hover:text-[#F5F3FF]"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)]"
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
              <h2 className="text-2xl font-extrabold text-[#F5F3FF] font-display">
                Review & Confirm Report
              </h2>
              <p className="text-[#A1A1B5] text-sm mt-1">
                You can fine-tune the title, description, or category before dispatching to city
                engineers.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="title">
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
                  placeholder="e.g. Hazardous deep pothole on Main Street"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#101018]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s} className="bg-[#101018]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Summary Pill Preview */}
              <div className="p-4 rounded-2xl bg-[#101018] border border-[#292938] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#A1A1B5]">
                  <MapPin size={15} className="text-sky-400" />
                  <span>
                    Location:{' '}
                    <strong className="text-[#F5F3FF]">
                      {formData.location?.address ||
                        `Coordinates: ${formData.location?.coordinates?.join(', ')}`}
                    </strong>
                  </span>
                </div>
                <span className="text-purple-400 font-bold">Ready for Dispatch</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#292938]">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A1B5] hover:text-[#F5F3FF]"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={handleSubmitIssue}
                disabled={loading || !formData.title.trim()}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 disabled:opacity-50"
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
            <div className="w-20 h-20 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border-4 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <CheckCircle2 size={44} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                Civic Report Successfully Dispatched
              </span>
              <h2 className="text-3xl font-extrabold text-[#F5F3FF] mt-3 font-display">
                Thank You for Improving Your City!
              </h2>
              <p className="text-[#A1A1B5] text-sm max-w-md mx-auto mt-2">
                Your incident has been recorded and automatically routed to the responsible
                department. You will receive live updates as authorities inspect and resolve it.
              </p>
            </div>

            {createdIssueId && (
              <div className="p-4 rounded-2xl bg-[#101018] border border-[#292938] max-w-sm mx-auto text-xs font-medium text-[#A1A1B5]">
                <span>Tracking Reference ID: </span>
                <strong className="text-purple-300 font-mono">#{createdIssueId}</strong>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {createdIssueId && (
                <Link
                  to={`/issues/${createdIssueId}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                >
                  View Case File
                </Link>
              )}
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#101018] border border-[#292938] text-[#F5F3FF] font-bold text-sm hover:border-purple-500/50"
              >
                Go to My Dashboard
              </Link>
              <Link
                to="/map"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#101018] border border-[#292938] text-[#F5F3FF] font-bold text-sm hover:border-sky-500/50"
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
