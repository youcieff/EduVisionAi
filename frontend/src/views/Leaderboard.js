"use client";
import React, { useState, useEffect } from 'react';
import { getAssetUrl } from '../utils/apiConfig';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import { authAPI } from '../api/api';
import useLanguageStore from '../store/languageStore';
import useThemeStore from '../store/themeStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import PremiumBackground from '../components/PremiumBackground';

const Leaderboard = () => {
  const { lang } = useLanguageStore();
  const { isDark } = useThemeStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useDocumentTitle(lang === 'ar' ? 'لوحة المتصدرين | EduVisionAI' : 'Leaderboard | EduVisionAI');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await authAPI.getLeaderboard();
        setUsers(res.data.data.leaderboard);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getRankStyle = (index) => {
    if (index === 0) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
    if (index === 1) return 'bg-gray-400/10 border-gray-400/30 text-gray-600 dark:text-gray-300';
    if (index === 2) return 'bg-amber-700/10 border-amber-700/30 text-amber-700 dark:text-amber-500';
    return 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)]';
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" dir={mounted && lang === 'ar' ? 'rtl' : 'ltr'}>
      <PremiumBackground />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10 w-full">
        <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center p-4 bg-[#14B8A6]/10 rounded-full mb-4">
          <FiAward className="text-4xl text-[#14B8A6]" />
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] mb-3 tracking-tight">
          {lang === 'ar' ? 'لوحة الشرف والمتصدرين' : 'Global Leaderboard'}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          {lang === 'ar' 
            ? 'تنافس مع زملائك في دراسة الفيديوهات وحل الاختبارات. كل إجابة صحيحة بتقربك للقمة!'
            : 'Compete with your peers by studying videos and acing quizzes. Every correct answer gets you closer to the top!'}
        </p>
      </motion.div>

      <div className="glass rounded-3xl p-2 sm:p-6 border border-[var(--glass-border)] shadow-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                <Skeleton circle width={48} height={48} baseColor={(mounted && isDark) ? '#1f2937' : '#f3f4f6'} highlightColor={(mounted && isDark) ? '#374151' : '#e5e7eb'} />
                <div className="flex-1">
                  <Skeleton width={150} height={20} baseColor={(mounted && isDark) ? '#1f2937' : '#f3f4f6'} highlightColor={(mounted && isDark) ? '#374151' : '#e5e7eb'} />
                  <Skeleton width={80} height={15} baseColor={(mounted && isDark) ? '#1f2937' : '#f3f4f6'} highlightColor={(mounted && isDark) ? '#374151' : '#e5e7eb'} />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <FiTrendingUp className="mx-auto text-6xl text-[var(--text-muted)] mb-4" />
            <h3 className="text-xl font-bold text-[var(--text-secondary)]">
              {lang === 'ar' ? 'الكل بيبدأ من الصفر' : 'Everyone starts at zero'}
            </h3>
            <p className="text-[var(--text-muted)] mt-2">
              {lang === 'ar' ? 'كن أول من يسجل نقاط بانضمامك للاختبارات الان!' : 'Be the first to score points by taking quizzes now!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u, idx) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 sm:gap-5 p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.01] ${getRankStyle(idx)}`}
              >
                <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 bg-white/10 rounded-xl font-bold text-lg sm:text-2xl shadow-inner">
                  {getRankMedal(idx)}
                </div>
                
                <div className="relative">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-[3px] shadow-lg
                    ${u.unlockedSkills?.includes('aura_diamond') ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]' :
                      u.unlockedSkills?.includes('aura_gold') ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' :
                      u.unlockedSkills?.includes('memory_master') ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]' :
                      u.unlockedSkills?.includes('focus_master') ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' :
                      'border-white/20 shadow-md'
                    }
                  `}>
                    <Image 
                      src={getAssetUrl(u.avatar)} 
                      alt={u.username}
                      width={120} height={120}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.srcset = ''; e.currentTarget.src = `https://ui-avatars.com/api/?name=${u.username}&background=random`; }}
                    />
                  </div>
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-yellow-200 animate-pulse">
                      TOP
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-lg sm:text-xl font-bold truncate">
                      {u.unlockedSkills?.includes('crown_master') && <span className="mr-1 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">👑</span>}
                      {u.username}
                    </div>
                    {u.level > 1 && (
                      <span className="text-[9px] font-black bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] text-white px-2 py-0.5 rounded-full shadow-sm tracking-wider">
                        LV{u.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm opacity-80 font-medium">
                    {u.streakDays > 0 ? (
                      <span className="flex items-center gap-1">🔥 {u.streakDays} {lang === 'ar' ? 'يوم' : 'day streak'}</span>
                    ) : (
                      <span>{lang === 'ar' ? 'طالب مجتهد' : 'Dedicated Student'}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black tracking-tighter mix-blend-luminosity">
                    {u.points.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">
                    {lang === 'ar' ? 'نقطة' : 'PTS'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Leaderboard;
