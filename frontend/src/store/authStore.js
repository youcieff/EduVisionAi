"use client";
import { create } from 'zustand';
import { authAPI } from '../api/api';
import toast from 'react-hot-toast';

const getSafeUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored || stored === 'undefined') return null;
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getSafeUser(),
  token: typeof window !== 'undefined' ? localStorage.getItem('token') || null : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
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
      toast.error(message);
      return { success: false, error: message };
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
      
      return { 
        success: false, 
        error: message,
        ...(error.response?.data?.data || {})
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