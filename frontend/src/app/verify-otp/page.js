"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import SEO from '@/components/common/SEO';
import { FiCheckCircle } from 'react-icons/fi';

const VerifyOTPContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const { verifyOtp, resendOtp, loading } = useAuthStore();

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    else {
      // If no email, redirect back to register
      router.push('/register');
    }
  }, [emailParam, router]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;
    
    const result = await verifyOtp({ email, otp: otpCode });
    if (result.success) {
      router.push('/dashboard');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await resendOtp(email);
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    document.getElementById('otp-0')?.focus();
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <SEO title="Verify Email" description="Verify your email address." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl w-full max-w-md border border-[var(--glass-border)] text-center"
      >
        <div className="mx-auto w-16 h-16 bg-[#14B8A6]/20 rounded-full flex items-center justify-center mb-6">
          <FiCheckCircle className="text-[#14B8A6] text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Check your email</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          We've sent a 6-digit verification code to <strong className="text-[#14B8A6]">{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-4">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full btn-gold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-8 text-sm">
          <p className="text-[var(--text-secondary)] mb-2">Didn't receive the code?</p>
          {canResend ? (
            <button onClick={handleResend} className="text-[#14B8A6] hover:underline font-medium">
              Resend Code
            </button>
          ) : (
            <p className="text-[var(--text-muted)]">
              Resend available in <span className="text-[#F59E0B] font-mono">{timer}s</span>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
