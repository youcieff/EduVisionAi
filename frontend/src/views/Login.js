"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useLanguageStore from '../store/languageStore';
import SEO from '../components/common/SEO';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuthStore();
  const { t, isRTL } = useLanguageStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      if (result.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else if (result.requireVerification) {
      // If login is blocked because of email not verified
      router.push(`/verify-otp?email=${encodeURIComponent(result.email)}`);
    }
  };

  const iconStart = isRTL ? { right: '0.75rem' } : { left: '0.75rem' };
  const iconEnd = isRTL ? { left: '0.75rem' } : { right: '0.75rem' };
  const inputPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const inputPaddingWithEnd = isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12';

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <SEO title={t('login.title') || 'Login'} description="Login to your EduVisionAI account to access your personalized learning dashboard." />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl w-full max-w-md border border-[var(--glass-border)]"
      >
        <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
          {t('login.title')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">{t('login.email')}</label>
            <div className="relative">
              <FiMail className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPadding} py-3`}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">{t('login.password')}</label>
            <div className="relative">
              <FiLock className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPaddingWithEnd} py-3`}
                placeholder="••••••••"
                required
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
            className="w-full btn-gold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        <p className="text-center text-[var(--text-muted)] mt-6 text-sm">
          {t('login.noAccount')}{' '}
          <Link href="/register" className="text-[#14B8A6] hover:underline font-bold">
            {t('login.createAccount')}
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-[var(--glass-border)] text-center">
          <Link href="/admin/login" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-red-500 transition-colors px-4 py-2 rounded-full bg-[var(--input-bg)] hover:bg-red-500/10 border border-transparent hover:border-red-500/30">
            <FiLock /> {isRTL ? 'دخول الإدارة' : 'Admin Portal'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;