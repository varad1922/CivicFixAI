import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, User, Building2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-emerald-950/5 p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100">
            {activeTab === 'citizen' && <User size={24} />}
            {activeTab === 'authority' && <Building2 size={24} />}
            {activeTab === 'admin' && <Shield size={24} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#122B22] font-display">
            Welcome to CivicFix
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Access your civic portal to report, track, or resolve issues.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/90 rounded-2xl mb-6">
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'citizen'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            onClick={() => setActiveTab('citizen')}
          >
            Citizen
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'authority'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            onClick={() => setActiveTab('authority')}
          >
            Authority
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            onClick={() => setActiveTab('admin')}
          >
            Admin
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Login Button */}
        {activeTab !== 'admin' && (
          <div className="mb-5 flex flex-col items-center">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was canceled or failed.')}
                shape="pill"
                theme="outline"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>
            <div className="relative w-full flex items-center justify-center my-4">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider absolute">
                or sign in with email
              </span>
            </div>
          </div>
        )}

        {/* Email Password Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#122B22] hover:bg-[#1A3E31] text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
          New to CivicFix?{' '}
          <Link to="/register" className="text-emerald-700 hover:text-emerald-900 font-bold underline">
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
