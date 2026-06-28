"use client";
import axios from 'axios';
import { API_URL } from '../utils/apiConfig';
import * as demo from './demoData';

const isDemoMode = typeof window !== 'undefined' && (
  localStorage.getItem('edu-demo-mode') === 'true' ||
  (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

api.interceptors.request.use(
  (config) => {
    if (isDemoMode) {
      config.adapter = async (cfg) => {
        const url = cfg.url ? cfg.url.replace(/^\/?api/, '') : '';
        let responseData = {};

        if (url.includes('/auth/login') || url.includes('/auth/register')) {
          responseData = { token: 'mock-token', user: demo.mockUser };
        } else if (url.includes('/auth/me')) {
          responseData = { user: demo.mockUser };
        } else if (url.includes('/users/dashboard')) {
          responseData = demo.mockDashboard;
        } else if (url.includes('/users/leaderboard')) {
          responseData = demo.mockLeaderboard;
        } else if (url.includes('/users/study-recommendations')) {
          responseData = demo.mockRecommendations;
        } else if (url.includes('/notifications/mark-read')) {
          responseData = { success: true };
        } else if (url.includes('/notifications')) {
          responseData = demo.mockNotifications;
        } else if (url.includes('/videos/user/my-videos')) {
          responseData = { videos: demo.mockVideos };
        } else if (url.includes('/videos/flashcards/due')) {
          responseData = { flashcards: demo.getMockDueFlashcards() };
        } else if (url.includes('/videos/flashcards/review')) {
          responseData = { success: true, message: 'Card updated' };
        } else if (url.includes('/videos/achievements')) {
          responseData = { achievements: [] };
        } else if (url.includes('/videos/') && url.includes('/chat')) {
          const match = url.match(/\/videos\/([^\/]+)\/chat/);
          const videoId = match ? match[1] : 'vid1';
          let msg = '';
          try {
            const body = JSON.parse(cfg.data);
            msg = body.message;
          } catch(e){}
          responseData = demo.getMockChatReply(videoId, msg);
        } else if (url.includes('/videos/') && url.includes('/notes')) {
          responseData = { content: '# Study Notes (Mocked from video content)' };
        } else if (url.includes('/videos/') && (url.includes('/like') || url.includes('/submit-quiz') || url.includes('/retry-processing'))) {
          responseData = { success: true, status: 'processed', score: 100 };
        } else if (url.includes('/videos/')) {
          const match = url.match(/\/videos\/([^\/\?]+)/);
          const videoId = match ? match[1] : 'vid1';
          responseData = demo.mockVideoDetails[videoId] || demo.mockVideoDetails['vid1'];
        } else if (url.includes('/videos')) {
          responseData = { videos: demo.mockVideos };
        } else if (url.includes('/subscription/my-usage')) {
          responseData = { processedMinutes: 120, limitMinutes: 500, planName: 'Premium Free Showcase' };
        } else if (url.includes('/subscription/plans')) {
          responseData = { plans: [] };
        }

        return {
          data: responseData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: cfg,
        };
      };
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
  uploadAvatar: (formData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDashboard: () => api.get('/users/dashboard'),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getNotifications: () => api.get('/notifications'),
  markNotificationsRead: () => api.post('/notifications/mark-read'),
  getStudyRecommendations: () => api.get('/users/study-recommendations'),
};

export const videoAPI = {
  getAllVideos: (params) => api.get('/videos', { params }),
  getVideo: (id, skipView = false) => api.get(`/videos/${id}${skipView ? `?skipView=true&_t=${Date.now()}` : ''}`),
  uploadVideo: (formData, onUploadProgress) => 
    api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  uploadFromUrl: (data) => api.post('/videos/upload-url', data),
  uploadPDF: (formData, onUploadProgress) =>
    api.post('/videos/upload-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  uploadImage: (formData, onUploadProgress) =>
    api.post('/videos/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  uploadPPTX: (formData, onUploadProgress) =>
    api.post('/videos/upload-pptx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  getMyVideos: () => api.get('/videos/user/my-videos'),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  toggleLike: (id) => api.post(`/videos/${id}/like`),
  submitQuiz: (id, data) => api.post(`/videos/${id}/submit-quiz`, data),
  retryProcessing: (id, data) => api.post(`/videos/${id}/retry-processing`, data),
  getPersonalNotes: (id) => api.get(`/videos/${id}/notes`),
  savePersonalNotes: (id, content) => api.post(`/videos/${id}/notes`, { content }),
  exportAnki: (id) => api.get(`/videos/export-anki/${id}`, { responseType: 'blob' }),
  getStudyCoach: () => api.get('/videos/study-coach'),
  getAchievements: () => api.get('/videos/achievements'),
  getDueFlashcards: () => api.get('/videos/flashcards/due'),
  reviewFlashcard: (data) => api.post('/videos/flashcards/review', data),
  chatWithVideo: (id, message) => api.post(`/videos/${id}/chat`, { message }),
  regenerateComponent: (id, data) => api.post(`/videos/${id}/regenerate-component`, data),
  generateChatAudio: (data) => api.post('/videos/chat/audio', data, { responseType: 'arraybuffer' }),
};

export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  register: (data) => api.post('/admin/register', data),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAiStats: () => api.get('/admin/ai-stats'),
  getUserUsage: (id) => api.get(`/admin/users/${id}/usage`),
  getUserProfile: (id) => api.get(`/admin/users/${id}/profile`),
  getProcessingQueue: (params) => api.get('/admin/processing-queue', { params }),
  updateUserSubscription: (id, plan) => api.put(`/admin/users/${id}/subscription`, { plan }),
  getRevenue: () => api.get('/admin/revenue'),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getMyUsage: () => api.get('/subscription/my-usage'),
  upgrade: (plan) => api.post('/subscription/upgrade', { plan }),
};

export default api;