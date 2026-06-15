"use client";
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import StarryBackground from '../components/common/StarryBackground';
import ScrollToTopButton from '../components/common/ScrollToTopButton';
import BackButton from '../components/common/BackButton';
import PomodoroTimer from '../components/common/PomodoroTimer';
import useLanguageStore from '../store/languageStore';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import useAppSound from '../hooks/useAppSound';

export default function ClientLayout({ children }) {
  const { isRTL } = useLanguageStore();
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore(); // Added auth store to check login
  const { playSwoosh } = useAppSound();
  const { hydrate } = useLanguageStore();

  useEffect(() => {
    setMounted(true);
    hydrate(); // Initialize language from localStorage safely on client
  }, [hydrate]);

  // Global socket integration for cross-page invites
  useEffect(() => {
    if (!user) return;
    
    // Lazy import IO to avoid issues in SSR
    const { io } = require('socket.io-client');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(API_URL);
    
    socket.emit('register', user._id || user.id);
    
    socket.on('receive-invite', (data) => {
      // Play notification sound
      playSwoosh();
      
      // Trigger Navbar refresh event
      window.dispatchEvent(new CustomEvent('new-notification'));
      
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-[350px] md:w-[420px] bg-[var(--bg-card)]/95 backdrop-blur-2xl pointer-events-auto flex flex-col rounded-2xl shadow-3xl ring-1 ring-white/10 overflow-hidden border border-[var(--glass-border)] z-[9999]`}
        >
          <div className="flex-1 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#14B8A6]/20">
                <FiUsers className="text-white text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-[var(--text-primary)] leading-tight">
                  <span className="text-[#14B8A6]">{data.fromUsername}</span> {isRTL ? 'بيتحداك تذاكر!' : 'invites you to study!'}
                </p>
                <p className="mt-1.5 text-[12px] text-[var(--text-muted)] font-black uppercase tracking-widest truncate opacity-70">
                  {data.videoTitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-t border-[var(--glass-border)] bg-white/5">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = `/room/${data.roomId}`;
              }}
              className="flex-1 border-r border-[var(--glass-border)] rounded-none p-4 flex items-center justify-center text-xs font-black text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-all uppercase tracking-widest active:scale-95"
            >
              {isRTL ? 'قبول الدعوة' : 'Accept Invite'}
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded-none p-4 flex items-center justify-center text-xs font-black text-[var(--text-muted)] hover:bg-white/10 transition-all uppercase tracking-widest active:scale-95"
            >
              {isRTL ? 'تجاهل' : 'Dismiss'}
            </button>
          </div>
        </motion.div>
      ), { duration: 20000, position: 'bottom-right' });
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
      <div className="cosmic-mesh-blob bg-gradient-to-tr from-[#14B8A6]/20 to-[#00D4FF]/20 dark:from-[#14B8A6]/10 dark:to-[#0B1120]/10 rounded-full" style={{ top: '-40%', left: '-20%', width: '80vw', height: '80vw' }} />
      <div className="cosmic-mesh-blob bg-gradient-to-bl from-[#7C3AED]/20 to-[#00D4FF]/20 dark:from-[#3B0764]/10 dark:to-[#14B8A6]/10 rounded-full animation-delay-4000" style={{ bottom: '-40%', right: '-20%', width: '70vw', height: '70vw' }} />
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
        <BackButton />
        {user && <PomodoroTimer />}
      </div>
    </div>
  );
}
