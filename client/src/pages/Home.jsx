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
  Users,
  Compass,
  Cpu
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

  // Futuristic Cosmic Accretion Disk & Civic Singularity Canvas Effect
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

    // Orbital particles in neon purple, electric blue, and cosmic violet
    const numParticles = 65;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      const radius = 60 + Math.random() * 280;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.003 + Math.random() * 0.008) * (Math.random() > 0.45 ? 1 : -1);
      const size = 1.2 + Math.random() * 2.4;
      const type = i % 3;
      const color =
        type === 0
          ? 'rgba(168, 85, 247, ' // Neon Purple (#A855F7)
          : type === 1
          ? 'rgba(56, 189, 248, ' // Electric Blue (#38BDF8)
          : 'rgba(192, 132, 252, '; // Bright Purple Glow (#C084FC)

      particles.push({
        radius,
        angle,
        speed,
        size,
        color,
        type,
        opacity: 0.25 + Math.random() * 0.75
      });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const dynamicCenterX = width > 1024 ? width * 0.72 : width * 0.5;
      const dynamicCenterY = width > 1024 ? height * 0.5 : height * 0.72;

      // Draw subtle atmospheric radial glow behind the orbital civic network
      const gradient = ctx.createRadialGradient(
        dynamicCenterX,
        dynamicCenterY,
        25,
        dynamicCenterX,
        dynamicCenterY,
        width * 0.6
      );
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
      gradient.addColorStop(0.25, 'rgba(56, 189, 248, 0.12)');
      gradient.addColorStop(0.65, 'rgba(16, 16, 24, 0.06)');
      gradient.addColorStop(1, 'rgba(7, 7, 11, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw concentric orbital gravitational rings
      const rings = [90, 165, 250, 340];
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(dynamicCenterX, dynamicCenterY, r, 0, Math.PI * 2);
        ctx.strokeStyle = idx % 2 === 0
          ? `rgba(168, 85, 247, ${0.06 + idx * 0.02})`
          : `rgba(56, 189, 248, ${0.05 + idx * 0.02})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 14]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Central core pulse (Accretion horizon / Singularity)
      const corePulse = Math.sin(frame * 0.04) * 5;
      const coreGradient = ctx.createRadialGradient(
        dynamicCenterX,
        dynamicCenterY,
        3,
        dynamicCenterX,
        dynamicCenterY,
        50 + corePulse
      );
      coreGradient.addColorStop(0, 'rgba(192, 132, 252, 0.95)');
      coreGradient.addColorStop(0.3, 'rgba(168, 85, 247, 0.6)');
      coreGradient.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
      coreGradient.addColorStop(1, 'rgba(7, 7, 11, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(dynamicCenterX, dynamicCenterY, 50 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Black hole center pupil
      ctx.beginPath();
      ctx.arc(dynamicCenterX, dynamicCenterY, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#07070B';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
      ctx.stroke();

      // Render orbiting civic nodes
      particles.forEach((p) => {
        p.angle += p.speed;
        const x = dynamicCenterX + Math.cos(p.angle) * p.radius;
        const y = dynamicCenterY + Math.sin(p.angle) * (p.radius * 0.62); // Elliptical perspective tilt

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.shadowColor = p.type === 1 ? '#38BDF8' : '#A855F7';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw dynamic connection filament to neighboring particles
        particles.forEach((p2) => {
          const x2 = dynamicCenterX + Math.cos(p2.angle) * p2.radius;
          const y2 = dynamicCenterY + Math.sin(p2.angle) * (p2.radius * 0.62);
          const dist = Math.hypot(x - x2, y - y2);
          if (dist < 65) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - dist / 65)})`;
            ctx.lineWidth = 0.7;
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
    <div className="w-full flex flex-col items-center -mt-6 md:-mt-8 bg-[#07070B] text-[#F5F3FF]">
      {/* IMMERSIVE FUTURISTIC HERO SECTION */}
      <section className="relative w-screen bg-[#07070B] text-[#F5F3FF] overflow-hidden py-20 md:py-32 px-4 sm:px-6 lg:px-12 border-b border-[#292938]">
        {/* Dynamic canvas backdrop */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Ambient atmospheric gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Hero text & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-2xl text-left"
          >
            {/* Mission badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>Next-Gen Civic Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F5F3FF] leading-[1.08] mb-6 font-display">
              See a Civic Issue. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-sky-400">
                AI Dispatches It.
              </span>{' '}
              <br />
              Track Every Fix.
            </h1>

            <p className="text-[#A1A1B5] text-base sm:text-lg leading-relaxed mb-8 max-w-xl font-normal">
              CivicFix AI bridges citizens and city departments with automated image analysis,
              instant duplicate detection, and real-time progress transparency. Fix potholes,
              broken lights, and hazards faster than ever.
            </p>

            {/* High-Impact Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-extrabold text-base transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] active:scale-98"
              >
                <span>Report an Issue</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#151520]/80 hover:bg-[#1f1f2e] text-[#F5F3FF] font-bold text-base border border-[#292938] hover:border-purple-500/50 backdrop-blur-md transition-all active:scale-98 shadow-lg shadow-black/40"
              >
                <MapPin size={18} className="text-sky-400" />
                <span>Explore Live Map</span>
              </Link>
            </div>

            {/* Quick credibility proofs */}
            <div className="mt-10 pt-6 border-t border-[#292938] flex flex-wrap items-center gap-6 text-xs text-[#A1A1B5]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-400" />
                <span>Sub-Second Gemini Vision Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-sky-400" />
                <span>Verified Authority Routing</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-purple-400" />
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
            <div className="bg-[#151520]/90 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#292938] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#A855F7] animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-purple-400 uppercase">
                    Live Civic Network Monitor
                  </span>
                </div>
                <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  REAL-TIME
                </span>
              </div>

              {/* Live Metric Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#101018] p-3.5 rounded-xl border border-[#292938]">
                  <span className="text-[11px] font-medium text-[#A1A1B5] block">
                    AI Auto-Routed
                  </span>
                  <span className="text-2xl font-extrabold text-[#F5F3FF] mt-0.5 block font-display">
                    100%
                  </span>
                  <span className="text-[10px] text-purple-400 font-semibold">
                    Instant Department Match
                  </span>
                </div>
                <div className="bg-[#101018] p-3.5 rounded-xl border border-[#292938]">
                  <span className="text-[11px] font-medium text-[#A1A1B5] block">
                    Active Geo-Tags
                  </span>
                  <span className="text-2xl font-extrabold text-sky-400 mt-0.5 block font-display">
                    Verified
                  </span>
                  <span className="text-[10px] text-[#A1A1B5]">GPS & Map Assisted</span>
                </div>
              </div>

              {/* Sample Activity Card */}
              <div className="p-3.5 rounded-xl bg-[#101018] border border-[#292938] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5 border border-purple-500/30">
                  <Activity size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#F5F3FF] truncate">
                      Pothole & Road Hazard
                    </span>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                      In Progress
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1B5] mt-0.5 line-clamp-1">
                    Dispatched to Road Authority Team #4
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#292938] flex items-center justify-between text-xs text-[#A1A1B5]">
                <span>Direct Municipal Sync Active</span>
                <Link to="/map" className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
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
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
            Intelligent Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3FF] mt-3 font-display">
            How CivicFix Solves Local Issues
          </h2>
          <p className="text-[#A1A1B5] text-base mt-2">
            A frictionless pipeline from visual capture to municipal resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-[#151520] p-8 rounded-2xl border border-[#292938] shadow-lg hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <Camera size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1B5] mb-1">
              Step 01
            </span>
            <h3 className="text-xl font-bold text-[#F5F3FF] mb-2">Snap & Geo-Locate</h3>
            <p className="text-[#A1A1B5] text-sm leading-relaxed">
              Take a quick photo of the issue. CivicFix captures precise coordinates via your
              browser GPS or an interactive pin drop on the map.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#151520] p-8 rounded-2xl border border-[#292938] shadow-lg hover:border-sky-500/50 hover:shadow-[0_0_25px_rgba(56,189,248,0.2)] transition-all flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Cpu size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1B5] mb-1">
              Step 02
            </span>
            <h3 className="text-xl font-bold text-[#F5F3FF] mb-2">Gemini AI Analysis</h3>
            <p className="text-[#A1A1B5] text-sm leading-relaxed">
              Our server-side Gemini vision model classifies category, measures confidence, rates
              severity, and checks for nearby duplicates automatically.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#151520] p-8 rounded-2xl border border-[#292938] shadow-lg hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1B5] mb-1">
              Step 03
            </span>
            <h3 className="text-xl font-bold text-[#F5F3FF] mb-2">Authority Resolution</h3>
            <p className="text-[#A1A1B5] text-sm leading-relaxed">
              The assigned municipal authority receives the complaint in their operations queue,
              updates progress, and marks it resolved in real time.
            </p>
          </div>
        </div>
      </section>

      {/* RECENT CIVIC REPORTS SHOWCASE */}
      <section className="w-full bg-[#101018] py-16 px-4 sm:px-6 border-y border-[#292938]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                Community Transparency
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] mt-1 font-display">
                Recent Public Reports
              </h2>
            </div>
            <Link
              to="/map"
              className="mt-3 sm:mt-0 text-sm font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5"
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
                  className="bg-[#151520] rounded-2xl p-5 border border-[#292938] shadow-lg hover:border-purple-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <IssueStatusBadge status={issue.status} size="sm" />
                      <span className="text-xs text-[#A1A1B5]">
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {issue.images?.[0]?.url && (
                      <div className="h-40 rounded-xl overflow-hidden mb-3 border border-[#292938]">
                        <img
                          src={issue.images[0].url}
                          alt={issue.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h4 className="font-bold text-base text-[#F5F3FF] line-clamp-1 mb-1">
                      {issue.title}
                    </h4>
                    <p className="text-xs text-[#A1A1B5] line-clamp-2 mb-3">
                      {issue.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#292938] flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                      {issue.category}
                    </span>
                    <Link
                      to={`/issues/${issue._id}`}
                      className="font-bold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                    >
                      Inspect <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#151520] rounded-2xl p-8 border border-[#292938] text-center max-w-lg mx-auto">
              <p className="text-[#A1A1B5] text-sm mb-4">
                Be the first to report a civic issue in your neighborhood.
              </p>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)]"
              >
                Log First Report
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="w-full max-w-5xl mx-auto py-20 px-4 text-center">
        <div className="bg-gradient-to-br from-[#151520] via-[#101018] to-[#1a1128] text-white p-10 md:p-14 rounded-3xl border border-[#292938] shadow-2xl shadow-purple-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/15 rounded-full blur-[100px] pointer-events-none" />

          <span className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3 block font-display">
            Make An Immediate Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3FF] mb-4 max-w-xl mx-auto font-display">
            Ready to Build a Better, Cleaner, and Safer City?
          </h2>
          <p className="text-[#A1A1B5] text-base max-w-lg mx-auto mb-8 font-normal">
            Whether you are a resident noticing road damage or a city official managing municipal
            operations, CivicFix provides the tools you need.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-extrabold text-base transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
            >
              Report an Issue Now
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#101018]/80 hover:bg-[#151520] text-[#F5F3FF] font-bold text-base border border-[#292938] hover:border-purple-500/40 transition-all shadow-md"
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
