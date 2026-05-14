"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlay, FiUpload, FiZap, FiTrendingUp, FiFileText, FiImage, FiFilm, FiLink } from 'react-icons/fi';
import useLanguageStore from '../store/languageStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAuthStore from '../store/authStore';
import SEO from '../components/common/SEO';
import PremiumBackground from '../components/PremiumBackground';

const Home = () => {
  const { t, lang } = useLanguageStore();
  useDocumentTitle(lang === 'ar' ? 'الرئيسية' : 'Home');
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen pt-20 relative overflow-x-hidden">
      <PremiumBackground />
      <SEO title={lang === 'ar' ? 'الرئيسية' : 'Home'} description="Transform videos, documents, and images into smart summaries, quizzes, and flashcards with AI." />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] mb-6"
          >
            {mounted && isAuthenticated ? (
              <>
                {t('home.welcomeBack')} <span className="text-[#14B8A6] text-glow-gold">{user?.username}</span>!
              </>
            ) : (
              <>
                {t('home.title')}<span className="text-[#14B8A6] text-glow-gold">{t('home.titleAI')}</span>
              </>
            )}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto"
          >
            {mounted && isAuthenticated ? t('home.authSubtitle') : t('home.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-6 justify-center items-center"
          >
            {mounted && isAuthenticated ? (
              <div className="w-full max-w-2xl mx-auto">
                <div className="glass p-6 rounded-2xl border border-[var(--glass-border)] shadow-2xl relative overflow-hidden group">
                  {/* Background Glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#14B8A6]/10 blur-3xl rounded-full" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#00D4FF]/10 blur-3xl rounded-full" />

                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-[#14B8A6] to-[#00D4FF] rounded-full" />
                    {t('home.letsUpload')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Level 1: Files */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 px-4 py-1.5 w-fit mx-auto mb-2 text-[var(--text-primary)] font-bold text-sm uppercase tracking-widest glass rounded-full relative overflow-hidden group/badge border-glow-animated shadow-[0_0_15px_rgba(0,212,255,0.15)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent bg-gradient-animate opacity-80" />
                        <FiFileText className="text-[#00D4FF] relative z-10 drop-shadow-md" size={16} />
                        <span className="relative z-10">{t('home.files')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/upload?section=documents&tab=docs"
                          className="flex-1 bg-[var(--glass-bg)]/30 hover:bg-[#38BDF8]/20 border border-white/10 hover:border-[#38BDF8]/40 p-4 rounded-xl transition-all duration-300 group/item flex flex-col items-center gap-2 text-center relative overflow-hidden active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#38BDF8]/15 flex items-center justify-center text-[#38BDF8] group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                            <FiFileText size={20} />
                          </div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{t('home.docs')}</span>
                          {/* Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#38BDF8]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                        </Link>
                        <Link
                          href="/upload?section=documents&tab=image"
                          className="flex-1 bg-[var(--glass-bg)]/30 hover:bg-[#00D4FF]/20 border border-white/10 hover:border-[#00D4FF]/40 p-4 rounded-xl transition-all duration-300 group/item flex flex-col items-center gap-2 text-center relative overflow-hidden active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#00D4FF]/15 flex items-center justify-center text-[#00D4FF] group-hover/item:scale-110 group-hover/item:-rotate-6 transition-all duration-300 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                            <FiImage size={20} />
                          </div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{t('home.image')}</span>
                          {/* Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                        </Link>
                      </div>
                    </div>
 
                    {/* Level 1: Videos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 px-4 py-1.5 w-fit mx-auto mb-2 text-[var(--text-primary)] font-bold text-sm uppercase tracking-widest glass rounded-full relative overflow-hidden group/badge border-glow-animated shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#14B8A6]/25 to-transparent bg-gradient-animate opacity-80" />
                        <FiPlay className="text-[#14B8A6] relative z-10 drop-shadow-md" size={16} />
                        <span className="relative z-10">{t('home.videos')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/upload?section=videos&tab=file"
                          className="flex-1 bg-[var(--glass-bg)]/30 hover:bg-[#14B8A6]/20 border border-white/10 hover:border-[#14B8A6]/40 p-4 rounded-xl transition-all duration-300 group/item flex flex-col items-center gap-2 text-center relative overflow-hidden active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#14B8A6]/15 flex items-center justify-center text-[#14B8A6] group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                            <FiFilm size={20} />
                          </div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{t('home.video')}</span>
                          {/* Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                        </Link>
                        <Link
                          href="/upload?section=videos&tab=url"
                          className="flex-1 bg-[var(--glass-bg)]/30 hover:bg-[#2DD4BF]/20 border border-white/10 hover:border-[#2DD4BF]/40 p-4 rounded-xl transition-all duration-300 group/item flex flex-col items-center gap-2 text-center relative overflow-hidden active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#2DD4BF]/15 flex items-center justify-center text-[#2DD4BF] group-hover/item:scale-110 group-hover/item:-rotate-6 transition-all duration-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                            <FiLink size={20} />
                          </div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{t('home.url')}</span>
                          {/* Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#2DD4BF]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/register"
                  className="btn-gold-spin px-8 py-4 rounded-xl text-lg flex items-center gap-2"
                >
                  <FiPlay />
                  {t('home.getStarted')}
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Features - Scroll Reveal with Stagger */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
          className="grid md:grid-cols-3 gap-8 mt-24 mb-20"
        >
          {/* Feature 1 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="animated-border-card rounded-2xl shadow-2xl">
            <div className="animated-border-content glass p-8 rounded-2xl text-center hover:bg-[var(--input-bg)] transition card-hover flex flex-col items-center h-full">
              <div className="bg-gradient-to-br from-[#14B8A6] to-[#0D9488] w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#14B8A6]/20">
                <FiZap className="text-[#050510] text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('home.smartSummaries')}</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">{t('home.smartSummariesDesc')}</p>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="animated-border-card rounded-2xl shadow-2xl">
            <div className="animated-border-content glass p-8 rounded-2xl text-center hover:bg-[var(--input-bg)] transition card-hover flex flex-col items-center h-full">
              <div className="bg-gradient-to-br from-[#00D4FF] to-[#0091B3] w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#00D4FF]/20">
                <FiTrendingUp className="text-[#050510] text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('home.interactiveQuestions')}</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">{t('home.interactiveQuestionsDesc')}</p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="animated-border-card rounded-2xl shadow-2xl">
            <div className="animated-border-content glass p-8 rounded-2xl text-center hover:bg-[var(--input-bg)] transition card-hover flex flex-col items-center h-full">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <FiPlay className="text-[#050510] text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('home.summarizedClips')}</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">{t('home.summarizedClipsDesc')}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;