import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user on start
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}me`);
        setUser(response.data);
      } catch (err) {
        console.error(err);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}register`, userData);
      if (response.data) {
        setToken(response.data.token);
        setUser(response.data);
      }
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
      return false;
    }
  };

  const login = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}login`, userData);
      if (response.data) {
        setToken(response.data.token);
        setUser(response.data);
      }
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
      return false;
    }
  };

  const googleLogin = async (tokenId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}google`, { token: tokenId });
      if (response.data) {
        setToken(response.data.token);
        setUser(response.data);
      }
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, googleLogin, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};
