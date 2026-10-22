import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { User, Building2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    jurisdiction: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('citizen');
  const [submitting, setSubmitting] = useState(false);

  const { name, email, password, confirmPassword, department, jurisdiction } = formData;
  const { register, googleLogin, error, setError, user } = useContext(AuthContext);
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
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const payload = { name, email, password, role: activeTab };
    if (activeTab === 'authority') {
      if (!department || !jurisdiction) {
        setPasswordError('Department and Jurisdiction are required for municipal registration');
        return;
      }
      payload.department = department;
      payload.jurisdiction = jurisdiction;
    }

    setSubmitting(true);
    const success = await register(payload);
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
        className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-emerald-950/5 p-6 sm:p-8 my-4"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100">
            {activeTab === 'citizen' ? <User size={24} /> : <Building2 size={24} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#122B22] font-display">
            Join CivicFix AI
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Empower your community or manage your municipal jurisdiction.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100/90 rounded-2xl mb-6">
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'citizen'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            onClick={() => setActiveTab('citizen')}
          >
            Citizen Account
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
            City Authority
          </button>
        </div>

        {/* Error message */}
        {(error || passwordError) && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{passwordError || error}</span>
          </div>
        )}

        {/* Google Registration for Citizens */}
        {activeTab === 'citizen' ? (
          <div className="mb-5 flex flex-col items-center">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed.')}
                shape="pill"
                theme="outline"
                size="large"
                text="signup_with"
                width="100%"
              />
            </div>
            <div className="relative w-full flex items-center justify-center my-4">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider absolute">
                or register with email
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
            <ShieldCheck size={16} className="shrink-0 text-blue-600 mt-0.5" />
            <span>
              Authority registrations require department details and are subject to admin
              verification before accessing live queues.
            </span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              placeholder="e.g. Maya Sharma"
            />
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                minLength="6"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="confirmPassword">
                Confirm
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                required
                minLength="6"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {activeTab === 'authority' && (
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={onChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Road Authority">Road Authority</option>
                  <option value="Sanitation Authority">Sanitation Authority</option>
                  <option value="Electrical Authority">Electrical Authority</option>
                  <option value="Water Authority">Water Authority</option>
                  <option value="Parks Authority">Parks Authority</option>
                  <option value="General Civic Authority">General Civic Authority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="jurisdiction">
                  Assigned Jurisdiction
                </label>
                <input
                  type="text"
                  id="jurisdiction"
                  name="jurisdiction"
                  value={jurisdiction}
                  onChange={onChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  placeholder="e.g. Pune Zone 3 / North Ward"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#122B22] hover:bg-[#1A3E31] text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-700 hover:text-emerald-900 font-bold underline">
            Sign In here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
