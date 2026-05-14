"use client";
import React from 'react';
import Link from 'next/link';
import EduVisionLogo from '../common/EduVisionLogo';
import { FiGithub, FiMail } from 'react-icons/fi';
import useLanguageStore from '../../store/languageStore';

const Footer = () => {
  const { lang } = useLanguageStore();
  const isAr = lang === 'ar';

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-nav)]/80 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg overflow-hidden shadow-md shadow-[#14B8A6]/20">
                <EduVisionLogo size={36} />
              </div>
              <span className="text-[var(--text-primary)] text-lg font-bold">
                EduVision<span className="text-[#14B8A6]">AI</span>
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              {isAr 
                ? 'منصة تعليمية ذكية تستخدم الذكاء الاصطناعي لتلخيص المحتوى وتوليد الأسئلة التفاعلية.'
                : 'An intelligent learning platform powered by AI to summarize content and generate interactive quizzes.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-[var(--text-muted)] hover:text-[#14B8A6] transition">
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[#14B8A6] transition">
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <Link href="/upload" className="text-[var(--text-muted)] hover:text-[#14B8A6] transition">
              {isAr ? 'رفع محتوى' : 'Upload'}
            </Link>
            <Link href="/about" className="text-[var(--text-muted)] hover:text-[#14B8A6] transition">
              {isAr ? 'كيف يعمل' : 'How It Works'}
            </Link>
          </div>

          {/* Social */}
          <div className="flex gap-3">
            <a href="mailto:contact@eduvision.ai" className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#14B8A6] hover:border-[#14B8A6]/30 transition">
              <FiMail size={16} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#14B8A6] hover:border-[#14B8A6]/30 transition">
              <FiGithub size={16} />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--border-color)] mt-8 pt-6 text-center">
          <p className="text-[var(--text-muted)] text-xs">
            © {new Date().getFullYear()} EduVisionAI. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
