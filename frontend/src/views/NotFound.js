"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHome } from 'react-icons/fi';
import useLanguageStore from '../store/languageStore';

const NotFound = () => {
  const { lang } = useLanguageStore();
  
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          🔭
        </motion.div>
        <h1 className="text-7xl font-bold text-[var(--text-primary)] mb-4">
          4<span className="text-[#14B8A6]">0</span>4
        </h1>
        <p className="text-xl text-[var(--text-secondary)] mb-8">
          {lang === 'ar' ? 'عذراً، الصفحة غير موجودة' : "Oops! Page not found"}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 btn-gold px-8 py-4 rounded-xl text-lg"
        >
          <FiHome />
          {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
