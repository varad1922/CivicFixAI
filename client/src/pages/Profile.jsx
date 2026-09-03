import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Camera, Save, User, MapPin, Phone, Mail, Shield, Calendar } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, token } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || ''
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image must be less than 5MB');
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

      // Upload image if changed
      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('image', avatarFile);

        const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, uploadData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
          }
        });
        
        avatarUrl = uploadRes.data.url;
      }

      const success = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        avatar: avatarUrl
      });

      if (success) {
        setSuccessMsg('Profile updated successfully!');
      } else {
        setErrorMsg('Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 md:mt-8 w-full px-4 md:px-0">
      <div className="bg-paper rounded-xl shadow-sm border border-deep-green/10 overflow-hidden">
        <div className="p-6 bg-sand border-b border-deep-green/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-deep-green">My Profile</h2>
          <div className="px-3 py-1 bg-deep-green/10 text-deep-green rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Shield size={14} />
            {user?.role}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {errorMsg && <div className="bg-danger text-paper p-4 rounded-lg mb-6 shadow-sm font-medium">{errorMsg}</div>}
          {successMsg && <div className="bg-civic-green text-paper p-4 rounded-lg mb-6 shadow-sm font-medium">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Profile Photo Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-deep-green/10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-sand shadow-sm bg-sand">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-deep-green/5 text-deep-green/30">
                      <User size={64} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-3 bg-deep-green text-paper rounded-full shadow-md cursor-pointer hover:bg-civic-green transition-colors hover:scale-105 active:scale-95">
                  <Camera size={20} />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-lg text-deep-green">Profile Photo</h3>
                <p className="text-sm text-ink/60 mb-2">JPEG, PNG under 5MB</p>
                <label className="text-info-blue text-sm font-semibold cursor-pointer hover:underline">
                  Upload new photo
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Account Info Readonly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-deep-green/10">
              <div className="bg-sand/30 p-4 rounded-lg flex items-start gap-3">
                <Mail className="text-ink/40 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold text-ink/60 uppercase">Email Address</p>
                  <p className="font-medium text-ink">{user?.email}</p>
                  <p className="text-[10px] text-ink/40 mt-1">Managed by authentication provider</p>
                </div>
              </div>
              <div className="bg-sand/30 p-4 rounded-lg flex items-start gap-3">
                <Calendar className="text-ink/40 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold text-ink/60 uppercase">Member Since</p>
                  <p className="font-medium text-ink">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-deep-green mb-1 flex items-center gap-2">
                  <User size={16} /> Full Name
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50" 
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-deep-green mb-1 flex items-center gap-2">
                    <Phone size={16} /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50" 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-deep-green mb-1 flex items-center gap-2">
                    <MapPin size={16} /> City / Location
                  </label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    className="w-full p-3 border border-deep-green/20 rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-deep-green/50" 
                    placeholder="Your city or locality"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-orange text-paper px-6 py-4 rounded-lg text-lg font-bold hover:bg-orange/90 shadow-md flex justify-center items-center gap-2 disabled:opacity-70 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-paper border-t-transparent rounded-full"></span> 
                    Saving Changes...
                  </span>
                ) : (
                  <>
                    <Save size={20} />
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
