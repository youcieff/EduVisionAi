"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/api';
import useAuthStore from '../../../store/authStore';
import useLanguageStore from '../../../store/languageStore';

export default function AdminLogin() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { lang, isRTL } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(lang === 'ar' ? 'يرجى إدخال جميع البيانات' : 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await adminAPI.login({ email, password });
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success(lang === 'ar' ? 'مرحباً بعودتك! 👑' : 'Welcome back Admin! 👑');
      router.push('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || (lang === 'ar' ? 'رسالة خطأ غير متوقعة' : 'Unexpected error occurred'));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const iconStart = isRTL ? { right: '0.75rem' } : { left: '0.75rem' };
  const iconEnd = isRTL ? { left: '0.75rem' } : { right: '0.75rem' };
  const inputPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const inputPaddingWithEnd = isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12';

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl w-full max-w-md border border-[var(--glass-border)] relative overflow-hidden"
      >
        {/* Accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#14B8A6] via-[#00D4FF] to-[#14B8A6]" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] rounded-2xl flex items-center justify-center text-white mb-4 shadow-[0_0_25px_rgba(20,184,166,0.35)] border border-white/20">
            <FiShield size={28} />
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            {lang === 'ar' ? 'بوابة الإدارة' : 'Admin Portal'}
          </h2>
          <p className="text-[var(--text-muted)] mt-2 text-sm">
            {lang === 'ar' ? 'منطقة مقيدة — للمسؤولين فقط' : 'Restricted Area — Administrators Only'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
              <FiMail className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPadding} py-3`}
                placeholder="admin@eduvision.ai"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <FiLock className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPaddingWithEnd} py-3`}
                placeholder="••••••••"
                required
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3.5 text-[var(--text-muted)] hover:text-[#14B8A6] transition"
                style={iconEnd}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              lang === 'ar' ? 'تأكيد الهوية والدخول' : 'Authenticate & Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
          <FiLock className="text-[#14B8A6]" /> 
          {lang === 'ar' ? 'استخدام غير مصرح به يؤدي للمساءلة' : 'Unauthorized access is strictly prohibited'}
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--glass-border)] text-center">
          <Link href="/login" className="text-[var(--text-muted)] hover:text-[#14B8A6] text-sm transition-colors">
            {isRTL ? '← العودة لتسجيل دخول الطلاب' : '← Back to Student Login'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
