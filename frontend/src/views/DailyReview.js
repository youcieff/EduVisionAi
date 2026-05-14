"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiArrowLeft, FiCheck, FiX, FiZap, FiStar, FiAward, FiChevronLeft } from 'react-icons/fi';
import { HiOutlineSparkles, HiOutlineLightBulb } from 'react-icons/hi';
import { videoAPI } from '../api/api';
import useLanguageStore from '../store/languageStore';
import useThemeStore from '../store/themeStore';
import Link from 'next/link';

const QUALITY_BUTTONS = [
  { quality: 0, label: 'مرة تاني', labelEn: 'Again', color: '#EF4444', icon: FiX, description: 'نسيتها تماماً', descEn: 'Forgot completely' },
  { quality: 2, label: 'صعبة', labelEn: 'Hard', color: '#F59E0B', icon: HiOutlineLightBulb, description: 'تذكرتها بصعوبة', descEn: 'Recalled with difficulty' },
  { quality: 4, label: 'كويسة', labelEn: 'Good', color: '#14B8A6', icon: FiCheck, description: 'تذكرتها', descEn: 'Recalled correctly' },
  { quality: 5, label: 'سهلة', labelEn: 'Easy', color: '#3B82F6', icon: FiZap, description: 'حافظها كويس', descEn: 'Too easy' },
];

export default function DailyReview() {
  const { lang, t } = useLanguageStore();
  const { isDark } = useThemeStore();
  const isRTL = lang === 'ar';

  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await videoAPI.getDueFlashcards();
      const data = res.data?.data;
      setCards(data?.cards || []);
      setCurrentIdx(0);
      setReviewed(0);
      setTotalXP(0);
      setDone(false);
      setIsFlipped(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleRate = async (quality) => {
    const card = cards[currentIdx];
    if (!card) return;

    try {
      const res = await videoAPI.reviewFlashcard({
        videoId: card.video,
        cardIndex: card.cardIndex,
        quality
      });
      const xp = res.data?.data?.xpEarned || 0;
      setTotalXP(prev => prev + xp);
      setReviewed(prev => prev + 1);

      // Next card or done
      if (currentIdx + 1 >= cards.length) {
        setDone(true);
      } else {
        setIsFlipped(false);
        setTimeout(() => setCurrentIdx(prev => prev + 1), 200);
      }
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  const currentCard = cards[currentIdx];
  const progressPct = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;

  // ========================= RENDER =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <FiRefreshCw size={32} className="text-[#14B8A6]" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl border border-red-500/30 p-8 text-center max-w-md">
          <FiX size={40} className="text-red-500 mx-auto mb-4" />
          <p className="text-[var(--text-primary)] font-bold mb-2">{error}</p>
          <button onClick={fetchCards} className="mt-4 px-6 py-2 rounded-xl bg-[#14B8A6] text-white font-bold text-sm">
            {isRTL ? 'حاول مرة أخرى' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Done state
  if (done || cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl border border-[#14B8A6]/30 p-10 text-center max-w-md w-full"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <FiAward size={56} className="text-[#F59E0B] mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2" dir="auto">
            {cards.length === 0
              ? (isRTL ? '🎉 مفيش بطاقات للمراجعة!' : '🎉 No cards to review!')
              : (isRTL ? '🏆 أحسنت! خلصت المراجعة' : '🏆 Great job! Review complete')
            }
          </h2>
          {cards.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-4 mb-6">
              <div className="glass rounded-xl border border-[var(--glass-border)] px-4 py-2 text-center">
                <p className="text-xs text-[var(--text-muted)]">{isRTL ? 'بطاقات' : 'Cards'}</p>
                <p className="text-xl font-black text-[#14B8A6]">{reviewed}</p>
              </div>
              <div className="glass rounded-xl border border-[var(--glass-border)] px-4 py-2 text-center">
                <p className="text-xs text-[var(--text-muted)]">XP</p>
                <p className="text-xl font-black text-[#F59E0B]">+{totalXP}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-[var(--text-muted)] mb-6" dir="auto">
            {cards.length === 0
              ? (isRTL ? 'ارفع فيديوهات أو ملفات وابدأ الدراسة!' : 'Upload videos or files to start studying!')
              : (isRTL ? 'رجّع بكرا عشان تكمل تقدمك 🔥' : 'Come back tomorrow to keep your streak! 🔥')
            }
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl glass border border-[var(--glass-border)] text-[var(--text-primary)] font-bold text-sm hover:border-[#14B8A6]/50 transition-colors">
              {isRTL ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            {cards.length > 0 && (
              <button onClick={fetchCards} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white font-bold text-sm shadow-lg">
                {isRTL ? 'مراجعة جديدة' : 'New Session'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Active review
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24">
      {/* Header */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[#14B8A6] transition-colors text-sm font-semibold">
            <FiChevronLeft size={18} />
            {isRTL ? 'رجوع' : 'Back'}
          </Link>
          <div className="flex items-center gap-2">
            <HiOutlineSparkles className="text-[#F59E0B]" size={18} />
            <span className="text-sm font-black text-[#F59E0B]">+{totalXP} XP</span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1" dir="auto">
          {isRTL ? '🧠 المراجعة اليومية' : '🧠 Daily Review'}
        </h1>
        <p className="text-xs text-[var(--text-muted)]" dir="auto">
          {isRTL ? `${reviewed} من ${cards.length} بطاقة` : `${reviewed} of ${cards.length} cards`}
        </p>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[var(--border-color)]/30 mt-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#00D4FF]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Card Source */}
      {currentCard && (
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mb-3 max-w-lg w-full truncate" dir="auto">
          {currentCard.videoTitle} {currentCard.isNew && <span className="text-[#14B8A6] ml-1">{isRTL ? '• جديدة' : '• NEW'}</span>}
        </p>
      )}

      {/* Flashcard */}
      <div
        className="w-full max-w-lg h-64 md:h-72 relative cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1500px' }}
      >
        {/* Front */}
        <motion.div
          className={`absolute inset-0 glass rounded-2xl border border-[var(--glass-border)] p-6 flex flex-col items-center justify-center text-center`}
          initial={false}
          animate={{
            rotateY: isFlipped ? 180 : 0,
            opacity: isFlipped ? 0 : 1,
            zIndex: isFlipped ? 0 : 10
          }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6] font-bold text-sm">Q</div>
          <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-relaxed px-2" dir="auto">
            {currentCard?.front}
          </p>
          <p className="absolute bottom-4 text-[10px] text-[var(--text-muted)] flex items-center gap-1 opacity-50">
            <FiRefreshCw size={10} /> {isRTL ? 'انقر للقلب' : 'Tap to flip'}
          </p>
        </motion.div>

        {/* Back */}
        <motion.div
          className="absolute inset-0 rounded-2xl border border-[#14B8A6]/30 p-6 flex flex-col items-center justify-center text-center overflow-y-auto"
          initial={false}
          animate={{
            rotateY: isFlipped ? 0 : -180,
            opacity: isFlipped ? 1 : 0,
            zIndex: isFlipped ? 10 : 0
          }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          style={{
            backfaceVisibility: 'hidden',
            background: isDark
              ? 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(20,184,166,0.15))'
              : 'linear-gradient(135deg, rgba(20,184,166,0.05), rgba(20,184,166,0.1))',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6] font-bold text-sm">A</div>
          <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-relaxed px-2 whitespace-pre-line" dir="auto">
            {currentCard?.back}
          </p>
        </motion.div>
      </div>

      {/* Rating Buttons — only visible when card is flipped */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-lg mt-6"
          >
            <p className="text-xs text-[var(--text-muted)] text-center mb-3 font-medium" dir="auto">
              {isRTL ? 'قيّم مدى تذكرك:' : 'Rate your recall:'}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {QUALITY_BUTTONS.map(btn => {
                const Icon = btn.icon;
                return (
                  <motion.button
                    key={btn.quality}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => { e.stopPropagation(); handleRate(btn.quality); }}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all hover:shadow-lg"
                    style={{
                      borderColor: `${btn.color}30`,
                      background: `${btn.color}08`
                    }}
                  >
                    <Icon size={18} style={{ color: btn.color }} />
                    <span className="text-xs font-black" style={{ color: btn.color }}>
                      {isRTL ? btn.label : btn.labelEn}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] leading-tight">
                      {isRTL ? btn.description : btn.descEn}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
