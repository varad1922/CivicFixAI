import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, User, Building2, AlertCircle, Loader2, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [activeTab, setActiveTab] = useState('citizen');
  const [submitting, setSubmitting] = useState(false);

  const { email, password } = formData;
  const { login, googleLogin, error, setError, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    setError(null);
  }, [user, navigate, setError]);

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await login({ email, password, requestedRole: activeTab });
    setSubmitting(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setSubmitting(true);
    const success = await googleLogin(credentialResponse.credential, activeTab);
    setSubmitting(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      {/* Ambient neon backdrop glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#151520]/95 backdrop-blur-xl rounded-3xl border border-[#292938] shadow-2xl shadow-purple-950/30 p-6 sm:p-8 relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
            {activeTab === 'citizen' && <User size={26} />}
            {activeTab === 'authority' && <Building2 size={26} />}
            {activeTab === 'admin' && <Shield size={26} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight font-display">
            Welcome to CivicFix
          </h1>
          <p className="text-[#A1A1B5] text-xs sm:text-sm mt-1">
            Access your AI civic portal to report, track, or resolve issues.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#101018] border border-[#292938] rounded-2xl mb-6">
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'citizen'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A1B5] hover:text-[#F5F3FF]'
            }`}
            onClick={() => setActiveTab('citizen')}
          >
            Citizen
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'authority'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A1B5] hover:text-[#F5F3FF]'
            }`}
            onClick={() => setActiveTab('authority')}
          >
            Authority
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A1B5] hover:text-[#F5F3FF]'
            }`}
            onClick={() => setActiveTab('admin')}
          >
            Admin
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Login Button */}
        {activeTab !== 'admin' && (
          <div className="mb-5 flex flex-col items-center">
            <div className="w-full flex justify-center bg-[#101018] p-1.5 rounded-2xl border border-[#292938]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was canceled or failed.')}
                shape="pill"
                theme="filled_black"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>
            <div className="relative w-full flex items-center justify-center my-4">
              <div className="border-t border-[#292938] w-full" />
              <span className="bg-[#151520] px-3 text-[11px] font-semibold text-[#A1A1B5] uppercase tracking-wider absolute">
                or sign in with email
              </span>
            </div>
          </div>
        )}

        {/* Email Password Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="name@example.com"
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-[#A1A1B5]/60 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="••••••••"
              />
              <Lock size={16} className="absolute left-3.5 top-3 text-[#A1A1B5]/60 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-purple-200" />
                <span>Sign In as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#292938] text-center text-xs text-[#A1A1B5]">
          New to CivicFix?{' '}
          <Link to="/register" className="text-purple-400 hover:text-purple-300 font-bold underline">
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
