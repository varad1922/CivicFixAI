import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const { name, email, password, confirmPassword } = formData;
  const { register, error, setError, user } = useContext(AuthContext);
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
    
    const success = await register({ name, email, password });
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-paper text-ink">
      <div className="bg-sand p-8 rounded-lg shadow-sm border border-deep-green/10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-deep-green mb-6 text-center">Join CivicFix</h1>
        
        {error && <div className="bg-danger text-paper p-3 rounded mb-4 text-center">{error}</div>}
        {passwordError && <div className="bg-danger text-paper p-3 rounded mb-4 text-center">{passwordError}</div>}
        
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
          <button
            type="submit"
            className="w-full bg-deep-green text-paper py-2 rounded font-semibold hover:bg-civic-green transition-colors"
          >
            Sign Up
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
