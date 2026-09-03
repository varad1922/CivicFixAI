import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

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
    setFormData((prevState) => ({
      ...prevState,
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
        setPasswordError('Department and Jurisdiction are required');
        return;
      }
      payload.department = department;
      payload.jurisdiction = jurisdiction;
    }
    
    const success = await register(payload);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const success = await googleLogin(credentialResponse.credential);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-paper text-ink mt-8 mb-8">
      <div className="bg-sand p-8 rounded-lg shadow-sm border border-deep-green/10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-deep-green mb-6 text-center">Join CivicFix</h1>
        
        <div className="flex mb-6 border-b border-deep-green/20">
          <button
            className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'citizen' ? 'text-deep-green border-b-2 border-deep-green' : 'text-ink/60 hover:text-deep-green'}`}
            onClick={() => setActiveTab('citizen')}
          >
            Citizen
          </button>
          <button
            className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'authority' ? 'text-deep-green border-b-2 border-deep-green' : 'text-ink/60 hover:text-deep-green'}`}
            onClick={() => setActiveTab('authority')}
          >
            Authority
          </button>
        </div>

        {error && <div className="bg-danger text-paper p-3 rounded mb-4 text-center">{error}</div>}
        {passwordError && <div className="bg-danger text-paper p-3 rounded mb-4 text-center">{passwordError}</div>}
        
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google registration failed');
            }}
          />
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-deep-green/20"></div>
          <span className="flex-shrink-0 mx-4 text-ink/50 text-sm">Or sign up with email</span>
          <div className="flex-grow border-t border-deep-green/20"></div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              required
              className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength="6"
              className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
              placeholder="Create a password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              minLength="6"
              className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
              placeholder="Confirm your password"
            />
          </div>

          {activeTab === 'authority' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={onChange}
                  required
                  className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Road Authority">Road Authority</option>
                  <option value="Sanitation Authority">Sanitation Authority</option>
                  <option value="Electrical Authority">Electrical Authority</option>
                  <option value="Water Authority">Water Authority</option>
                  <option value="Parks Authority">Parks Authority</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="jurisdiction">Jurisdiction</label>
                <input
                  type="text"
                  id="jurisdiction"
                  name="jurisdiction"
                  value={jurisdiction}
                  onChange={onChange}
                  required
                  className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
                  placeholder="e.g. Pune Zone 3"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-deep-green text-paper py-2 rounded font-semibold hover:bg-civic-green transition-colors"
          >
            {activeTab === 'citizen' ? 'Sign Up as Citizen' : 'Sign Up as Authority'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-info-blue hover:underline font-semibold">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
