import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadApi } from '../services/api';
import {
  Camera,
  Save,
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Avatar image must be smaller than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let avatarUrl = user?.avatar;

      // Upload new avatar if changed
      if (avatarFile) {
        const uploadRes = await uploadApi.uploadImage(avatarFile);
        avatarUrl = uploadRes.data?.url || avatarUrl;
      }

      const success = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        avatar: avatarUrl,
      });

      if (success) {
        setSuccessMsg('Your profile has been successfully updated.');
        setAvatarFile(null);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6 text-[#F5F3FF]">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-[#151520] via-[#101018] to-[#1e1333] text-[#F5F3FF] p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#292938] flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        {/* Avatar upload trigger */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/40 bg-[#101018] shadow-lg shadow-purple-950/40 flex items-center justify-center text-3xl font-extrabold text-purple-400">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-transform group-hover:scale-105"
            title="Change Avatar"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {user?.role || 'Citizen'}
            </span>
            {user?.verificationStatus && (
              <span className="text-[11px] font-semibold text-[#A1A1B5]">
                • {user.verificationStatus}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] font-display truncate">
            {user?.name || 'Account Settings'}
          </h1>
          <p className="text-[#A1A1B5] text-xs sm:text-sm mt-0.5 truncate">{user?.email}</p>
        </div>

        <div className="absolute right-0 bottom-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <div className="bg-[#151520] rounded-3xl border border-[#292938] shadow-2xl shadow-purple-950/20 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b border-[#292938] pb-4 mb-2">
            <h2 className="text-lg font-bold text-[#F5F3FF] font-display">Personal Details</h2>
            <p className="text-[#A1A1B5] text-xs mt-0.5">
              Update your public display name and contact preferences.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1B5]/60" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address (Fixed)
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1B5]/60" />
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#292938] bg-[#101018]/60 text-[#A1A1B5] text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1B5]/60"
                />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1B5] uppercase tracking-wider mb-1.5" htmlFor="city">
                City / Municipality
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1B5]/60"
                />
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="e.g. Pune"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#292938] bg-[#101018] text-[#F5F3FF] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Authority specifics if authority */}
          {user?.role === 'authority' && (
            <div className="p-4 rounded-2xl bg-[#101018] border border-[#292938] space-y-2 mt-4 text-xs">
              <span className="font-bold text-sky-400 uppercase tracking-wider block text-[10px]">
                Municipal Authority Credentials
              </span>
              <div className="grid grid-cols-2 gap-2 text-[#A1A1B5]">
                <div>
                  <span className="text-[#A1A1B5]/70 text-[11px] block">Department</span>
                  <span className="font-bold text-[#F5F3FF]">{user.department || '—'}</span>
                </div>
                <div>
                  <span className="text-[#A1A1B5]/70 text-[11px] block">Jurisdiction</span>
                  <span className="font-bold text-[#F5F3FF]">{user.jurisdiction || '—'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
