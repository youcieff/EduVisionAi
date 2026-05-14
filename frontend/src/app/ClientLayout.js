"use client";
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import StarryBackground from '../components/common/StarryBackground';
import ScrollToTopButton from '../components/common/ScrollToTopButton';
import PomodoroTimer from '../components/common/PomodoroTimer';
import useLanguageStore from '../store/languageStore';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';

export default function ClientLayout({ children }) {
  const { isRTL } = useLanguageStore();
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore(); // Added auth store to check login

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global socket integration for cross-page invites
  useEffect(() => {
    if (!user) return;
    
    // Lazy import IO to avoid issues in SSR
    const { io } = require('socket.io-client');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(API_URL);
    
    socket.emit('register', user._id || user.id);
    
    socket.on('receive-invite', (data) => {
      import('react-hot-toast').then(({ toast }) => {
        toast((t) => (
          <div className="flex flex-col gap-2 p-1">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">{data.fromUsername} {isRTL ? 'دعاك للمذاكرة!' : 'invited you to study!'}</h3>
            <p className="text-xs text-[var(--text-secondary)] truncate w-48">{data.videoTitle}</p>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => { toast.dismiss(t.id); window.location.href = `/room/${data.roomId}`; }} 
                className="bg-[#14B8A6] text-white text-xs px-3 py-1.5 rounded-lg flex-1"
              >
                {isRTL ? 'قبول' : 'Accept'}
              </button>
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="bg-gray-500/20 text-gray-500 text-xs px-3 py-1.5 rounded-lg flex-1"
              >
                {isRTL ? 'رفض' : 'Decline'}
              </button>
            </div>
          </div>
        ), { duration: 15000 });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isRTL]);

  return (
    <div className="min-h-screen relative flex flex-col" dir={mounted && isRTL ? 'rtl' : 'ltr'}>
      <StarryBackground />
      {/* Premium Glass Noise Surface Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"1.5\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')" }}></div>
      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
        <Navbar />
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              background: (mounted && isDark) ? '#0a0a1a' : '#FFFFFF',
              color: (mounted && isDark) ? '#fff' : '#1A2332',
              border: `1px solid ${(mounted && isDark) ? 'rgba(255, 255, 255, 0.06)' : 'rgba(26, 35, 50, 0.08)'}`,
              boxShadow: (mounted && isDark) ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: {
                primary: '#14B8A6',
                secondary: (mounted && isDark) ? '#0a0a1a' : '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <div className="flex-1">
          {children}
        </div>

        <Footer />
        <ScrollToTopButton />
        {user && <PomodoroTimer />}
      </div>
    </div>
  );
}
