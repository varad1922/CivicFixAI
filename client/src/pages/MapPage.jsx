import { Link } from 'react-router-dom';
import IssueMap from '../components/IssueMap';
import { PlusCircle, MapPin, Sparkles } from 'lucide-react';

const MapPage = () => {
  return (
    <div className="w-full space-y-6">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">
            <MapPin size={14} className="text-emerald-600" />
            <span>Interactive Spatial Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#122B22] font-display">
            Live Civic Infrastructure Map
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Explore reported municipal incidents, real-time dispatch progress, and resolved hazard sites.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#122B22] hover:bg-[#1A3E31] text-white font-bold text-xs shadow-md transition-all active:scale-95 self-start sm:self-auto shrink-0"
        >
          <PlusCircle size={16} />
          <span>Report New Hazard</span>
        </Link>
      </div>

      {/* Main Map Component */}
      <IssueMap />
    </div>
  );
};

export default MapPage;
