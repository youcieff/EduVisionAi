"use client";
import React, { useEffect, useState } from 'react';
import useThemeStore from '../../store/themeStore';

const StarryBackground = () => {
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {isDark ? (
        // Dark Mode: Deep space with subtle aurora/gradient orbs
        <div className="absolute inset-0 bg-[var(--bg-primary)]">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00D4FF] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob" />
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-[#8B5CF6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-[#14B8A6] rounded-full mix-blend-screen filter blur-[130px] opacity-10 animate-blob animation-delay-4000" />
        </div>
      ) : (
        // Light Mode: Clean, bright, soft pastel gradient orbs
        <div className="absolute inset-0 bg-[var(--bg-primary)]">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00D4FF] rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob" />
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-[#14B8A6] rounded-full mix-blend-multiply filter blur-[130px] opacity-20 animate-blob animation-delay-4000" />
        </div>
      )}
    </div>
  );
};

export default StarryBackground;
