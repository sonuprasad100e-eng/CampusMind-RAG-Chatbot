import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to retrieve token from sessionStorage (non-persistent) or localStorage (persistent)
const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('campusmind_auth') || localStorage.getItem('campusmind_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || parsed?.state?.token || null;
  } catch (e) {
    return null;
  }
};

// Request interceptor to attach JWT from session or local storage if present
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        // Clear both session and local storage and redirect if token expired
        try {
          sessionStorage.removeItem('campusmind_auth');
          localStorage.removeItem('campusmind_auth');
        } catch (e) {}
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
