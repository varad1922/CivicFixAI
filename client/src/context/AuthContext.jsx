import { createContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/auth/`;

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
  const [token, setToken] = useState(
    () => localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common.Authorization;
      localStorage.removeItem('token');
    }
  }, [token]);

  const loadUser = async (accessToken) => {
    const response = await axios.get(`${API_URL}me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const nextUser = normalizeUser(response.data);

    if (!nextUser) {
      throw new Error('Account role is missing or invalid.');
    }

    setUser(nextUser);
    return nextUser;
  };

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await loadUser(token);
      } catch (err) {
        console.error(
          'Failed to restore authenticated session:',
          err
        );

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  const authenticate = async (request) => {
    setLoading(true);
    setError(null);

    try {
      const response = await request();

      const nextToken = response.data?.token;

      if (!nextToken) {
        throw new Error(
          'Authentication succeeded without a session token.'
        );
      }

      setToken(nextToken);

      const freshUser = await loadUser(nextToken);

      if (!freshUser) {
        throw new Error(
          'Unable to load account profile.'
        );
      }

      return true;
    } catch (err) {
      console.error('Authentication failed:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Authentication failed'
      );

      setToken(null);
      setUser(null);
      setLoading(false);

      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) =>
    authenticate(() =>
      axios.post(`${API_URL}register`, userData)
    );

  const login = async (userData) =>
    authenticate(() =>
      axios.post(`${API_URL}login`, userData)
    );

  const googleLogin = async (
    credential,
    requestedRole = 'citizen'
  ) =>
    authenticate(() =>
      axios.post(`${API_URL}google`, {
        token: credential,
        requestedRole
      })
    );

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      await axios.patch(
        `${API_URL}profile`,
        profileData
      );

      await loadUser(token);

      return true;
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to update profile'
      );

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