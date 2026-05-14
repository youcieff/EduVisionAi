"use client";
import { create } from 'zustand';
import { videoAPI } from '../api/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

let socket = null;

const useVideoStore = create((set, get) => ({
  videos: [],
  currentVideo: null,
  myVideos: [],
  loading: false,
  uploading: false, // For file upload bar
  uploadProgress: 0,
  
  // Real-time AI processing tracking (Map of videoId -> status)
  aiProcessingStatuses: {}, // e.g. { 'vid123': { status: 'processing', progress: 10, message: 'Starting...' } }

  initSocket: (videoId) => {
    if (!socket) {
      // Connect to Socket.io server (port 5000)
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    }
    
    // Clear any previous listeners for this video to avoid duplicates
    socket.off(`processing:${videoId}`);
    
    // Set initial status to show the user that AI is starting
    set((state) => ({ 
      aiProcessingStatuses: { 
        ...state.aiProcessingStatuses, 
        [videoId]: { status: 'processing', progress: 5, message: 'Warming up AI Engine...' } 
      }
    }));
    
    socket.on(`processing:${videoId}`, (data) => {
      set((state) => ({
        aiProcessingStatuses: {
          ...state.aiProcessingStatuses,
          [videoId]: data
        }
      }));
      
      if (data.status === 'completed' || data.status === 'failed') {
        socket.off(`processing:${videoId}`);
        if (data.status === 'completed') {
           toast.success('AI Analysis Complete! Ready to study. 🚀');
        }
        // Re-fetch videos to update the main list state
        get().fetchMyVideos();
      }
    });
  },
  
  clearProcessingStatus: (videoId) => set((state) => {
    const newStatuses = { ...state.aiProcessingStatuses };
    delete newStatuses[videoId];
    return { aiProcessingStatuses: newStatuses };
  }),

  fetchVideos: async (params) => {
    set({ loading: true });
    try {
      const response = await videoAPI.getAllVideos(params);
      set({ videos: response.data.data.videos, loading: false });
    } catch (error) {
      set({ loading: false });
      // Silently fail to prevent toast spam when backend is down
      console.error('Failed to load videos:', error.message);
    }
  },

  fetchVideo: async (id, skipView = false) => {
    if (!skipView) set({ loading: true });
    try {
      // Track views per session to avoid inflation
      let shouldSkip = skipView;
      if (!skipView) {
        const viewedKey = `viewed_${id}`;
        if (sessionStorage.getItem(viewedKey)) {
          shouldSkip = true;
        } else {
          sessionStorage.setItem(viewedKey, '1');
        }
      }
      const response = await videoAPI.getVideo(id, shouldSkip);
      set({ currentVideo: response.data.data.video, loading: false });
    } catch (error) {
      set({ loading: false });
      if (!skipView) toast.error('Failed to load video');
    }
  },

  uploadVideo: async (formData) => {
    set({ uploading: true, uploadProgress: 0 });
    try {
      const response = await videoAPI.uploadVideo(
        formData,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          set({ uploadProgress: progress });
        }
      );
      
      set({ uploading: false, uploadProgress: 0 });
      
      // Start listening to AI processing updates immediately
      if (response.data?.data?.video?._id) {
        get().initSocket(response.data.data.video._id);
      }
      
      toast.success('Video uploaded successfully! 🎬 Starting analysis...');
      return { success: true, video: response.data.data.video };
    } catch (error) {
      set({ uploading: false, uploadProgress: 0 });
      const message = error.response?.data?.message || 'Failed to upload video';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  uploadFromUrl: async (data) => {
    set({ uploading: true });
    try {
      const response = await videoAPI.uploadFromUrl(data);
      
      set({ uploading: false });
      
      // Start listening to AI processing updates immediately
      if (response.data?.data?.video?._id) {
        get().initSocket(response.data.data.video._id);
      }
      
      toast.success('Video URL saved successfully! 🎬 Starting analysis...');
      return { success: true, video: response.data.data.video };
    } catch (error) {
      set({ uploading: false });
      const message = error.response?.data?.message || 'Failed to save video URL';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  uploadPDF: async (formData) => {
    set({ uploading: true, uploadProgress: 0 });
    try {
      const response = await videoAPI.uploadPDF(
        formData,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          set({ uploadProgress: progress });
        }
      );
      set({ uploading: false, uploadProgress: 0 });
      
      // Start listening to AI processing updates immediately
      if (response.data?.data?.video?._id) {
        get().initSocket(response.data.data.video._id);
      }
      
      toast.success('PDF uploaded! 📄 Starting analysis...');
      return { success: true, video: response.data.data.video };
    } catch (error) {
      set({ uploading: false, uploadProgress: 0 });
      const message = error.response?.data?.message || 'Failed to upload PDF';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  uploadImage: async (formData) => {
    set({ uploading: true, uploadProgress: 0 });
    try {
      const response = await videoAPI.uploadImage(
        formData,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          set({ uploadProgress: progress });
        }
      );
      set({ uploading: false, uploadProgress: 0 });
      
      // Start listening to AI updates
      if (response.data?.data?.video?._id) {
        get().initSocket(response.data.data.video._id);
      }
      
      toast.success('Image uploaded! 🖼️ Starting analysis...');
      return { success: true, video: response.data.data.video };
    } catch (error) {
      set({ uploading: false, uploadProgress: 0 });
      const message = error.response?.data?.message || 'Failed to upload image';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  uploadPPTX: async (formData) => {
    set({ uploading: true, uploadProgress: 0 });
    try {
      const response = await videoAPI.uploadPPTX(
        formData,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          set({ uploadProgress: progress });
        }
      );
      set({ uploading: false, uploadProgress: 0 });
      
      // Start listening to AI updates
      if (response.data?.data?.video?._id) {
        get().initSocket(response.data.data.video._id);
      }
      
      toast.success('PowerPoint uploaded! 📊 Starting analysis...');
      return { success: true, video: response.data.data.video };
    } catch (error) {
      set({ uploading: false, uploadProgress: 0 });
      const message = error.response?.data?.message || 'Failed to upload PowerPoint';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  fetchMyVideos: async () => {
    set({ loading: true });
    try {
      const response = await videoAPI.getMyVideos();
      set({ myVideos: response.data.data.videos, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error('Failed to load your videos');
    }
  },

  submitQuiz: async (id, answers) => {
    try {
      const response = await videoAPI.submitQuiz(id, { answers });
      toast.success('Quiz submitted successfully! 🎯');
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit quiz';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  deleteVideo: async (id) => {
    try {
      await videoAPI.deleteVideo(id);
      set(state => ({
        videos: state.videos.filter(v => v._id !== id),
        myVideos: state.myVideos.filter(v => v._id !== id),
      }));
      toast.success('Video deleted ✅');
      return { success: true };
    } catch (error) {
      toast.error('Failed to delete video');
      return { success: false };
    }
  },

  toggleLike: async (id) => {
    try {
      const response = await videoAPI.toggleLike(id);
      toast.success(response.data.data.isLiked ? '❤️ Liked video' : 'Unliked video');
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error('Failed to register like');
      return { success: false };
    }
  },

  retryProcessing: async (id, instructions, language) => {
    try {
      await videoAPI.retryProcessing(id, { instructions, language });
      toast.success('Retrying AI analysis... 🔄');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to retry processing';
      toast.error(message);
      return { success: false };
    }
  },
  
  // Directly set current video (useful for partial AI updates)
  setCurrentVideo: (video) => {
    set({ currentVideo: typeof video === 'function' ? video(get().currentVideo) : video });
  },
}));

export default useVideoStore;