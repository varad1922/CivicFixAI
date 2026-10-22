import { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext();

const normalizeUser = (raw) => {
  if (!raw) return null;

  const role =
    typeof raw.role === 'string'
      ? raw.role.toLowerCase().trim()
      : '';

  if (!['citizen', 'authority', 'admin'].includes(role)) {
    return null;
  }

  return {
    ...raw,
    role
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async (accessToken) => {
    try {
      const response = await authApi.getMe(accessToken);
      const nextUser = normalizeUser(response.data);

      if (!nextUser) {
        throw new Error('Account role is missing or invalid.');
      }

      setUser(nextUser);
      return nextUser;
    } catch (err) {
      console.error('Failed to load user profile:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await loadUser(token);
      } catch (err) {
        console.warn('Session expired or invalid. Clearing saved token.');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token, loadUser]);

  const authenticate = async (requestFn) => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestFn();
      const nextToken = response.data?.token;

      if (!nextToken) {
        throw new Error('Authentication succeeded without a session token.');
      }

      localStorage.setItem('token', nextToken);
      setToken(nextToken);

      const immediateUser = normalizeUser(response.data);
      if (immediateUser) {
        setUser(immediateUser);
      }

      try {
        await loadUser(nextToken);
      } catch (loadErr) {
        console.debug('Background user profile sync:', loadErr);
      }

      return true;
    } catch (err) {
      console.error('Authentication failed:', err);
      const message =
        err.response?.data?.message ||
        err.extractedMessage ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) =>
    authenticate(() => authApi.register(userData));

  const login = async (userData) =>
    authenticate(() => authApi.login(userData));

  const googleLogin = async (credential, requestedRole = 'citizen') =>
    authenticate(() => authApi.googleAuth(credential, requestedRole));

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      await authApi.updateProfile(profileData);
      if (token) {
        await loadUser(token);
      }
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.extractedMessage ||
        err.message ||
        'Failed to update profile.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      register,
      login,
      googleLogin,
      logout,
      updateProfile,
      setError
    }),
    [user, token, loading, error]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};