import axios from 'axios';

/**
 * Resolves the backend API base URL ensuring that:
 * 1. Trailing slashes are stripped.
 * 2. The `/api` prefix is present (prevents missing /api regression).
 * 3. In local browser dev without an env override, it defaults to http://localhost:5000/api.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // If running locally in browser development and VITE_API_URL is either localhost or not set, prefer local backend
  if (isLocalHost && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return 'http://localhost:5000/api';
  }

  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  // If in browser and running locally, fallback to local backend port 5000
  if (isLocalHost) {
    return 'http://localhost:5000/api';
  }

  // Production fallback to Render backend
  return 'https://civicfixai-1.onrender.com/api';
};

/**
 * Resolves the Socket.IO host URL (root domain without /api)
 */
export const getSocketUrl = () => {
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/\/api\/?$/, '');
};

// Create configured axios instance
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: graceful logging & normalized error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      message = 'Unable to reach the authentication service. Please verify your internet connection or check that the backend is active.';
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Server request timed out. The backend service may be waking up, please try again in a few seconds.';
    } else if (error.response?.status === 401 && !error.response?.data?.message) {
      message = 'Incorrect email or password. Please verify your credentials.';
    } else if (error.response?.status === 503) {
      message = error.response?.data?.message || 'Authentication service is temporarily unavailable. Please try again shortly.';
    }

    error.extractedMessage = message;
    return Promise.reject(error);
  }
);

// Centralized domain API services
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleAuth: (token, requestedRole = 'citizen') =>
    api.post('/auth/google', { token, requestedRole }),
  getMe: (explicitToken) =>
    api.get('/auth/me', explicitToken ? { headers: { Authorization: `Bearer ${explicitToken}` } } : {}),
  updateProfile: (profileData) => api.patch('/auth/profile', profileData),
};

export const issuesApi = {
  getAll: () => api.get('/issues'),
  getMyIssues: () => api.get('/issues/my-issues'),
  getMapIssues: () => api.get('/issues/map'),
  getById: (id) => api.get(`/issues/${id}`),
  getQueue: () => api.get('/issues/queue'),
  create: (issueData) => api.post('/issues', issueData),
  updateStatus: (id, status) => api.patch(`/issues/${id}/status`, { status }),
  checkDuplicates: (coordinates, category) =>
    api.post('/issues/check-duplicates', { coordinates, category }),
};

export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const aiApi = {
  analyzeImage: (imageUrl) => api.post('/ai/analyze-issue', { imageUrl }),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (userId, payload) => api.patch(`/admin/users/${userId}/status`, payload),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

export default api;
