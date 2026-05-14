"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useLanguageStore from '../store/languageStore';
import SEO from '../components/common/SEO';

const Register = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [university, setUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuthStore();
  const { t, isRTL } = useLanguageStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register({ username, email, password, fullName, phone, specialization, university });
    if (result.success) {
      router.push(`/verify-otp?email=${encodeURIComponent(result.email)}`);
    }
  };

  const iconStart = isRTL ? { right: '0.75rem' } : { left: '0.75rem' };
  const iconEnd = isRTL ? { left: '0.75rem' } : { right: '0.75rem' };
  const inputPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const inputPaddingWithEnd = isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12';

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <SEO title={t('register.title') || 'Create Account'} description="Create your EduVisionAI account today and start transforming your learning material with AI." />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl w-full max-w-md border border-[var(--glass-border)]"
      >
        <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
          {t('register.title')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">{t('register.username')}</label>
            <div className="relative">
              <FiUser className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPadding} py-3`}
                placeholder="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">Full Name</label>
            <div className="relative">
              <FiUser className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPadding} py-3`}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">Phone Number (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full input-dark rounded-lg px-4 py-3`}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--text-secondary)] block mb-2 text-sm">Specialization (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className={`w-full input-dark rounded-lg px-4 py-3`}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>
            <div>
              <label className="text-[var(--text-secondary)] block mb-2 text-sm">University (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className={`w-full input-dark rounded-lg px-4 py-3`}
                  placeholder="e.g. Cairo University"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">{t('register.email')}</label>
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
            <label className="text-[var(--text-secondary)] block mb-2 text-sm">{t('register.password')}</label>
            <div className="relative">
              <FiLock className="absolute top-3.5 text-[var(--text-muted)]" style={iconStart} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full input-dark rounded-lg ${inputPaddingWithEnd} py-3`}
                placeholder="••••••••"
                required
                minLength={6}
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
            {loading ? t('register.submitting') : t('register.submit')}
          </button>
        </form>

        <p className="text-center text-[var(--text-muted)] mt-6">
          {t('register.hasAccount')}{' '}
          <Link href="/login" className="text-[#14B8A6] hover:underline">
            {t('register.signIn')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;