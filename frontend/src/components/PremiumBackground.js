"use client";
import React from 'react';

const PremiumBackground = () => {
  return (
    <div className="fixed inset-0 w-screen h-[100dvh] z-[-1] overflow-hidden pointer-events-none">
      
      {/* Light Mode Moving Spectrum Auras (Apple Glass Aesthetic) */}
      {/* Soft, glowing, pastel luminous blobs on a bright base */}
      <div className="absolute top-[0%] left-[-10%] w-[80vw] h-[80vw] max-w-[1400px] max-h-[1400px] bg-[#38bdf8]/15 rounded-full blur-[180px] animate-blob dark:hidden pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[70vw] h-[70vw] max-w-[1200px] max-h-[1200px] bg-[#c084fc]/15 rounded-full blur-[180px] animate-blob animation-delay-2000 dark:hidden pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] max-w-[1400px] max-h-[1400px] bg-[#2dd4bf]/15 rounded-full blur-[180px] animate-blob animation-delay-4000 dark:hidden pointer-events-none" />

      {/* Dark Mode: Legendary, Chic, Simple, Smooth, Premium, Glassy */}
      {/* Increased opacity back to /15 and added mix-blend-lighten to make the spectrum more visible and beautifully luminous without washing out the dark navy base */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] max-w-[1400px] max-h-[1400px] bg-[#14B8A6]/15 rounded-full blur-[200px] mix-blend-lighten animate-blob hidden dark:block pointer-events-none" />
      
      <div className="absolute top-[20%] right-[-20%] w-[70vw] h-[70vw] max-w-[1200px] max-h-[1200px] bg-[#0ea5e9]/15 rounded-full blur-[200px] mix-blend-lighten animate-blob animation-delay-2000 hidden dark:block pointer-events-none" />
      
      <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] max-w-[1400px] max-h-[1400px] bg-[#8B5CF6]/15 rounded-full blur-[200px] mix-blend-lighten animate-blob animation-delay-4000 hidden dark:block pointer-events-none" />
      
    </div>
  );
};

export default PremiumBackground;
