"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronRight, FiChevronLeft, FiRefreshCw } from 'react-icons/fi';
import useLanguageStore from '../../store/languageStore';
import useThemeStore from '../../store/themeStore';

const Flashcards = ({ flashcards, questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useLanguageStore();
  const { isDark } = useThemeStore();

  // Use dedicated flashcards if available, otherwise fall back to quiz questions
  const hasFlashcards = flashcards && flashcards.length > 0;
  const hasQuestions = questions && questions.length > 0;

  if (!hasFlashcards && !hasQuestions) return null;

  // Build cards array from either source
  const cards = hasFlashcards
    ? flashcards.map(fc => ({ front: fc.front, back: fc.back }))
    : questions.map(q => ({
        front: q.question,
        back: q.options ? (q.options[q.correctAnswer] || q.correctAnswer) : q.correctAnswer
      }));

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 50);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 50);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="w-full my-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="w-1 h-6 bg-[#00D4FF] rounded-full inline-block" />
          {t('video.flashcards') || 'بطاقات الاستذكار الذكية'}
        </h3>
        <div className="text-sm font-bold bg-[#00D4FF]/10 border border-[#00D4FF]/20 px-4 py-1.5 rounded-full text-[#00D4FF]">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div 
        className="relative h-64 md:h-80 w-full perspective-1000 mb-6 group cursor-pointer" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
          {/* Front */}
          <motion.div
            className={`absolute w-full h-full glass rounded-3xl border border-[var(--glass-border)] p-8 flex flex-col items-center justify-center text-center transition ${isDark ? 'shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/[0.2]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-[var(--border-hover)]'}`}
            initial={false}
            animate={{ 
              rotateY: isFlipped ? 180 : 0,
              opacity: isFlipped ? 0 : 1,
              scale: isFlipped ? 1.05 : 1,
              zIndex: isFlipped ? 0 : 10
            }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-[#00D4FF]/60 font-bold text-xl">Q</div>
            <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)] leading-relaxed px-4" dir="auto">{currentCard.front}</p>
            <p className="absolute bottom-6 text-sm text-[var(--text-muted)] flex items-center gap-2 opacity-60">
              <FiRefreshCw /> {t('video.tapToFlip') || 'انقر للقلب'}
            </p>
          </motion.div>

          {/* Back */}
          <motion.div 
            className="absolute w-full h-full rounded-3xl border border-[#14B8A6]/30 p-8 flex flex-col items-center justify-center text-center overflow-y-auto" 
            initial={false}
            animate={{ 
              rotateY: isFlipped ? 0 : -180,
              opacity: isFlipped ? 1 : 0,
              scale: isFlipped ? 1.05 : 1,
              zIndex: isFlipped ? 10 : 0
            }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.15) 100%)' 
                : 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.12) 100%)', 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6] font-bold text-xl">A</div>
            <h4 className="text-[#14B8A6] font-semibold text-sm mb-4 uppercase tracking-widest">{t('video.correctAnswer') || 'الإجابة'}</h4>
            <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-relaxed px-4 whitespace-pre-line" dir="auto">{currentCard.back}</p>
          </motion.div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-6 mt-8">
        <button onClick={handlePrev} className="w-14 h-14 flex items-center justify-center rounded-full glass hover:bg-[var(--input-bg)] hover:scale-105 border border-[var(--glass-border)] transition-all text-[var(--text-primary)] shadow-lg">
          <FiChevronRight className="text-2xl" />
        </button>
        <button onClick={handleNext} className="w-14 h-14 flex items-center justify-center rounded-full glass hover:bg-[var(--input-bg)] hover:scale-105 border border-[var(--glass-border)] transition-all text-[var(--text-primary)] shadow-lg">
          <FiChevronLeft className="text-2xl" />
        </button>
      </div>
      
      <style jsx>{`
        .perspective-1000 { perspective: 2000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; transform: translateZ(1px); }
      `}</style>
    </div>
  );
};

export default Flashcards;
