"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { getAssetUrl } from '../utils/apiConfig';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiTrash2, FiUpload, FiTrendingUp, FiVideo, FiCheckCircle, FiClock, FiFileText, FiSearch, FiLayers, FiRefreshCw, FiX, FiChevronRight } from 'react-icons/fi';
import useVideoStore from '../store/videoStore';
import useAuthStore from '../store/authStore';
import useLanguageStore from '../store/languageStore';
import { authAPI } from '../api/api';
import { SkeletonCard, SkeletonStat } from '../components/common/Skeleton';
import SEO from '../components/common/SEO';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import useCountUp from '../hooks/useCountUp';
import PremiumBackground from '../components/PremiumBackground';

const Dashboard = () => {
  const { myVideos, fetchMyVideos, deleteVideo, loading: videoLoading, aiProcessingStatuses, initSocket } = useVideoStore();
  const { user } = useAuthStore();
  const { t, lang } = useLanguageStore();
  useDocumentTitle(t('nav.dashboard') || 'Dashboard');
  
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [studyPlan, setStudyPlan] = useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
  const [studyPlanTab, setStudyPlanTab] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // video id to delete
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyVideos();
    fetchDashboardStats();
  }, []);

  // Re-connect to sockets for any videos that are currently processing
  useEffect(() => {
    myVideos.forEach(video => {
      if (video.processingStatus === 'processing' && !aiProcessingStatuses[video._id]) {
        initSocket(video._id);
      }
    });
  }, [myVideos, initSocket, aiProcessingStatuses]);

  const fetchDashboardStats = async () => {
    try {
      const response = await authAPI.getDashboard();
      setStatsData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    await deleteVideo(deleteConfirm);
    setIsDeleting(false);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteVideo]);

  const fetchStudyRecommendations = async () => {
    setStudyPlanLoading(true);
    try {
      const response = await authAPI.getStudyRecommendations();
      setStudyPlan(response.data.data);
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل تحميل الخطة الدراسية' : 'Failed to load study plan');
    } finally {
      setStudyPlanLoading(false);
    }
  };

  const filteredVideos = myVideos.filter(video => {
    const matchesSearch = video.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'files' && video.sourceType !== 'video') ||
      (filterType === 'video' && video.sourceType === 'video');
    return matchesSearch && matchesType;
  });

  const { stats, recentActivity } = statsData || { 
    stats: { totalVideosUploaded: 0, totalQuizzesTaken: 0, averageScore: '0%', totalScore: 0, totalPoints: 0, currentBadge: 'beginner' }, 
    recentActivity: { lastLogin: null, recentQuizzes: [] } 
  };

  // Animated stat counters (must be before early return — React hook rules)
  const animatedQuizzes = useCountUp(stats.totalQuizzesTaken, 1200, !statsLoading);
  const animatedVideos = useCountUp(myVideos.length, 1200, !videoLoading);
  const animatedPoints = useCountUp(stats.totalPoints, 1500, !statsLoading);

  if (videoLoading || statsLoading) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto py-8">
          <div className="h-32 w-full rounded-2xl mb-8 bg-[var(--input-bg)] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1,2,3,4].map(i => <SkeletonStat key={i} />)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className="grid md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <PremiumBackground />
      <div className="pt-20 px-4 pb-12 relative z-10">
        <SEO title={t('nav.dashboard') || 'Dashboard'} description="View your analyzed videos, documents, and learning progress." />
      <div className="max-w-7xl mx-auto py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-2xl mb-8 border border-[var(--glass-border)] flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              {t('dashboard.welcome')} <span className="text-[#14B8A6]">{user?.username}</span>! 👋
            </h1>
            <p className="text-[var(--text-secondary)]">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {statsData && (
              <div className="flex flex-col items-center bg-[var(--input-bg)] px-6 py-3 rounded-xl border border-[#14B8A6]/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <span className="text-sm text-[var(--text-secondary)] font-medium tracking-wide flex items-center gap-2">
                  <span className="text-[#14B8A6] text-lg">🏅</span> {stats.currentBadge !== 'مبتدئ' ? t(`badges.${stats.currentBadge}`) : t('badges.beginner')}
                </span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#5EEAD4] drop-shadow-sm mt-1">
                  {animatedPoints} {t('dashboard.points') || 'نقطة'}
                </span>
              </div>
            )}
            <Link
              href="/upload"
              className="flex-shrink-0 inline-flex items-center gap-2 btn-gold px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#14B8A6]/20 h-full"
            >
              <FiUpload />
              {t('dashboard.uploadNew')}
            </Link>
          </div>
        </motion.div>

        {/* Analytics Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(20,184,166,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#14B8A6]/5 via-[#00D4FF]/5 to-transparent bg-gradient-animate opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl transition-colors duration-500 z-10 pointer-events-none" />
            
            <div className="bg-[#14B8A6]/10 p-4 rounded-xl border border-[#14B8A6]/20 relative z-20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(20,184,166,0.15)] group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              <FiTrendingUp className="text-[#14B8A6] text-3xl drop-shadow-md" />
            </div>
            <div className="relative z-20">
              <p className="text-[var(--text-muted)] font-medium text-sm group-hover:text-[var(--text-primary)] transition-colors">{t('dashboard.averageAccuracy')}</p>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1 drop-shadow-sm">{stats.averageScore}</h3>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(0,212,255,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/5 via-[#38BDF8]/5 to-transparent bg-gradient-animate opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl transition-colors duration-500 z-10 pointer-events-none" />
            
            <div className="bg-[#00D4FF]/10 p-4 rounded-xl border border-[#00D4FF]/20 relative z-20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(0,212,255,0.15)] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              <FiCheckCircle className="text-[#00D4FF] text-3xl drop-shadow-md" />
            </div>
            <div className="relative z-20">
              <p className="text-[var(--text-muted)] font-medium text-sm group-hover:text-[var(--text-primary)] transition-colors">{t('dashboard.quizzesTaken')}</p>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1 drop-shadow-sm">{animatedQuizzes}</h3>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(52,211,153,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-400/5 to-transparent bg-gradient-animate opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl transition-colors duration-500 z-10 pointer-events-none" />

            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 relative z-20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(52,211,153,0.15)] group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <FiLayers className="text-emerald-400 text-3xl drop-shadow-md" />
            </div>
            <div className="relative z-20">
              <p className="text-[var(--text-muted)] font-medium text-sm group-hover:text-[var(--text-primary)] transition-colors">{t('dashboard.uploadedVideos')}</p>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1 drop-shadow-sm">{animatedVideos}</h3>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(56,189,248,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#38BDF8]/5 via-blue-400/5 to-transparent bg-gradient-animate opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl transition-colors duration-500 z-10 pointer-events-none" />

            <div className="bg-[#38BDF8]/10 p-4 rounded-xl border border-[#38BDF8]/20 relative z-20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(56,189,248,0.15)] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <FiClock className="text-[#38BDF8] text-3xl drop-shadow-md" />
            </div>
            <div className="relative z-20">
              <p className="text-[var(--text-muted)] font-medium text-sm group-hover:text-[var(--text-primary)] transition-colors">{t('dashboard.activeSince')}</p>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1 drop-shadow-sm">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : (lang === 'ar' ? 'حديثاً' : 'Recently')}
              </h3>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Video Library */}
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <span className="w-1.5 h-6 bg-emerald-400 rounded-full"></span>
              {t('dashboard.yourLibrary')}
            </h2>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('dashboard.searchPlaceholder') || 'Search by title...'}
                  className="w-full input-dark rounded-lg pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'video', 'files'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                      filterType === type
                        ? 'bg-[#14B8A6] text-[#050510]'
                        : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)] border border-[var(--border-color)]'
                    }`}
                  >
                    {type === 'all' ? (t('dashboard.filterAll') || 'All') : type === 'video' ? (t('dashboard.filterVideos') || 'Videos') : (t('dashboard.filterFiles') || 'Files')}
                  </button>
                ))}
              </div>
            </div>
            
            {videoLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filteredVideos.length === 0 && myVideos.length > 0 ? (
              <div className="glass p-8 rounded-xl text-center border border-[var(--glass-border)]">
                <p className="text-[var(--text-muted)]">{t('dashboard.noResults') || 'No results found'}</p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="glass p-12 rounded-xl text-center border border-[var(--glass-border)]">
                <p className="text-[var(--text-muted)] text-lg mb-4">{t('dashboard.noVideos')}</p>
                <Link href="/upload" className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-lg">
                  <FiUpload /> {t('dashboard.startUploading')}
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredVideos.map((video, index) => (
                  <motion.div
                    key={video._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-xl overflow-hidden border border-[var(--glass-border)] group"
                  >
                    <Link href={`/video/${video._id}`} className="block relative h-48 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-deep)] flex items-center justify-center overflow-hidden">
                      {video.thumbnail && video.thumbnail !== '/uploads/thumbnails/default.jpg' ? (
                        <Image src={getAssetUrl(video.thumbnail)} alt={video.title} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/10 to-[#00D4FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      {video.sourceType === 'pdf' ? (
                        <FiFileText className="text-[#00D4FF]/50 text-5xl group-hover:scale-110 group-hover:text-[#00D4FF] transition-all duration-300" />
                      ) : (
                        <FiPlay className="text-[#14B8A6]/50 text-5xl group-hover:scale-110 group-hover:text-[#14B8A6] transition-all duration-300" />
                      )}
                      {video.sourceType === 'pdf' && (
                        <span className="absolute top-3 left-3 bg-[#00D4FF]/90 text-white text-xs font-bold px-2 py-1 rounded-lg">PDF</span>
                      )}
                    </Link>
                    
                    <div className="p-5">
                      <h3 className="text-[var(--text-primary)] font-semibold mb-3 line-clamp-1" title={video.title}>
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-end text-sm text-[var(--text-muted)] mb-5">
                        {aiProcessingStatuses[video._id] ? (
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-[#14B8A6] animate-pulse">
                                {aiProcessingStatuses[video._id].message || 'Processing...'}
                              </span>
                              <span className="text-xs font-bold text-[#14B8A6]">
                                {aiProcessingStatuses[video._id].progress || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-[#14B8A6]/10 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-[#14B8A6] to-[#5EEAD4]"
                                initial={{ width: 0 }}
                                animate={{ width: `${aiProcessingStatuses[video._id].progress || 0}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            video.processingStatus === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            video.processingStatus === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            video.processingStatus === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-gray-500/10 text-[var(--text-muted)] border border-gray-500/20'
                          }`}>
                            {video.processingStatus === 'completed' ? t('dashboard.aiReady') : video.processingStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {video.processingStatus === 'completed' ? (
                          <Link href={`/video/${video._id}`} className="flex-1 btn-gold text-center py-2 rounded-lg text-sm font-semibold">
                            {video.sourceType === 'pdf' ? (t('dashboard.studyPDF') || 'Study PDF') : t('dashboard.studyVideo')}
                          </Link>
                        ) : (
                          <button disabled className="flex-1 bg-[var(--input-bg)] text-[var(--text-muted)] text-center py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed">
                            {video.processingStatus === 'failed' ? 'Failed' : 'Processing...'}
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm(video._id)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition border border-red-500/20" title="Delete Video">
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (Quiz History + Chart) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <span className="w-1.5 h-6 bg-[#00D4FF] rounded-full"></span>
              {t('dashboard.recentQuizzes')}
            </h2>

            {/* Performance Chart */}
            {recentActivity.recentQuizzes.length > 0 && (
              <div className="glass p-6 rounded-2xl border border-[var(--glass-border)]">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">📊 Quiz Performance</h3>
                <div className="space-y-3">
                  {recentActivity.recentQuizzes.slice(0, 5).map((quiz, index) => {
                    const accuracy = Math.round((quiz.score / quiz.totalQuestions) * 100);
                    const barColor = accuracy >= 80 ? 'from-green-500 to-emerald-400' : accuracy >= 50 ? 'from-yellow-500 to-amber-400' : 'from-red-500 to-rose-400';
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-muted)]">#{stats.totalQuizzesTaken - index}</span>
                          <span className={`font-bold ${accuracy >= 80 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</span>
                        </div>
                        <div className="w-full bg-[var(--input-bg)] rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${accuracy}%` }}
                            transition={{ duration: 0.8, delay: index * 0.15 }}
                            className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="glass p-6 rounded-2xl border border-[var(--glass-border)]">
              {recentActivity.recentQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.recentQuizzes.map((quiz, index) => {
                    const accuracy = Math.round((quiz.score / quiz.totalQuestions) * 100);
                    return (
                      <div key={index} className="flex flex-col gap-2 p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--border-hover)] transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[var(--text-secondary)] font-medium">{t('dashboard.attempt')} #{stats.totalQuizzesTaken - index}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(quiz.dateTaken).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#14B8A6]">{quiz.score}/{quiz.totalQuestions}</div>
                            <div className={`text-xs font-bold mt-1 ${accuracy >= 80 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {accuracy}% {t('dashboard.score')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="bg-[#00D4FF]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-[#00D4FF] text-2xl" />
                  </div>
                  <p className="text-[var(--text-secondary)] font-medium">{t('dashboard.noQuizzes')}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">{t('dashboard.studyToTest')}</p>
                  <Link href="/" className="inline-block mt-4 text-[#14B8A6] text-sm hover:underline">{t('dashboard.browseVideos')}</Link>
                </div>
              )}
            </div>

            {/* AI Study Recommendations */}
            <div className="glass p-6 rounded-2xl border border-[var(--glass-border)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                {t('dashboard.aiRecommendations')}
              </h3>

              {!studyPlan && !studyPlanLoading && (
                <div className="text-center py-6">
                  <div className="bg-[#14B8A6]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm mb-4">
                    {stats.totalQuizzesTaken > 0 
                      ? (lang === 'ar' ? 'اضغط لتحليل أدائك وتوليد خطة دراسية مخصصة' : 'Click to analyze your performance and generate a personalized study plan')
                      : t('dashboard.noQuizzesForPlan')}
                  </p>
                  {stats.totalQuizzesTaken > 0 && (
                    <button
                      onClick={fetchStudyRecommendations}
                      className="btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold"
                    >
                      {t('dashboard.generatePlan')}
                    </button>
                  )}
                </div>
              )}

              {studyPlanLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin w-10 h-10 border-3 border-[#14B8A6] border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)] text-sm animate-pulse">{t('dashboard.generating')}</p>
                </div>
              )}

              {studyPlan && studyPlan.recommendations && !studyPlanLoading && (
                <div className="space-y-4">
                  {/* Compact Summary Card */}
                  <div className="bg-gradient-to-r from-[var(--input-bg)] to-[var(--bg-deep)] p-4 rounded-xl border border-[var(--glass-border)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#14B8A6]/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full border-2 border-[#14B8A6]/30 flex items-center justify-center bg-[var(--bg-deep)] shadow flex-shrink-0">
                        <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-[#14B8A6] to-[#00D4FF]">
                          {studyPlan.performance?.overallAccuracy || 0}%
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#14B8A6] uppercase tracking-widest">
                          {studyPlan.recommendations.overallGrade}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                          {studyPlan.recommendations.studyPlan?.length || 0} {lang === 'ar' ? 'موضوع للتحسين' : 'topics to improve'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View Full Plan Button */}
                  <button
                    onClick={() => setShowStudyPlanModal(true)}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#14B8A6]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    📚 {lang === 'ar' ? 'عرض الخطة الكاملة' : 'View Full Plan'}
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={fetchStudyRecommendations}
                    className="w-full text-center text-xs text-[#14B8A6] hover:text-[#5EEAD4] transition py-2 font-medium flex items-center justify-center gap-1"
                  >
                    <FiRefreshCw size={12} className={studyPlanLoading ? 'animate-spin' : ''} />
                    {lang === 'ar' ? 'إعادة التوليد' : 'Regenerate'}
                  </button>
                </div>
              )}

              {studyPlan && !studyPlan.recommendations && !studyPlanLoading && (
                <div className="text-center py-6">
                  <p className="text-[var(--text-muted)] text-sm">{studyPlan.message || t('dashboard.noQuizzesForPlan')}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* ===== AI STUDY PLAN MODAL (TABBED) ===== */}
    {showStudyPlanModal && studyPlan?.recommendations && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowStudyPlanModal(false)}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[85vh] bg-[var(--bg-secondary)] rounded-3xl border border-[var(--glass-border)] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 pb-3 border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-deep)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#14B8A6]/30 flex items-center justify-center bg-[var(--bg-deep)] shadow-lg flex-shrink-0">
                <p className="text-base font-black text-transparent bg-clip-text bg-gradient-to-b from-[#14B8A6] to-[#00D4FF]">
                  {studyPlan.performance?.overallAccuracy || 0}%
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">🧠 {lang === 'ar' ? 'خطة الدراسة الذكية' : 'AI Study Plan'}</h2>
                <p className="text-[10px] text-[#14B8A6] font-bold uppercase tracking-widest">{studyPlan.recommendations.overallGrade}</p>
              </div>
            </div>
            <button onClick={() => setShowStudyPlanModal(false)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <FiX size={18} />
            </button>
          </div>

          {/* Tabs Navigation */}
          {(() => {
            const planItems = studyPlan.recommendations.studyPlan || [];
            const tabs = [
              { label: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: '🎯' },
              ...planItems.map((item, i) => ({ label: item.topic, icon: `${i + 1}` }))
            ];
            const activeItem = studyPlanTab > 0 ? planItems[studyPlanTab - 1] : null;
            const activeVideoPerf = activeItem && studyPlan.videoPerformance
              ? studyPlan.videoPerformance.find(v => v.title === activeItem.topic)
              : null;

            return (
              <>
                {/* Tab Bar */}
                <div className="flex-shrink-0 border-b border-[var(--glass-border)] bg-[var(--bg-deep)]/50">
                  <div className="flex overflow-x-auto scrollbar-none snap-x px-4 py-2 gap-2">
                    {tabs.map((tab, i) => (
                      <button
                        key={i}
                        onClick={() => setStudyPlanTab(i)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap snap-center transition-all flex-shrink-0 ${
                          studyPlanTab === i
                            ? 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/25'
                            : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 border border-[var(--glass-border)]'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          studyPlanTab === i ? 'bg-white/20' : 'bg-white/5'
                        }`}>{tab.icon}</span>
                        <span className="max-w-[120px] truncate">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {studyPlanTab === 0 ? (
                    /* === OVERVIEW TAB === */
                    <div className="space-y-4">
                      {/* Learning Style */}
                      {studyPlan.recommendations.learningStyle && (
                        <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-white/5">
                          <p className="text-xs font-bold text-[var(--text-primary)] mb-2 uppercase tracking-widest opacity-70">🎯 {lang === 'ar' ? 'أسلوب تعلمك' : 'Learning Style'}</p>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{studyPlan.recommendations.learningStyle}</p>
                        </div>
                      )}

                      {/* Per-Video Score Cards */}
                      <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest opacity-70 px-1">📊 {lang === 'ar' ? 'أداءك في كل محتوى' : 'Performance Per Content'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {planItems.map((item, idx) => {
                          const vp = studyPlan.videoPerformance?.find(v => v.title === item.topic);
                          const accuracy = vp?.avgScore || 0;
                          return (
                            <button
                              key={idx}
                              onClick={() => setStudyPlanTab(idx + 1)}
                              className="p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] hover:border-[#14B8A6]/30 transition-all text-left group cursor-pointer relative overflow-hidden"
                            >
                              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] transition-all" style={{ width: `${accuracy}%` }} />
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                                  accuracy >= 80 ? 'bg-emerald-500/10 text-emerald-400' : accuracy >= 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {accuracy}%
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[#14B8A6] transition-colors">{item.topic}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      (item.priority === 'عالية' || item.priority === 'High' || item.priority?.includes('عالي')) ? 'bg-red-500/10 text-red-400' :
                                      (item.priority === 'متوسطة' || item.priority === 'Medium') ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
                                    }`}>{item.priority}</span>
                                    {item.timeToMaster && <span className="text-[9px] text-[var(--text-muted)]">⏱ {item.timeToMaster}</span>}
                                  </div>
                                </div>
                                <FiChevronRight className="text-[var(--text-muted)] group-hover:text-[#14B8A6] transition-colors flex-shrink-0" size={16} />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Motivational Message */}
                      {studyPlan.recommendations.motivationalMessage && (
                        <div className="bg-gradient-to-r from-[#14B8A6]/10 via-[#00D4FF]/10 to-transparent p-5 rounded-2xl border border-[#14B8A6]/20 relative overflow-hidden mt-2">
                          <div className="absolute -left-3 -top-3 text-5xl opacity-10">❞</div>
                          <p className="text-[10px] font-bold text-[#14B8A6] mb-1.5 uppercase tracking-widest">{lang === 'ar' ? 'رسالة المدرب' : 'Coach'}</p>
                          <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed italic relative z-10 text-center">"{studyPlan.recommendations.motivationalMessage}"</p>
                        </div>
                      )}
                    </div>
                  ) : activeItem ? (
                    /* === INDIVIDUAL CONTENT TAB === */
                    <div className="space-y-4">
                      {/* Content Header */}
                      <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--glass-border)] relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#14B8A6] to-[#00D4FF]" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 pl-3">{activeItem.topic}</h3>
                        <div className="flex items-center gap-3 pl-3 flex-wrap">
                          {activeVideoPerf && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              activeVideoPerf.avgScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : activeVideoPerf.avgScore >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {lang === 'ar' ? 'دقة: ' : 'Accuracy: '}{activeVideoPerf.avgScore}%
                            </span>
                          )}
                          {activeItem.timeToMaster && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                              <FiClock size={10} /> {activeItem.timeToMaster}
                            </span>
                          )}
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            (activeItem.priority === 'عالية' || activeItem.priority === 'High' || activeItem.priority?.includes('عالي')) ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            (activeItem.priority === 'متوسطة' || activeItem.priority === 'Medium') ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {activeItem.priority}
                          </span>
                        </div>
                      </div>

                      {/* Deep Advice */}
                      {(activeItem.deepAdvice || activeItem.suggestion) && (
                        <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-white/5">
                          <p className="text-xs font-bold text-[var(--text-primary)] mb-2 uppercase tracking-widest opacity-70">💡 {lang === 'ar' ? 'التحليل العميق' : 'Deep Analysis'}</p>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{activeItem.deepAdvice || activeItem.suggestion}</p>
                        </div>
                      )}

                      {/* Actionable Steps */}
                      {activeItem.actionableSteps && Array.isArray(activeItem.actionableSteps) && activeItem.actionableSteps.length > 0 && (
                        <div className="bg-[var(--input-bg)] rounded-xl p-4 border border-white/5">
                          <p className="text-xs font-bold text-[var(--text-primary)] mb-3 uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                            <FiCheckCircle className="text-[#14B8A6]" size={14} /> {lang === 'ar' ? 'خطوات التنفيذ' : 'Execution Steps'}
                          </p>
                          <ul className="space-y-3">
                            {activeItem.actionableSteps.map((step, stepIdx) => (
                              <li key={stepIdx} className="flex gap-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                                <span className="w-6 h-6 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{stepIdx + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key Concepts from Video */}
                      {activeVideoPerf?.keyConcepts && (
                        <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-white/5">
                          <p className="text-xs font-bold text-[var(--text-primary)] mb-2 uppercase tracking-widest opacity-70">📝 {lang === 'ar' ? 'المفاهيم الأساسية' : 'Key Concepts'}</p>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{activeVideoPerf.keyConcepts}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            );
          })()}

          {/* Modal Footer */}
          <div className="p-4 border-t border-[var(--glass-border)] flex gap-3 flex-shrink-0">
            <button
              onClick={() => { fetchStudyRecommendations(); setStudyPlanTab(0); }}
              disabled={studyPlanLoading}
              className="flex-1 flex items-center justify-center gap-2 text-sm text-[#14B8A6] bg-[#14B8A6]/5 hover:bg-[#14B8A6]/15 border border-[#14B8A6]/20 transition-all py-2.5 rounded-xl font-bold disabled:opacity-50"
            >
              <FiRefreshCw size={14} className={studyPlanLoading ? 'animate-spin' : ''} />
              {lang === 'ar' ? 'إعادة التوليد' : 'Regenerate'}
            </button>
            <button
              onClick={() => setShowStudyPlanModal(false)}
              className="flex-1 flex items-center justify-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--glass-border)] transition-all py-2.5 rounded-xl font-bold"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    )}

      {/* ═══ Premium Delete Confirmation Modal ═══ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-4"
            onClick={() => !isDeleting && setDeleteConfirm(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm glass p-8 rounded-3xl border border-red-500/20 shadow-2xl shadow-red-500/10 text-center"
            >
              {/* Red glow accent */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-red-500/20 blur-2xl" />

              {/* Icon */}
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30 mb-5">
                <FiTrash2 className="text-white" size={28} />
              </div>

              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                {lang === 'ar' ? 'حذف المحتوى' : 'Delete Content'}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متأكد؟ سيتم حذف هذا المحتوى نهائياً مع جميع البيانات المرتبطة به.'
                  : 'Are you sure? This will permanently delete this content and all associated data.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-[var(--text-secondary)] bg-white/5 hover:bg-white/10 border border-[var(--glass-border)] transition-all disabled:opacity-50"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-lg shadow-red-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === 'ar' ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={16} />
                      {lang === 'ar' ? 'حذف' : 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;