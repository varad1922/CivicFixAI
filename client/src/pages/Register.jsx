import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { User, Building2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Phone, Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    password: '',
    confirmPassword: '',
    department: '',
    jurisdiction: ''
  });
  const [formError, setFormError] = useState('');
  const [activeTab, setActiveTab] = useState('citizen');
  const [submitting, setSubmitting] = useState(false);

  const { name, email, phone, gender, password, confirmPassword, department, jurisdiction } = formData;
  const { register, googleLogin, error, setError, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    setError(null);
  }, [user, navigate, setError]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only digits allowed, max 10
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setGender = (val) => {
    setFormData((prev) => ({ ...prev, gender: val }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Email validation: must contain @ and have valid structure
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address containing "@" and domain (e.g. user@domain.com)');
      return;
    }

    // Phone validation: compulsory exactly 10 digits
    if (!phone || phone.length !== 10) {
      setFormError('Phone number is compulsory and must be exactly 10 digits');
      return;
    }

    // Gender validation
    if (!['male', 'female', 'other'].includes(gender)) {
      setFormError('Please select a gender option (Male, Female, or Other)');
      return;
    }

    // Passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    const payload = {
      name: name.trim(),
      email: trimmedEmail,
      phone,
      gender,
      password,
      role: activeTab
    };

    if (activeTab === 'authority') {
      if (!department || !jurisdiction) {
        setFormError('Department and Jurisdiction are required for municipal registration');
        return;
      }
      payload.department = department;
      payload.jurisdiction = jurisdiction.trim();
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-[#151520]/95 backdrop-blur-xl rounded-3xl border border-[#292938] shadow-2xl shadow-purple-950/30 p-6 sm:p-8 my-4 relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
            {activeTab === 'citizen' ? <User size={26} /> : <Building2 size={26} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight font-display">
            Join CivicFix AI
          </h1>
          <p className="text-[#A1A1B5] text-xs sm:text-sm mt-1">
            Empower your community with futuristic AI-driven civic reporting.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#101018] border border-[#292938] rounded-2xl mb-6">
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'citizen'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A1B5] hover:text-[#F5F3FF]'
            }`}
            onClick={() => setActiveTab('citizen')}
          >
            Citizen Account
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
            City Authority
          </button>
        </div>

        {/* Error message */}
        {(error || formError) && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{formError || error}</span>
          </div>
        )}

        {/* Google Registration for Citizens */}
        {activeTab === 'citizen' ? (
          <div className="mb-5 flex flex-col items-center">
            <div className="w-full flex justify-center bg-[#101018] p-1.5 rounded-2xl border border-[#292938]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed.')}
                shape="pill"
                theme="filled_black"
                size="large"
                text="signup_with"
                width="100%"
              />
            </div>
            <div className="relative w-full flex items-center justify-center my-4">
              <div className="border-t border-[#292938] w-full" />
              <span className="bg-[#151520] px-3 text-[11px] font-semibold text-[#A1A1B5] uppercase tracking-wider absolute">
                or register with details
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-start gap-2.5">
            <ShieldCheck size={18} className="shrink-0 text-purple-400 mt-0.5" />
            <span>
              Municipal authority accounts undergo cryptographic credential validation by the city administrator.
            </span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="e.g. Maya Sharma"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address <span className="text-purple-400 font-normal lowercase">(must contain @)</span>
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

          {/* Mandatory Phone Number (10 digits) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider" htmlFor="phone">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-purple-400 font-mono">
                {phone.length}/10 digits
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phone}
                onChange={onChange}
                required
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm font-mono tracking-wider focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="9876543210 (10 digits)"
              />
              <Phone size={16} className="absolute left-3.5 top-3 text-[#A1A1B5]/60 pointer-events-none" />
            </div>
          </div>

          {/* Gender Selection: male, female, other */}
          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5">
              Gender <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
                { id: 'other', label: 'Other' }
              ].map((item) => {
                const isSelected = gender === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                        : 'bg-[#101018] border-[#292938] text-[#A1A1B5] hover:text-[#F5F3FF] hover:border-[#38384d]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-400 shadow-[0_0_6px_#A855F7]' : 'bg-[#292938]'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="••••••••"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-[#A1A1B5]/60 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="confirmPassword">
                Confirm
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="••••••••"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-[#A1A1B5]/60 pointer-events-none" />
              </div>
            </div>
          </div>

          {activeTab === 'authority' && (
            <div className="pt-2 border-t border-[#292938] space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={onChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                >
                  <option value="" disabled className="bg-[#101018] text-[#A1A1B5]">Select Municipal Department</option>
                  <option value="Road Authority" className="bg-[#101018]">Road Authority</option>
                  <option value="Sanitation Authority" className="bg-[#101018]">Sanitation Authority</option>
                  <option value="Electrical Authority" className="bg-[#101018]">Electrical Authority</option>
                  <option value="Water Authority" className="bg-[#101018]">Water Authority</option>
                  <option value="Parks Authority" className="bg-[#101018]">Parks Authority</option>
                  <option value="General Civic Authority" className="bg-[#101018]">General Civic Authority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="jurisdiction">
                  Assigned Jurisdiction
                </label>
                <input
                  type="text"
                  id="jurisdiction"
                  name="jurisdiction"
                  value={jurisdiction}
                  onChange={onChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] placeholder-[#A1A1B5]/40 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="e.g. Pune Central / Ward 12"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 mt-3"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-purple-200" />
                <span>Complete Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#292938] text-center text-xs text-[#A1A1B5]">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold underline">
            Sign In here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
