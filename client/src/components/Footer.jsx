import { Link } from 'react-router-dom';
import { Sparkles, Shield, Cpu, Activity, Globe, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0E1A16] text-stone-300 border-t border-emerald-950/60 pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          {/* Brand info */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5">
                <div className="w-full h-full bg-[#122B22] rounded-[10px] flex items-center justify-center text-emerald-400">
                  <Sparkles size={16} />
                </div>
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight font-display">
                CivicFix<span className="text-emerald-400 font-bold ml-0.5">AI</span>
              </span>
            </Link>
            <p className="text-stone-400 text-sm max-w-sm mb-4 leading-relaxed">
              Autonomous civic infrastructure monitoring and intelligent complaint dispatching.
              Bridging citizens with city engineers for clean, safe, resilient communities.
            </p>
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CivicFix Core API & AI Engine Operational</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 font-display">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-emerald-400 transition-colors">
                  Live Issue Map
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">
                  My Activity
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Intelligence */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 font-display">
              Powered By
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li className="flex items-center gap-1.5">
                <Cpu size={14} className="text-emerald-400" />
                <span>Google Gemini AI</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Globe size={14} className="text-teal-400" />
                <span>Leaflet & OSM</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Activity size={14} className="text-blue-400" />
                <span>Socket.IO Live Events</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield size={14} className="text-amber-400" />
                <span>PostgreSQL & RLS</span>
              </li>
            </ul>
          </div>

          {/* Governance & Trust */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 font-display">
              Municipalities
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Authority Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">
                  Department Onboarding
                </Link>
              </li>
              <li>
                <a href="#transparency" className="hover:text-emerald-400 transition-colors">
                  Public Transparency
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-emerald-950/70 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p>© {new Date().getFullYear()} CivicFix AI. Built for modern civic impact.</p>
          <div className="flex items-center gap-4">
            <span className="text-stone-400">Next-Gen Municipal SaaS</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Community First</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
