"use client";
import { create } from 'zustand';
import { authAPI } from '../api/api';
import toast from 'react-hot-toast';

const isDemoMode = typeof window !== 'undefined' && (
  localStorage.getItem('edu-demo-mode') === 'true' ||
  (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
);

const mockUser = {
  id: 'demo-user',
  username: 'Guest Student',
  email: 'guest@eduvision.ai',
  role: 'user',
  subscription: 'premium',
  createdAt: '2026-06-25T12:00:00.000Z'
};

const getInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }

  if (isDemoMode) {
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', 'mock-token');
    }
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(mockUser));
    }
    return {
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true
    };
  }

  try {
    const token = localStorage.getItem('token') || null;
    const storedUser = localStorage.getItem('user');
    const user = (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : null;
    return {
      user,
      token,
      isAuthenticated: !!token
    };
  } catch (e) {
    console.error('Error parsing auth state:', e);
    return { user: null, token: null, isAuthenticated: false };
  }
};

const initialState = getInitialAuthState();

const useAuthStore = create((set) => ({
  user: initialState.user,
  token: initialState.token,
  isAuthenticated: initialState.isAuthenticated,
  loading: false,

  register: async (userData) => {
    set({ loading: true });
    try {
      const response = await authAPI.register(userData);
      const email = response.data.data.email;
      
      set({ loading: false });
      toast.success('Registration successful! Please check your email for the OTP.');
      return { success: true, email };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.message || 'Registration failed';
      const data = error.response?.data?.data || {};
      if (data.needsVerification) {
        toast('Your account is pending verification. Redirecting to OTP page...', { icon: '📧' });
      } else {
        toast.error(message);
      }
      return { 
        success: false, 
        error: message,
        needsVerification: data.needsVerification || false,
        email: data.email,
      };
    }
  },

  verifyOtp: async (data) => {
    set({ loading: true });
    try {
      const response = await authAPI.verifyOtp(data);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true, loading: false });
      toast.success(`Welcome ${user.username}! 🎉`);
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.message || 'Invalid OTP';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  resendOtp: async (email) => {
    set({ loading: true });
    try {
      await authAPI.resendOtp({ email });
      set({ loading: false });
      toast.success('New OTP sent to your email.');
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.message || 'Failed to resend';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  login: async (credentials) => {
    set({ loading: true });
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true, loading: false });
      toast.success(`Welcome ${user.username}! 👋`);
      return { success: true, user };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      
      const data = error.response?.data?.data || {};
      return { 
        success: false, 
        error: message,
        needsVerification: data.needsVerification || false,
        email: data.email || credentials.email,
        ...data,
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
    toast.success('Logged out successfully');
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user, isAuthenticated: !!user });
  },

  updateProfile: async (userData) => {
    set({ loading: true });
    try {
      const response = await authAPI.updateProfile(userData);
      const user = response.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(user));
      set({ user: user, loading: false });
      
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  },
}));

export default useAuthStore;