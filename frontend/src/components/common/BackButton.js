"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import useLanguageStore from '../../store/languageStore';

const BackButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isRTL } = useLanguageStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show back button on all pages except the home page
    setVisible(pathname !== '/' && pathname !== '/ar');
  }, [pathname]);

  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => router.back()}
      className={`fixed bottom-8 ${isRTL ? 'right-8' : 'left-8'} z-50 bg-[var(--bg-card)] border border-[var(--glass-border)] text-[var(--text-primary)] w-12 h-12 rounded-full flex items-center justify-center shadow-xl backdrop-blur-xl hover:border-[#14B8A6]/50 transition-colors group`}
      aria-label="Go back"
    >
      <FiArrowLeft 
        size={20} 
        className={`transition-transform group-hover:scale-110 ${isRTL ? 'rotate-180' : ''}`} 
      />
      
      {/* Tooltip */}
      <span className={`absolute ${isRTL ? 'right-14' : 'left-14'} bg-[var(--bg-card)] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-[var(--glass-border)] pointer-events-none`}>
        {isRTL ? 'رجوع' : 'Go Back'}
      </span>
    </motion.button>
  );
};

export default BackButton;
