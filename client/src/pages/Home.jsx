import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  Camera,
  Layers,
  ChevronRight,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { issuesApi } from '../services/api';
import IssueStatusBadge from '../components/IssueStatusBadge';

const Home = () => {
  const canvasRef = useRef(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Fetch real recent issues for the platform preview
  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const res = await issuesApi.getAll();
        if (isMounted) {
          setRecentIssues(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
        }
      } catch (err) {
        console.warn('Recent issues preview fallback:', err.message);
      } finally {
        if (isMounted) setLoadingIssues(false);
      }
    };
    fetchRecent();
    return () => {
      isMounted = false;
    };
  }, []);

  // Atmospheric Cosmic Civic Network Canvas Effect (Inspired by Gravitational Accretion / Network Orbit)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes circulating in concentric gravitational orbits
    const numParticles = 48;
    const particles = [];
    const centerX = width * 0.72;
    const centerY = height * 0.5;

    for (let i = 0; i < numParticles; i++) {
      const radius = 60 + Math.random() * 260;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.003 + Math.random() * 0.007) * (Math.random() > 0.5 ? 1 : -1);
      const size = 1.2 + Math.random() * 2.2;
      const color =
        i % 4 === 0
          ? 'rgba(16, 185, 129, ' // Emerald
          : i % 4 === 1
          ? 'rgba(45, 212, 191, ' // Teal
          : i % 4 === 2
          ? 'rgba(234, 88, 12, ' // Orange
          : 'rgba(59, 130, 246, '; // Blue

      particles.push({ radius, angle, speed, size, color, opacity: 0.2 + Math.random() * 0.7 });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const dynamicCenterX = width > 768 ? width * 0.75 : width * 0.5;
      const dynamicCenterY = width > 768 ? height * 0.5 : height * 0.75;

      // Draw subtle atmospheric radial glow behind the orbital civic network
      const gradient = ctx.createRadialGradient(
        dynamicCenterX,
        dynamicCenterY,
        20,
        dynamicCenterX,
        dynamicCenterY,
        width * 0.55
      );
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
      gradient.addColorStop(0.3, 'rgba(18, 43, 34, 0.12)');
      gradient.addColorStop(0.7, 'rgba(8, 13, 11, 0.04)');
      gradient.addColorStop(1, 'rgba(8, 13, 11, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw concentric orbital rings
      const rings = [90, 160, 240, 320];
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(dynamicCenterX, dynamicCenterY, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.05 + idx * 0.02})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Central core pulse (Accretion horizon)
      const corePulse = Math.sin(frame * 0.04) * 4;
      const coreGradient = ctx.createRadialGradient(
        dynamicCenterX,
        dynamicCenterY,
        2,
        dynamicCenterX,
        dynamicCenterY,
        45 + corePulse
      );
      coreGradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
      coreGradient.addColorStop(0.4, 'rgba(18, 43, 34, 0.6)');
      coreGradient.addColorStop(1, 'rgba(8, 13, 11, 0)');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(dynamicCenterX, dynamicCenterY, 45 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Render orbiting civic nodes
      particles.forEach((p) => {
        p.angle += p.speed;
        const x = dynamicCenterX + Math.cos(p.angle) * p.radius;
        const y = dynamicCenterY + Math.sin(p.angle) * (p.radius * 0.62); // Slight elliptical tilt

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.shadowColor = p.color === 'rgba(16, 185, 129, ' ? '#10B981' : '#2DD4BF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw dynamic connection filament to neighboring particles
        particles.forEach((p2) => {
          const x2 = dynamicCenterX + Math.cos(p2.angle) * p2.radius;
          const y2 = dynamicCenterY + Math.sin(p2.angle) * (p2.radius * 0.62);
          const dist = Math.hypot(x - x2, y - y2);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.12 * (1 - dist / 60)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center -mt-6 md:-mt-8">
      {/* IMMERSIVE COSMIC CIVIC HERO SECTION */}
      <section className="relative w-screen bg-[#080D0B] text-white overflow-hidden py-20 md:py-32 px-4 sm:px-6 lg:px-12 border-b border-emerald-950/60">
        {/* Dynamic canvas backdrop */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Ambient atmospheric gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Hero text & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-2xl text-left"
          >
            {/* Mission badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Next-Gen Civic Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-6 font-display">
              See a Civic Issue. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                AI Dispatches It.
              </span>{' '}
              <br />
              Track Every Fix.
            </h1>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl font-normal">
              CivicFix AI bridges citizens and city departments with automated image analysis,
              instant duplicate detection, and real-time progress transparency. Fix potholes,
              broken lights, and hazards faster than ever.
            </p>

            {/* High-Impact Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-extrabold text-base hover:from-emerald-400 hover:to-teal-400 transition-all shadow-xl shadow-emerald-500/25 active:scale-98"
              >
                <span>Report an Issue</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/15 backdrop-blur-md transition-all active:scale-98"
              >
                <MapPin size={18} className="text-emerald-400" />
                <span>Explore Live Map</span>
              </Link>
            </div>

            {/* Quick credibility proofs */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Sub-Second Gemini Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Verified Authority Routing</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-emerald-400" />
                <span>Zero Civic Login Barriers</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Floating Telemetry Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="bg-[#111A17]/80 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-950/80">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900/50 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                    Live Civic Network Monitor
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">Real-Time</span>
              </div>

              {/* Live Metric Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0B120F]/90 p-3.5 rounded-xl border border-emerald-900/40">
                  <span className="text-[11px] font-medium text-stone-400 block">
                    AI Auto-Routed
                  </span>
                  <span className="text-2xl font-extrabold text-white mt-0.5 block font-display">
                    100%
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Instant Department Match
                  </span>
                </div>
                <div className="bg-[#0B120F]/90 p-3.5 rounded-xl border border-emerald-900/40">
                  <span className="text-[11px] font-medium text-stone-400 block">
                    Active Geo-Tags
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-400 mt-0.5 block font-display">
                    Verified
                  </span>
                  <span className="text-[10px] text-stone-400">GPS & Map Assisted</span>
                </div>
              </div>

              {/* Sample Activity Card */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                  <Activity size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">
                      Pothole & Road Hazard
                    </span>
                    <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                    Dispatched to Road Authority Team #4
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-900/50 flex items-center justify-between text-xs text-stone-400">
                <span>Direct Municipal Dashboard Sync</span>
                <Link to="/map" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                  View Map <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLATFORM VALUE PROPOSITION: HOW CIVICFIX WORKS */}
      <section className="w-full max-w-7xl mx-auto py-16 md:py-24 px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Intelligent Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#122B22] mt-3 font-display">
            How CivicFix Solves Local Issues
          </h2>
          <p className="text-stone-600 text-base mt-2">
            A frictionless pipeline from visual capture to municipal resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Camera size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
              Step 01
            </span>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Snap & Geo-Locate</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Take a quick photo of the issue. CivicFix captures precise coordinates via your
              browser GPS or an interactive pin drop on the map.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <Zap size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
              Step 02
            </span>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Gemini AI Analysis</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Our server-side Gemini vision model classifies category, measures confidence, rates
              severity, and checks for nearby duplicates automatically.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
              Step 03
            </span>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Authority Resolution</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              The assigned municipal authority receives the complaint in their operations queue,
              updates progress, and marks it resolved in real time.
            </p>
          </div>
        </div>
      </section>

      {/* RECENT CIVIC REPORTS SHOWCASE */}
      <section className="w-full bg-stone-100/70 py-16 px-4 sm:px-6 border-y border-stone-200/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                Community Transparency
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#122B22] mt-1 font-display">
                Recent Public Reports
              </h2>
            </div>
            <Link
              to="/map"
              className="mt-3 sm:mt-0 text-sm font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1.5"
            >
              <span>Explore All on Interactive Map</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {recentIssues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <IssueStatusBadge status={issue.status} size="sm" />
                      <span className="text-xs text-stone-400">
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {issue.images?.[0]?.url && (
                      <div className="h-40 rounded-xl overflow-hidden mb-3 border border-stone-200/60">
                        <img
                          src={issue.images[0].url}
                          alt={issue.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h4 className="font-bold text-base text-stone-900 line-clamp-1 mb-1">
                      {issue.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                      {issue.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                      {issue.category}
                    </span>
                    <Link
                      to={`/issues/${issue._id}`}
                      className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                    >
                      Inspect <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center max-w-lg mx-auto">
              <p className="text-stone-500 text-sm mb-4">
                Be the first to report a civic issue in your neighborhood.
              </p>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#122B22] text-white font-bold text-sm shadow-md"
              >
                Log First Report
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="w-full max-w-5xl mx-auto py-20 px-4 text-center">
        <div className="bg-gradient-to-br from-[#122B22] to-[#1A3E31] text-white p-10 md:p-14 rounded-3xl shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 block font-display">
            Make An Immediate Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 max-w-xl mx-auto font-display">
            Ready to Build a Better, Cleaner, and Safer City?
          </h2>
          <p className="text-stone-300 text-base max-w-lg mx-auto mb-8 font-normal">
            Whether you are a resident noticing road damage or a city official managing municipal
            operations, CivicFix provides the tools you need.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-base transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Report an Issue Now
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/20 transition-all"
            >
              Sign Up for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
