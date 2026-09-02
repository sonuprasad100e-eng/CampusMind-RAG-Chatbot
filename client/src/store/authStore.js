import { create } from 'zustand';
import api from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';

// Helper to read stored session from sessionStorage or localStorage
const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('campusmind_auth') || localStorage.getItem('campusmind_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const isPersistent = !!localStorage.getItem('campusmind_auth');
    if (parsed.token && parsed.user) {
      return { token: parsed.token, user: parsed.user, isPersistent };
    }
  } catch (e) {
    console.warn('Failed to parse auth from storage');
  }
  return null;
};

// Helper to save session to the appropriate storage
const saveAuth = (user, token, rememberMe = true) => {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify({ user, token, rememberMe });
    if (rememberMe) {
      localStorage.setItem('campusmind_auth', payload);
      sessionStorage.removeItem('campusmind_auth');
    } else {
      sessionStorage.setItem('campusmind_auth', payload);
      localStorage.removeItem('campusmind_auth');
    }
  } catch (e) {}
};

// Helper to clear both storages
const clearAuth = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('campusmind_auth');
    sessionStorage.removeItem('campusmind_auth');
  } catch (e) {}
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize from Session / LocalStorage
  initAuth: async () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = getStoredAuth();
      if (stored) {
        set({
          user: stored.user,
          token: stored.token,
          isAuthenticated: true,
          isLoading: false,
        });
        getSocket(stored.token);

        // Verify token & refresh profile in background
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data?.user) {
            const updatedUser = res.data.data.user;
            set({ user: updatedUser });
            saveAuth(updatedUser, stored.token, stored.isPersistent);
          }
        } catch (e) {
          if (e.response?.status === 401) {
            // Token is expired or invalid, clear state
            clearAuth();
            disconnectSocket();
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        }
        return;
      }
    } catch (e) {
      console.warn('Auth initialization error:', e);
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  login: async (email, password, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      saveAuth(user, token, rememberMe);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      getSocket(token);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user, token } = res.data.data;

      saveAuth(user, token, rememberMe);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      getSocket(token);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    clearAuth();
    disconnectSocket();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  updatePassword: async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      return { success: false, error: msg };
    }
  },
}));
