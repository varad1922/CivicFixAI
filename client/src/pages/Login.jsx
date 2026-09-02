import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;
  const { login, error, setError, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    // Clear error on mount
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
    const success = await login({ email, password });
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-paper text-ink">
      <div className="bg-sand p-8 rounded-lg shadow-sm border border-deep-green/10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-deep-green mb-6 text-center">Login to CivicFix</h1>
        
        {error && <div className="bg-danger text-paper p-3 rounded mb-4 text-center">{error}</div>}
        
        <form onSubmit={onSubmit} className="space-y-4">
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
              className="w-full p-2 border border-deep-green/30 rounded focus:outline-none focus:border-deep-green bg-paper"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-deep-green text-paper py-2 rounded font-semibold hover:bg-civic-green transition-colors"
          >
            Log In
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-info-blue hover:underline font-semibold">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
