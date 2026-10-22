import { Link } from 'react-router-dom';
import IssueMap from '../components/IssueMap';
import { PlusCircle, MapPin, Sparkles } from 'lucide-react';

const MapPage = () => {
  return (
    <div className="w-full space-y-6">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
            <MapPin size={14} className="text-sky-400" />
            <span>Interactive Spatial Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] font-display">
            Live Civic Infrastructure Map
          </h1>
          <p className="text-[#A1A1B5] text-sm mt-0.5">
            Explore reported municipal incidents, real-time dispatch progress, and resolved hazard sites.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all active:scale-95 self-start sm:self-auto shrink-0"
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
