"use client";
import { celebratePerfectScore, celebrateQuizPass, celebrateLevelUp } from '../utils/confetti';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiUser, FiUsers, FiRefreshCw, FiSend, FiMessageCircle, FiDownload, FiFileText,
  FiMessageSquare,
  FiClock,
  FiCalendar,
  FiTag,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCw,
  FiBookOpen,
  FiEdit3,
  FiCpu,
  FiHelpCircle,
  FiMap,
  FiX,
  FiCheck
} from 'react-icons/fi';
import useVideoStore from '../store/videoStore';
import useLanguageStore from '../store/languageStore';
import useThemeStore from '../store/themeStore';
import { SkeletonDetail } from '../components/common/Skeleton';
import { getAssetUrl } from '../utils/apiConfig';
import Image from 'next/image';
import SEO from '../components/common/SEO';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
// dynamically imported html2pdf
import Flashcards from '../components/video/Flashcards';
import AIAudioMessage from '../components/video/AIAudioMessage';
import PremiumBackground from '../components/PremiumBackground';
import MindMap from '../components/video/MindMap';
import PersonalNotes from '../components/video/PersonalNotes';
import Confetti from '../components/common/Confetti';
import useAppSound from '../hooks/useAppSound';

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/v\/)([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Animated Processing Loader Component — Countdown Timer
const ProcessingLoader = ({ status, lang, t, videoDuration, onCancel, isCancelling, processingStartedAt }) => {
  // Estimate total processing time (seconds) based on video duration
  // Optimized pipeline: concurrent AI batches + speculative decoding model
  // Download (~60s) + Whisper (~20s per 15min chunk) + AI (3 concurrent batches ~45s total)
  const estimatedTotal = React.useMemo(() => {
    const durationMin = (videoDuration || 300) / 60; // default 5 min
    const downloadTime = 60; // ~1 min download (yt-dlp audio only)
    const whisperTime = Math.ceil(durationMin / 15) * 20; // ~20s per chunk
    const aiTime = 45; // 3 concurrent batches × ~15s each (with 2s delays)
    return Math.max(90, downloadTime + whisperTime + aiTime); // minimum 1.5 min
  }, [videoDuration]);

  const [remaining, setRemaining] = React.useState(estimatedTotal);

  // Sync countdown with real server start time
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (processingStartedAt) {
        // Real sync: calculate elapsed from actual server start
        const elapsed = Math.floor((Date.now() - new Date(processingStartedAt).getTime()) / 1000);
        const syncedRemaining = Math.max(0, estimatedTotal - elapsed);
        setRemaining(syncedRemaining);
      } else {
        // Fallback: generic countdown when server hasn't started yet (pending)
        setRemaining(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [processingStartedAt, estimatedTotal]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progress = Math.min(100, ((estimatedTotal - remaining) / estimatedTotal) * 100);
  const almostDone = remaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-2xl border border-[#14B8A6]/30 relative overflow-hidden"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#14B8A6]/5 via-[#00D4FF]/5 to-[#14B8A6]/5 animate-pulse" />
      
      <div className="relative z-10">
        {/* Header with countdown */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              {/* Spinning outer ring */}
              <svg className="w-12 h-12 animate-spin" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-[var(--glass-border)]" strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-[#14B8A6]" strokeWidth="3" strokeDasharray="40 86" strokeLinecap="round" />
              </svg>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <FiCpu className="text-[#14B8A6] text-lg" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                {status === 'pending' 
                  ? (t('video.waitingProcess') || (lang === 'ar' ? 'في الانتظار...' : 'Waiting...')) 
                  : (t('video.aiAnalyzing') || (lang === 'ar' ? 'جاري التحليل بالذكاء الاصطناعي...' : 'AI is analyzing this video...'))}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {lang === 'ar' ? 'لا تغلق الصفحة' : "Don't close this page"}
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-5 py-3 text-center min-w-[110px]">
            {almostDone ? (
              <>
                <p className="text-lg font-black text-[#14B8A6] animate-pulse">
                  {lang === 'ar' ? 'قارب الانتهاء' : 'Almost done'}
                </p>
                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">⏳</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-[#14B8A6] tabular-nums tracking-wider">{timeStr}</p>
                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">
                  {lang === 'ar' ? 'الوقت المتبقي' : 'Remaining'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Progress bar — actual progress based on countdown */}
        <div className="w-full h-2 bg-[var(--input-bg)] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-2">
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="group relative px-6 py-2.5 font-bold text-white rounded-xl overflow-hidden shadow-lg shadow-red-500/20 disabled:scale-100 disabled:opacity-70 transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 group-hover:from-red-500 group-hover:to-rose-400 transition-colors" />
            <div className="relative flex items-center gap-2">
              <svg 
                className={`w-5 h-5 ${isCancelling ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isCancelling ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {isCancelling 
                ? (lang === 'ar' ? 'جاري الإيقاف...' : 'Stopping...') 
                : (lang === 'ar' ? 'إيقاف المعالجة' : 'Stop Processing')}
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const VideoDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const { currentVideo, fetchVideo, setCurrentVideo, loading, submitQuiz, retryProcessing } = useVideoStore();
  const { t, lang } = useLanguageStore();
  const { isDark } = useThemeStore();
  const { playXpPop, playLevelUp, playBadgeUnlock, playSwoosh } = useAppSound();
  useDocumentTitle(currentVideo?.title || 'Loading...');

  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollingRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(null); // 'mindMap', 'quiz', etc.
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [aiInstructions, setAiInstructions] = useState('');
  const [componentInstructions, setComponentInstructions] = useState('');
  const [pdfInstalled, setPdfInstalled] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const chatEndRef = useRef(null);

  const isProcessing = currentVideo?.processingStatus === 'pending' || currentVideo?.processingStatus === 'processing';

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      fetchVideo(id, true);
    }, 3000);
  }, [id, fetchVideo]);

  useEffect(() => {
    setSelectedAnswers([]);
    setQuizResult(null);
    setChatMessages([]);
    fetchVideo(id);
  }, [id]);

  useEffect(() => {
    if (isProcessing) {
      startPolling();
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isProcessing, startPolling]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleQuizSubmit = async () => {
    const answeredCount = selectedAnswers.filter(a => a !== undefined && a !== null).length;
    if (answeredCount !== currentVideo.questions.length) {
      const missingCount = currentVideo.questions.length - answeredCount;
      toast.error(lang === 'ar' ? `يرجى الإجابة على جميع الأسئلة. لقد نسيت ${missingCount} سؤال.` : `Please answer all questions. You missed ${missingCount} questions.`);
      return;
    }

    setSubmittingQuiz(true);
    const result = await submitQuiz(id, selectedAnswers);
    setSubmittingQuiz(false);

    if (result.success) {
      setQuizResult(result.data);
      // Trigger real confetti based on accuracy
      const accuracy = result.data.score / result.data.totalQuestions;
      if (accuracy >= 1) {
        celebratePerfectScore();
      } else if (accuracy >= 0.6) {
        celebrateQuizPass();
      }
      // Show XP toast and play sound
      if (result.data.xpGained > 0) {
        playXpPop();
        if (result.data.leveledUp) {
          setTimeout(() => { playLevelUp(); celebrateLevelUp(); }, 300);
        }
        toast.success(`⚡ +${result.data.xpGained} XP${result.data.leveledUp ? ` 🎉 Level Up! → LV${result.data.level}` : ''}`, { duration: 4000 });
      }
      // Show new badge toasts and play sound
      if (result.data.newBadges && result.data.newBadges.length > 0) {
        result.data.newBadges.forEach((badge, i) => {
          setTimeout(() => {
            playBadgeUnlock();
            toast.success(`🏅 New Badge: ${badge.name}`, { duration: 5000 });
          }, (i + 1) * 1500 + 400); // offset badge sounds to not overlap
        });
      }
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    const result = await retryProcessing(id, aiInstructions, lang);
    if (result.success) {
      // Refresh after a delay to show pending status
      setTimeout(() => fetchVideo(id, true), 1000);
    }
    setRetrying(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const api = (await import('../api/api')).default;
      const response = await api.post(`/videos/${id}/chat`, { message: userMessage });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.data.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
    }
    setChatLoading(false);
  };

  const handleExportPDF = async () => {
    if (!currentVideo) return;
    setIsExporting(true);
    setPdfInstalled(false);
    
    // Fetch user's personal notes to include in the PDF
    let personalNotes = '';
    try {
      const { videoAPI } = await import('../api/api');
      const res = await videoAPI.getPersonalNotes(id);
      personalNotes = res.data?.data?.note || '';
    } catch (e) {
      console.warn('Failed to fetch hints for PDF', e);
    }

    const isAr = lang === 'ar';
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = isAr ? "'Cairo', sans-serif" : "'Outfit', 'Inter', sans-serif";
    container.style.color = '#1A2332';
    container.style.backgroundColor = '#fff';
    container.dir = isAr ? 'rtl' : 'ltr';
    
    const logoImg = `<img src="${window.location.origin}/eduvision-logo.png" width="48" height="48" style="vertical-align: middle; margin-${isAr ? 'left' : 'right'}: 15px; border-radius: 10px;" crossorigin="anonymous" />`;

    // Global style to enforce page-break rules on all .pdf-section blocks
    let htmlContent = `
      <style>
        .pdf-section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }
        .pdf-page-break {
          page-break-before: always !important;
          break-before: always !important;
          height: 0;
          margin: 0;
          padding: 0;
        }
      </style>

      <div class="pdf-section" style="display: flex; align-items: center; justify-content: center; margin-bottom: 30px; border-bottom: 2px solid #14B8A6; padding-bottom: 20px;">
        ${logoImg}
        <h1 style="color: #0F1825; font-size: 32px; font-weight: 900; margin: 0; font-family: 'Outfit', sans-serif;">EduVision<span style="color: #14B8A6;">AI</span></h1>
      </div>

      <div class="pdf-section" style="margin-bottom: 30px; text-align: center;">
        <h2 style="color: #1A2332; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.4;">${currentVideo.title}</h2>
        <p style="color: #5A6B80; font-size: 14px; margin-top: 8px;">${isAr ? 'تم الإنشاء بواسطة منصة' : 'Generated by'} EduVisionAI &bull; ${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      
      <div class="pdf-section" style="margin-bottom: 20px; background: #F8FAFC; padding: 20px; border-radius: 12px; border-right: 5px solid #14B8A6; border-left: 5px solid #14B8A6;">
        <h3 style="color: #14B8A6; font-size: 18px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
           <span style="background: #14B8A6; width: 6px; height: 20px; border-radius: 3px; display: inline-block; vertical-align: middle;"></span>
           ${t('video.summary')}
        </h3>
        <p style="line-height: 1.6; font-size: 15px; color: #334155; white-space: pre-line; text-align: justify; word-break: break-word; margin: 0;">${currentVideo.summary || 'N/A'}</p>
      </div>
    `;

    if (currentVideo.description) {
      htmlContent += `
        <div class="pdf-section" style="margin-bottom: 20px; background: #EEF2FF; padding: 20px; border-radius: 12px; border-right: 5px solid #6366F1; border-left: 5px solid #6366F1;">
          <h3 style="color: #6366F1; font-size: 18px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
             <span style="background: #6366F1; width: 6px; height: 20px; border-radius: 3px; display: inline-block; vertical-align: middle;"></span>
             ${t('video.description')}
          </h3>
          <p style="line-height: 1.6; font-size: 15px; color: #334155; white-space: pre-line; text-align: justify; word-break: break-word; margin: 0;">${currentVideo.description}</p>
        </div>
      `;
    }

    if (currentVideo.keyPoints && currentVideo.keyPoints.length > 0) {
      htmlContent += `
        <div class="pdf-section" style="margin-bottom: 20px; background: #F0F9FF; padding: 20px; border-radius: 12px; border-right: 5px solid #00D4FF; border-left: 5px solid #00D4FF;">
          <h3 style="color: #00D4FF; font-size: 18px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
             <span style="background: #00D4FF; width: 6px; height: 20px; border-radius: 3px; display: inline-block; vertical-align: middle;"></span>
             ${t('video.keyPoints')}
          </h3>
          <ul style="line-height: 1.7; font-size: 15px; color: #334155; padding-inline-start: 20px; margin: 0;">
             ${currentVideo.keyPoints.map(p => `<li style="margin-bottom: 10px; word-break: break-word;">${p}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Notes block
    if (personalNotes.trim()) {
      htmlContent += `
        <div class="pdf-section" style="margin-bottom: 20px; background: #FAF5FF; padding: 20px; border-radius: 12px; border-right: 5px solid #A855F7; border-left: 5px solid #A855F7;">
          <h3 style="color: #A855F7; font-size: 18px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
             <span style="background: #A855F7; width: 6px; height: 20px; border-radius: 3px; display: inline-block; vertical-align: middle;"></span>
             ${isAr ? 'ملاحظاتي' : 'Personal Notes'}
          </h3>
          <p style="line-height: 1.6; font-size: 15px; color: #334155; white-space: pre-line; text-align: justify; word-break: break-word; margin: 0;">${personalNotes}</p>
        </div>
      `;
    }

    if (currentVideo.flashcards && currentVideo.flashcards.length > 0) {
      htmlContent += `
        <div class="pdf-page-break"></div>
        <div class="pdf-section" style="margin-bottom: 30px; background: #FFFBEB; padding: 30px; border-radius: 16px; border-right: 5px solid #F59E0B; border-left: 5px solid #F59E0B;">
          <h3 style="color: #F59E0B; font-size: 20px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
             <span style="background: #F59E0B; width: 8px; height: 24px; border-radius: 4px; display: inline-block; vertical-align: middle;"></span>
             ${isAr ? 'البطاقات التعليمية' : 'Flashcards'}
          </h3>
          <div style="color: #334155; display: flex; flex-wrap: wrap; gap: 15px;">
            ${currentVideo.flashcards.map((f, i) => `
              <div class="pdf-section" style="width: 100%; border: 1px solid #FDE68A; background: #FFF; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-weight: 700; color: #B45309; margin-bottom: 8px; font-size: 15px; border-bottom: 1px solid #FEF3C7; padding-bottom: 4px;">Q: ${f.front}</div>
                <div style="color: #475569; font-size: 14px;">A: ${f.back}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (currentVideo.questions && currentVideo.questions.length > 0) {
      htmlContent += `
        <div class="pdf-page-break"></div>
        <div style="margin-bottom: 30px; background: #F0FDF4; padding: 30px; border-radius: 16px; border-right: 5px solid #10B981; border-left: 5px solid #10B981;">
          <h3 class="pdf-section" style="color: #10B981; font-size: 20px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
             <span style="background: #10B981; width: 8px; height: 24px; border-radius: 4px; display: inline-block; vertical-align: middle;"></span>
             ${t('video.quiz')}
          </h3>
          <div style="color: #334155;">
            ${currentVideo.questions.map((q, qIndex) => `
              <div class="pdf-section" style="margin-bottom: 25px; border-bottom: 1px dashed #E2E8F0; padding-bottom: 20px;">
                <p style="font-weight: 700; margin-bottom: 12px; font-size: 17px; color: #0F1825;">${qIndex + 1}. ${q.question}</p>
                <div style="margin-bottom: 12px; padding-inline-start: 20px; font-size: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  ${(q.options || []).map((opt, oIndex) => `
                    <div style="margin-bottom: 6px; color: #475569; word-break: break-all; overflow-wrap: anywhere;">
                      <span style="font-weight: 700; color: #94A3B8;">${String.fromCharCode(65 + oIndex)}.</span> ${opt}
                    </div>
                  `).join('')}
                </div>
                <div style="margin-top: 10px; padding: 12px; background: #DCFCE7; border-radius: 8px; color: #166534; font-size: 14px; display: inline-block;">
                  <strong style="margin-inline-end: 5px;">${t('video.correctAnswer') || 'الإجابة الصحيحة'}</strong> ${q.options && q.options[q.correctAnswer] ? `<span style="font-weight: 700; color: #166534;">${String.fromCharCode(65 + Number(q.correctAnswer))}.</span> ${q.options[q.correctAnswer]}` : q.correctAnswer}
                </div>
                ${q.explanation ? `
                <div style="margin-top: 8px; padding: 12px; background: #EFF6FF; border-radius: 8px; color: #1E40AF; font-size: 13px; border-right: 3px solid #3B82F6; border-left: 3px solid #3B82F6;">
                  <strong style="margin-inline-end: 5px;">💡 ${lang === 'ar' ? 'الشرح:' : 'Explanation:'}</strong> ${q.explanation}
                </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    htmlContent += `
      <div class="pdf-section" style="margin-top: 60px; text-align: center; color: #94A3B8; font-size: 13px; border-top: 1px solid #E2E8F0; padding-top: 25px;">
        <p style="margin-bottom: 5px; font-weight: 600;">EduVisionAI &copy; ${new Date().getFullYear()}</p>
        <p>${isAr ? 'رحلتك التعليمية أصبحت أسهل مع الذكاء الاصطناعي' : 'Your learning journey made easier with AI'}</p>
      </div>
    `;

    container.innerHTML = htmlContent;

    const opt = {
      margin:       [10, 5, 10, 5],
      filename:     `${currentVideo.title || 'video'}_Summary.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css'], before: '.pdf-page-break', avoid: '.pdf-section' }
    };

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      await html2pdf().set(opt).from(container).save();
      setPdfInstalled(true);
      toast.success(isAr ? 'تم تصدير PDF بنجاح' : 'PDF exported successfully');
    } catch (err) {
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Export error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerateComponent = async (component) => {
    try {
      setIsRegenerating(component);
      const api = (await import('../api/api')).default;
      const response = await api.post(`/videos/${id}/regenerate-component`, { 
        component,
        instructions: componentInstructions
      });
      
      // Update UI immediately utilizing the returned exact field without reloading the page
      if (response.data?.status === 'success' && response.data?.data) {
        const updateField = component === 'mindMap' ? 'keyPoints' : component === 'quiz' ? 'questions' : component;
        setCurrentVideo({ ...currentVideo, [updateField]: response.data.data[updateField] });
        toast.success(lang === 'ar' ? 'تم تحديث القسم بنجاح!' : 'Section updated successfully!');
      }

      // Re-fetch in background to ensure consistency silently
      fetchVideo(id, true);
      
      // Extra reset for quiz UI state
      if (component === 'quiz' || component === 'questions') {
        setQuizResult(null);
        setSelectedAnswers([]);
      }
      
    } catch (err) {
      console.error('Regenerate error:', err);
      toast.error(lang === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update data');
    } finally {
      setIsRegenerating(null);
    }
  };

   if (loading || (currentVideo && currentVideo._id !== id)) {
    return <SkeletonDetail />;
  }

  if (!currentVideo && !loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-[var(--text-secondary)] text-xl">{t('video.notFound')}</p>
      </div>
    );
  }

  if (!currentVideo) {
    return <SkeletonDetail />;
  }

  const youtubeId = getYouTubeVideoId(currentVideo.originalUrl);

  return (
    <div className="min-h-screen pt-20 px-2 md:px-6 pb-12 relative overflow-x-hidden">
      <PremiumBackground />
      <Confetti active={showConfetti} />
      {currentVideo && (
        <SEO 
          title={currentVideo.title} 
          description={currentVideo.summary?.substring(0, 160) || currentVideo.description?.substring(0, 160)} 
        />
      )}
      <div className="max-w-[1400px] mx-auto py-8 relative z-10 w-full">
        {/* Unified Top Header - Integrated Context Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-ultra p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)] mb-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#14B8A6]/10 to-transparent rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Title & Meta Area (L: 2/3) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] text-[10px] font-black tracking-widest uppercase border border-[#14B8A6]/20">
                  {currentVideo.category || t('video.unspecified')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <FiClock size={12} />
                  {new Date(currentVideo.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
                {currentVideo.title}
              </h1>
              <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] flex justify-center items-center text-white font-bold text-xl shadow-md border border-white/20">
                  {currentVideo.uploadedBy?.avatar && currentVideo.uploadedBy.avatar !== 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff' ? (
                    <Image 
                      src={getAssetUrl(currentVideo.uploadedBy.avatar)} 
                      alt="Author" 
                      width={100} height={100}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentVideo.uploadedBy?.username?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">{currentVideo.uploadedBy?.username || 'admin'}</p>
                </div>
              </div>
            </div>

            {/* Integrated Context Zone (R: 1/3) */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/5 p-3 flex items-center gap-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                {/* Mini Media Preview */}
                <button 
                  onClick={() => setShowMediaModal(true)}
                  className="w-32 h-20 rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-deep)] relative flex-shrink-0 group/mini transition-transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  {currentVideo.sourceType === 'pdf' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00D4FF]/20 to-transparent">
                      <FiFileText className="text-[#00D4FF] text-2xl" />
                    </div>
                  ) : youtubeId ? (
                    <Image 
                      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
                      alt="Thumbnail"
                      fill
                      className="object-cover opacity-80 group-hover/mini:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPlay className="text-[#14B8A6]/40 text-2xl" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity">
                    <FiPlay className="text-white text-xl animate-pulse" />
                  </div>
                </button>

                {/* Quick Info & CTA */}
                <div className="flex-grow space-y-3">
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">{currentVideo.sourceType === 'pdf' ? 'PAGES' : 'DURATION'}</span>
                      <span className="text-[var(--text-primary)]">
                        {currentVideo.sourceType === 'pdf' ? currentVideo.duration : currentVideo.duration >= 60 ? `${Math.floor(currentVideo.duration / 60)}m` : `${Math.round(currentVideo.duration)}s`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">TYPE</span>
                      <span className="text-[#14B8A6]">{currentVideo.sourceType?.toUpperCase()}</span>
                    </div>
                  </div>
                  
                  {currentVideo.processingStatus === 'completed' && currentVideo.summary && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 py-2 bg-gradient-to-r from-[#00D4FF] to-[#14B8A6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#14B8A6]/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <FiDownload size={13} />
                        {isExporting ? (lang === 'ar' ? 'جاري التثبيت...' : 'Installing...') : (pdfInstalled ? (lang === 'ar' ? 'تم تثبيت PDF' : 'Installed') : (t('video.exportPDF') || 'Install PDF'))}
                      </button>
                      
                      <button
                        onClick={() => {
                          playSwoosh();
                          router.push(`/room/${id}`);
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-red-500 to-rose-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <FiUsers size={13} className="animate-pulse" />
                        {lang === 'ar' ? 'غرفة حية' : 'Live Room'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>


        {/* Video Info & Content Tabs */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            
            {/* Processing Banner — Full Animated Loader */}
            {isProcessing && (
              <ProcessingLoader 
                status={currentVideo.processingStatus} 
                lang={lang} 
                t={t} 
                videoDuration={currentVideo.duration} 
                processingStartedAt={currentVideo.processingStartedAt}
                isCancelling={isCancelling}
                onCancel={async () => {
                  try {
                    setIsCancelling(true);
                    const api = (await import('../api/api')).default;
                    await api.post(`/videos/${id}/cancel`);
                    toast.success(lang === 'ar' ? 'تم إيقاف المعالجة وإلغاء الفيديو' : 'Processing stopped and video cancelled');
                    // Refresh data
                    fetchVideo(id, true);
                  } catch (err) {
                    toast.error(lang === 'ar' ? 'فشل في إيقاف المعالجة' : 'Failed to stop processing');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
              />
            )}

            {/* TABS NAVIGATION — Scrollable on mobile */}
            {!isProcessing && (
              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl p-2 rounded-[1.5rem] border border-white/20 dark:border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_10px_30px_-5px_rgba(0,0,0,0.2)] flex flex-wrap gap-2 md:gap-3 mb-8">
                <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 md:-mx-0 md:px-0 md:flex-wrap md:justify-start lg:justify-start">
                  {currentVideo.description && (
                    <button 
                      onClick={() => setActiveTab('description')}
                      className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'description' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02] border border-indigo-500' : 'text-[var(--text-secondary)] hover:text-indigo-500 hover:bg-indigo-500/5'}`}
                    >
                      <FiLayers />
                      {t('video.description')}
                    </button>
                  )}
                  {currentVideo.keyPoints && currentVideo.keyPoints.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('mindmap')}
                      className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'mindmap' ? 'bg-[#00D4FF] text-gray-900 shadow-lg shadow-[#00D4FF]/20 scale-[1.02] border border-[#00D4FF]' : 'text-[var(--text-secondary)] hover:text-[#00D4FF] hover:bg-[#00D4FF]/5'}`}
                    >
                      <FiMap />
                      {t('video.keyPoints')}
                    </button>
                  )}
                  {(currentVideo.questions?.length > 0 || currentVideo.flashcards?.length > 0) && (
                    <>
                      <button 
                        onClick={() => setActiveTab('flashcards')}
                        className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'flashcards' ? 'bg-[#10B981] text-gray-900 shadow-lg shadow-[#10B981]/20 scale-[1.02] border border-[#10B981]' : 'text-[var(--text-secondary)] hover:text-[#10B981] hover:bg-[#10B981]/5'}`}
                      >
                        <FiBookOpen />
                        {t('video.studyMode') || 'Study Mode'}
                      </button>
                      {currentVideo.questions && currentVideo.questions.length > 0 && (
                        <button 
                          onClick={() => setActiveTab('quiz')}
                          className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'quiz' ? 'bg-[#F43F5E] text-white shadow-lg shadow-[#F43F5E]/20 scale-[1.02] border border-[#F43F5E]' : 'text-[var(--text-secondary)] hover:text-[#F43F5E] hover:bg-[#F43F5E]/5'}`}
                        >
                          <FiHelpCircle />
                          {t('video.testMode') || 'Quiz'}
                        </button>
                      )}
                    </>
                  )}
                  
                  <button 
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'summary' ? 'bg-[#14B8A6] text-gray-900 shadow-lg shadow-[#14B8A6]/20 scale-[1.02] border border-[#14B8A6]' : 'text-[var(--text-secondary)] hover:text-[#14B8A6] hover:bg-[#14B8A6]/5'}`}
                  >
                    <FiFileText />
                    {t('video.summary')}
                  </button>
                  {currentVideo.processingStatus === 'completed' && currentVideo.transcript && (
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'chat' ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20 scale-[1.02] border border-[#8B5CF6]' : 'text-[var(--text-secondary)] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5'}`}
                    >
                      <FiMessageCircle />
                      Chat
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'notes' ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20 scale-[1.02] border border-[#8B5CF6]' : 'text-[var(--text-secondary)] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5'}`}
                  >
                    <FiEdit3 />
                    {lang === 'ar' ? 'ملاحظاتي' : 'Notes'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT AREAS */}
            {!isProcessing && (
              <div className="min-h-[400px]">
                
                {/* AI Custom Instructions Input */}
                <div className="mb-6 glass-ultra rounded-2xl border border-white/20 dark:border-white/5 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 mb-3">
                    <FiEdit3 className="text-[#14B8A6]" />
                    <label className="text-sm font-bold text-[var(--text-primary)]">
                      {lang === 'ar' ? 'توجيهات مخصصة (يتم تطبيقها عند تحديث أي قسم)' : 'Custom Instructions (Applied when regenerating any section)'}
                    </label>
                  </div>
                  <textarea
                    value={componentInstructions}
                    onChange={(e) => setComponentInstructions(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: ركز على القوانين الفيزيائية فقط... أو اكتب بأسلوب مبسط جداً...' : 'e.g. Focus only on physics laws... or write in a very simple style...'}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--glass-border)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#14B8A6]/50 focus:ring-2 focus:ring-[#14B8A6]/20 transition-all resize-none h-16"
                  />
                </div>

                {/* Summary View */}
                {activeTab === 'summary' && (
                  currentVideo.summary && currentVideo.summary.includes('استنفدت باقة') ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-xl border border-red-500/30">
                      <h2 className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-2 border-b border-red-500/20 pb-4">
                        <span className="w-1 h-6 bg-red-500 rounded-full inline-block" />
                        API Rate Limit Exceeded
                      </h2>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
                        <p className="text-red-400 font-bold mb-4 text-xl">
                          نفدت باقة الذكاء الاصطناعي اليومية (Groq Free Tier) 🚫
                        </p>
                        <p className="text-[var(--text-secondary)] leading-relaxed mb-4 text-lg">
                          لقد استهلكت الـ 100,000 توكن المتاحة لك اليوم لمعالجة الفيديوهات والنصوص الطويلة.
                        </p>
                        <ul className="text-[var(--text-muted)] ml-6 list-disc space-y-2">
                          <li>انتظر بضع ساعات حتى تتجدد باقتك اليومية.</li>
                          <li>أو قم بإضافة API Key جديد من حساب Groq آخر في ملف <code>.env</code>.</li>
                        </ul>
                      </div>
                    </motion.div>
                  ) : currentVideo.summary && currentVideo.summary.length > 50 && !currentVideo.summary.includes('غير متاح') ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-ultra p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                      <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span className="w-1 h-6 bg-[#14B8A6] rounded-full inline-block" />
                          {t('video.summary')}
                        </h2>
                        
                        <button
                          onClick={() => handleRegenerateComponent('summary')}
                          disabled={isRegenerating === 'summary'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            isRegenerating === 'summary' 
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30'
                          }`}
                        >
                          <FiRefreshCw className={isRegenerating === 'summary' ? 'animate-spin' : ''} />
                          {isRegenerating === 'summary' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'تحديث الملخص' : 'Refresh Summary')}
                        </button>
                      </div>
                      
                      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-lg">
                        {currentVideo.summary}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-ultra p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                      <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span className="w-1 h-6 bg-[#14B8A6] rounded-full inline-block" />
                          {t('video.summary')}
                        </h2>
                        
                        <button
                          onClick={() => handleRegenerateComponent('summary')}
                          disabled={isRegenerating === 'summary'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            isRegenerating === 'summary' 
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30'
                          }`}
                        >
                          <FiRefreshCw className={isRegenerating === 'summary' ? 'animate-spin' : ''} />
                          {isRegenerating === 'summary' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'إعادة توليد الملخص فقط' : 'Retry Summary Only')}
                        </button>
                      </div>

                      <div className="bg-[#14B8A6]/5 border border-[#14B8A6]/15 rounded-lg p-6">
                        <p className="text-[var(--text-secondary)] leading-relaxed mb-4 text-lg">
                          {t('video.summaryNA')}
                        </p>
                        <p className="text-[var(--text-muted)] mb-4">
                          {t('video.summaryTip')} <strong className="text-[var(--text-secondary)]">{t('video.tipTitle')}</strong> {t('video.tipDesc')}
                        </p>
                        
                        {!isRegenerating && (
                          <button
                            onClick={() => handleRegenerateComponent('summary')}
                            className="px-8 py-3 bg-[#14B8A6] text-gray-900 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#14B8A6]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <FiRefreshCw />
                            {lang === 'ar' ? 'بدء الـ Retry السريع' : 'Start Fast Retry'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                )}

                {/* Mind Map / Key Points View */}
                {activeTab === 'mindmap' && (
                  currentVideo.keyPoints && currentVideo.keyPoints.length > 0 && !currentVideo.keyPoints[0].includes('متاح للمشاهدة') ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="flex justify-between items-center mb-6 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-1 h-6 bg-[#00D4FF] rounded-full inline-block" />
                          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('video.mindMapTitle') || 'Interactive Mind Map'}</h2>
                        </div>
                        
                        <button
                          onClick={() => handleRegenerateComponent('mindMap')}
                          disabled={isRegenerating === 'mindMap'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            isRegenerating === 'mindMap' 
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30'
                          }`}
                        >
                          <FiRefreshCw className={isRegenerating === 'mindMap' ? 'animate-spin' : ''} />
                          {isRegenerating === 'mindMap' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'تحديث الخريطة' : 'Refresh Mind Map')}
                        </button>
                      </div>
                      <MindMap title={currentVideo.title} keyPoints={currentVideo.keyPoints} />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-ultra p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                      <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span className="w-1 h-6 bg-[#00D4FF] rounded-full inline-block" />
                          {t('video.keyPoints')}
                        </h2>
                        
                        <button
                          onClick={() => handleRegenerateComponent('mindMap')}
                          disabled={isRegenerating === 'mindMap'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            isRegenerating === 'mindMap' 
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30'
                          }`}
                        >
                          <FiRefreshCw className={isRegenerating === 'mindMap' ? 'animate-spin' : ''} />
                          {isRegenerating === 'mindMap' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'إعادة استخراج الخريطة فقط' : 'Retry Mind Map Only')}
                        </button>
                      </div>

                      <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/15 rounded-lg p-6 flex flex-col items-center text-center">
                        <p className="text-[var(--text-secondary)] text-lg mb-4">
                          {currentVideo.keyPoints && currentVideo.keyPoints[0].includes('خطأ') 
                             ? (lang === 'ar' ? 'حدثت مشكلة أثناء استخراج الخريطة الذهنية.' : 'A problem occurred while extracting the mind map.')
                             : t('video.keyPointsNA')}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm mb-6 max-w-md">
                          {lang === 'ar' 
                            ? 'يمكنك المحاولة مرة أخرى الآن. سيقوم النظام باستخدام تقنيات أكثر دقة لاستخراج النقاط.' 
                            : 'You can try again now. The system will use more precise techniques to extract points.'}
                        </p>
                        
                        {!isRegenerating && (
                          <button
                            onClick={() => handleRegenerateComponent('mindMap')}
                            className="px-8 py-3 bg-[#00D4FF] text-gray-900 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#00D4FF]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <FiRefreshCw />
                            {lang === 'ar' ? 'بدء الـ Retry السريع' : 'Start Fast Retry'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                )}

                {/* Description View */}
                {activeTab === 'description' && currentVideo.description && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-ultra p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full inline-block" />
                        {t('video.description')}
                      </h2>
                      
                      <button
                        onClick={() => handleRegenerateComponent('description')}
                        disabled={isRegenerating === 'description'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          isRegenerating === 'description' 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'
                        }`}
                      >
                        <FiRefreshCw className={isRegenerating === 'description' ? 'animate-spin' : ''} />
                        {isRegenerating === 'description' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'تحديث الشرح' : 'Refresh Description')}
                      </button>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-lg">
                      {currentVideo.description}
                    </p>
                  </motion.div>
                )}

                {/* Personal Notes View */}
                {activeTab === 'notes' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <PersonalNotes videoId={id} />
                  </motion.div>
                )}

                {/* Flashcards (Study Mode) View */}
                {activeTab === 'flashcards' && (currentVideo.flashcards?.length > 0 || currentVideo.questions?.length > 0) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-ultra p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#10B981] rounded-full inline-block" />
                        {t('video.studyMode') || 'Study Mode'}
                      </h2>
                      
                      <button
                        onClick={() => handleRegenerateComponent('flashcards')}
                        disabled={isRegenerating === 'flashcards'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          isRegenerating === 'flashcards' 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                            : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border border-[#10B981]/30'
                        }`}
                      >
                        <FiRefreshCw className={isRegenerating === 'flashcards' ? 'animate-spin' : ''} />
                        {isRegenerating === 'flashcards' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'تحديث الكروت' : 'Refresh Cards')}
                      </button>
                    </div>
                    <Flashcards flashcards={currentVideo.flashcards} questions={currentVideo.questions} />
                  </motion.div>
                )}

                {/* Quiz (Test Mode) View */}
                {activeTab === 'quiz' && currentVideo.questions && currentVideo.questions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-ultra p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#F43F5E] rounded-full inline-block" />
                        {t('video.quiz')}
                      </h2>
                      
                      <button
                        onClick={() => handleRegenerateComponent('quiz')}
                        disabled={isRegenerating === 'quiz'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          isRegenerating === 'quiz' 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                            : 'bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/20 border border-[#F43F5E]/30'
                        }`}
                      >
                        <FiRefreshCw className={isRegenerating === 'quiz' ? 'animate-spin' : ''} />
                        {isRegenerating === 'quiz' ? (lang === 'ar' ? 'جاري التوليد...' : 'Regenerating...') : (lang === 'ar' ? 'توليد أسئلة جديدة فقط' : 'Retry Quiz Only')}
                      </button>
                    </div>
                    
                    {quizResult ? (
                      <div className={`bg-[var(--input-bg)] p-8 rounded-xl border border-[var(--border-color)] text-center ${quizResult.score / quizResult.totalQuestions >= 0.6 ? 'quiz-celebrate' : ''}`}>
                        <h4 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{t('video.quizCompleted')} {quizResult.score / quizResult.totalQuestions >= 0.8 ? '🎉🏆' : quizResult.score / quizResult.totalQuestions >= 0.6 ? '👏✨' : '💪'}</h4>
                        <div className="text-6xl font-extrabold mb-4 text-[#14B8A6]">
                          {quizResult.score} / {quizResult.totalQuestions}
                        </div>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium text-lg">
                          {Math.round((quizResult.score / quizResult.totalQuestions) * 100)}% {t('video.accuracy')}
                        </p>
                        <div className="space-y-4 text-left max-w-2xl mx-auto">
                          {quizResult.results.map((res, i) => (
                            <div key={i} className={`p-5 rounded-lg border flex flex-col gap-2 ${res.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                              <p className="text-base text-[var(--text-primary)] font-semibold">Q{i+1}: {res.question}</p>
                              <p className="text-sm border-t border-[var(--border-color)] pt-2">
                                <span className="text-[var(--text-muted)]">{t('video.yourAnswer')} </span>
                                <span className={res.isCorrect ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{res.userAnswer}</span>
                              </p>
                              {!res.isCorrect && (
                                <p className="text-sm">
                                  <span className="text-[var(--text-muted)]">{t('video.correctAnswer')} </span>
                                  <span className="text-green-400 font-medium">{res.correctAnswer}</span>
                                </p>
                              )}
                              {res.explanation && (
                                <div className={`mt-2 p-3 rounded-lg text-sm ${res.isCorrect ? 'bg-green-500/5 border border-green-500/10' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                                  <span className="font-semibold text-[#14B8A6]">💡 {lang === 'ar' ? 'الشرح: ' : 'Explanation: '}</span>
                                  <span className="text-[var(--text-secondary)]">{res.explanation}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex justify-between items-center mb-4 px-2">
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">
                            {lang === 'ar' ? `السؤال ${currentQuizIndex + 1} من ${currentVideo.questions.length}` : `Question ${currentQuizIndex + 1} of ${currentVideo.questions.length}`}
                          </h3>
                          <div className="text-sm font-bold bg-[#F43F5E]/10 border border-[#F43F5E]/20 px-4 py-1.5 rounded-full text-[#F43F5E]">
                            {currentQuizIndex + 1} / {currentVideo.questions.length}
                          </div>
                        </div>

                        {/* Questions Pagination Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-thin scrollbar-thumb-[var(--glass-border)] scrollbar-track-transparent snap-x select-none w-full max-w-[calc(100vw-3rem)]">
                          {currentVideo.questions.map((_, i) => {
                            const isAnswered = selectedAnswers[i] !== undefined && selectedAnswers[i] !== null;
                            const isActive = currentQuizIndex === i;
                            
                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentQuizIndex(i)}
                                className={`flex-shrink-0 w-10 h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center snap-center relative ${
                                  isActive
                                    ? 'bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-2 ring-[#F43F5E]/30 scale-105 opacity-100 z-10'
                                    : isAnswered
                                      ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white opacity-80 hover:opacity-100 border border-[#10B981]/50'
                                      : 'bg-black/10 dark:bg-white/5 text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-black/20 dark:hover:bg-white/10 hover:border-[var(--text-muted)]'
                                }`}
                                title={lang === 'ar' ? `الذهاب إلى السؤال ${i + 1}` : `Go to question ${i + 1}`}
                              >
                                {i + 1}
                                {isAnswered && !isActive && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="bg-[var(--bg-deep)] p-6 md:p-8 rounded-2xl border border-[var(--glass-border)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--input-bg)]">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-[#F43F5E] to-[#FB7185]" 
                              initial={{ width: 0 }}
                              animate={{ width: `${((currentQuizIndex + 1) / currentVideo.questions.length) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          
                          <p className="text-[var(--text-primary)] font-semibold mb-6 leading-relaxed text-lg md:text-xl relative z-10 mt-2">
                            <span className="text-[#F43F5E] font-black mr-2 opacity-50">Q.</span>
                            {currentVideo.questions[currentQuizIndex].question}
                          </p>
                          <div className="space-y-3 relative z-10">
                            {currentVideo.questions[currentQuizIndex].options?.map((option, i) => (
                              <label
                                key={i}
                                className={`flex items-center gap-4 w-full text-left text-base p-4 rounded-xl cursor-pointer transition-all border hover:border-[#F43F5E]/40 ${
                                  selectedAnswers[currentQuizIndex] === i 
                                    ? 'bg-[#F43F5E]/10 border-[#F43F5E] text-[var(--text-primary)] shadow-md' 
                                    : 'text-[var(--text-secondary)] border-[var(--glass-border)] hover:bg-[var(--input-bg)]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuizIndex}`}
                                  value={i}
                                  className="hidden"
                                  checked={selectedAnswers[currentQuizIndex] === i}
                                  onChange={() => {
                                    handleAnswerChange(currentQuizIndex, i);
                                    // Optional: advance automatically after a slight delay
                                    if (currentQuizIndex < currentVideo.questions.length - 1) {
                                      setTimeout(() => setCurrentQuizIndex(prev => Math.min(currentVideo.questions.length - 1, prev + 1)), 400);
                                    }
                                  }}
                                />
                                <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${selectedAnswers[currentQuizIndex] === i ? 'border-[#F43F5E]' : 'border-[var(--text-muted)]'}`}>
                                  <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: selectedAnswers[currentQuizIndex] === i ? 1 : 0 }}
                                    className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" 
                                  />
                                </div>
                                <span className="flex-1 leading-snug font-medium">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-between items-center mt-6 px-2">
                          <button
                            onClick={() => setCurrentQuizIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuizIndex === 0}
                            className={`flex items-center justify-center w-12 h-12 rounded-full border border-[var(--glass-border)] transition-all ${currentQuizIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--input-bg)] hover:scale-105 active:scale-95 text-[var(--text-primary)] shadow-md'}`}
                          >
                            <FiChevronRight className="text-xl" />
                          </button>
                          
                          {currentQuizIndex === currentVideo.questions.length - 1 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5 bg-black/20 px-3 py-1 rounded-full">
                                {selectedAnswers.filter(a => a !== undefined && a !== null).length} / {currentVideo.questions.length} {lang === 'ar' ? 'مكتمل' : 'Answered'}
                              </span>
                              <button
                                onClick={handleQuizSubmit}
                                disabled={submittingQuiz}
                                className={`px-8 py-3 rounded-full font-bold transition-all flex justify-center items-center gap-2 shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_5px_20px_rgba(16,185,129,0.5)] bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white hover:scale-105 active:scale-95 disabled:opacity-50`}
                              >
                                {submittingQuiz ? (
                                  <>
                                    <FiRefreshCw className="animate-spin" /> {t('video.submitting') || (lang === 'ar' ? 'جاري التسليم...' : 'Submitting...')}
                                  </>
                                ) : (
                                  <>
                                    <FiCheck /> {t('video.submitAnswers') || (lang === 'ar' ? 'تسليم الإجابات' : 'Submit Answers')}
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCurrentQuizIndex(prev => Math.min(currentVideo.questions.length - 1, prev + 1))}
                              className="flex items-center justify-center w-12 h-12 rounded-full border border-[var(--glass-border)] hover:bg-[var(--input-bg)] hover:scale-105 active:scale-95 transition-all text-[var(--text-primary)] shadow-md"
                            >
                              <FiChevronLeft className="text-xl" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Chat Tab View */}
                {activeTab === 'chat' && currentVideo.processingStatus === 'completed' && currentVideo.transcript && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }} 
                    transition={{ opacity: { duration: 0.3 }, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }} 
                    className="glass-ultra rounded-[2.5rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-[0_25px_60px_-15px_rgba(139,92,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)] relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 via-transparent to-[#14B8A6]/10 pointer-events-none z-0" />
                    
                    <div className="p-6 border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-xl relative z-10 flex justify-between items-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)]">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-[#8B5CF6] rounded-full inline-block shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                        <FiMessageCircle className="text-[#8B5CF6] drop-shadow-md" />
                        Chat with Video
                      </h2>
                    </div>

                    <div className="h-[450px] overflow-y-auto p-6 space-y-6 relative z-10 bg-transparent custom-scrollbar">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-20">
                          <FiMessageCircle className="text-[#8B5CF6]/30 text-6xl mx-auto mb-4 animate-pulse" />
                          <p className="text-[var(--text-secondary)] text-lg">Ask any question about this content...</p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={`max-w-[80%] px-5 py-4 rounded-3xl text-base whitespace-pre-line shadow-[0_10px_30px_rgba(0,0,0,0.1)] border ${
                            msg.role === 'user'
                              ? 'glass bg-[#8B5CF6]/30 backdrop-blur-xl text-white border-white/30 border-t-white/40 dark:border-white/10 rounded-tr-none shadow-[0_8px_20px_rgba(139,92,246,0.3)] font-medium leading-relaxed'
                              : `bg-white/10 dark:bg-black/30 backdrop-blur-xl text-[var(--text-primary)] border-white/20 dark:border-white/10 border-t-white/30 rounded-tl-none shadow-[0_4px_12px_rgba(20,184,166,0.05)] font-medium leading-relaxed`
                          }`}>
                            {msg.role === 'user' ? msg.content : <AIAudioMessage content={msg.content} />}
                          </motion.div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/10 dark:bg-black/30 text-[var(--text-secondary)] px-5 py-4 rounded-3xl text-base border border-white/20 dark:border-white/10 border-t-white/30 rounded-tl-none backdrop-blur-xl">
                            <div className="flex gap-1.5 pt-1">
                              <span className="animate-bounce">●</span>
                              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                            </div>
                          </motion.div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 md:p-6 border-t border-white/10 dark:border-white/5 flex gap-3 md:gap-4 bg-white/5 dark:bg-black/20 backdrop-blur-2xl relative z-10 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      <div className="flex-1 premium-gradient-focus-border rounded-2xl flex relative z-10">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                          placeholder={lang === 'ar' ? 'اسأل أي شيء حول المحتوى...' : 'Ask anything about the content...'}
                          className="w-full bg-black/[0.02] dark:bg-black/40 border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-sm md:text-base focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#8B5CF6]/50 transition-all font-bold tracking-wide shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] hover:bg-black/[0.05] dark:hover:bg-black/50 outline-none"
                          disabled={chatLoading}
                        />
                      </div>
                      <button
                        onClick={handleChatSend}
                        disabled={chatLoading || !chatInput.trim()}
                        className="bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white w-14 h-[54px] md:w-auto md:px-8 md:h-[54px] rounded-2xl font-black hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center md:gap-3 border border-white/30 border-t-white/50 relative z-10"
                      >
                        <FiSend size={20} className="md:mr-1 drop-shadow-md" />
                        <span className="hidden md:inline uppercase tracking-widest text-sm drop-shadow-md">{lang === 'ar' ? 'إرسال' : 'Send'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>
            )}
            
          </div>

          {/* Sidebar Area (1/3 Width) - Hidden during processing */}
          {!isProcessing && (
          <div className="space-y-6">
            
            {/* Processing Status Card - Large & Stacked */}
            <div className="glass-ultra p-6 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col justify-center relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/5 rounded-bl-[160px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-[#14B8A6]/10" />
              <h4 className="text-[12px] font-black text-[var(--text-muted)] mb-5 uppercase tracking-[0.3em] opacity-50">
                {t('video.processingStatus')}
              </h4>
              <div className={`px-6 py-5 rounded-2xl text-base text-center font-black shadow-inner border transition-all ${
                currentVideo.processingStatus === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/5' :
                currentVideo.processingStatus === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' :
                currentVideo.processingStatus === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-gray-500/10 text-[var(--text-muted)] border-gray-500/20'
              }`}>
                {currentVideo.processingStatus === 'completed' ? t('video.completed').toUpperCase() :
                 currentVideo.processingStatus === 'processing' ? 'ANALYZING...' :
                 currentVideo.processingStatus === 'failed' ? t('video.failed').toUpperCase() : t('video.pending').toUpperCase()}
              </div>
              
              {currentVideo.processingStatus !== 'pending' && currentVideo.processingStatus !== 'processing' && (
                <button 
                  onClick={handleRetry} 
                  disabled={retrying} 
                  className="w-full mt-6 py-4 rounded-2xl text-xs font-black glass hover:bg-[var(--input-bg)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-[#14B8A6]/40 text-[#14B8A6] shadow-xl group"
                >
                  <FiRefreshCw size={16} className={`${retrying ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  {retrying ? 'RETRYING...' : 'RE-RUN AI ANALYSIS'}
                </button>
              )}
            </div>

            {/* AI Tweak Instructions Card - Large & Stacked */}
            <div className="glass-ultra p-6 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col justify-center relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#14B8A6] via-[#14B8A6]/20 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] shadow-inner">
                  <FiEdit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                    {lang === 'ar' ? 'تعليمات الـ AI' : 'AI Instructions'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">
                    {lang === 'ar' ? 'تعليمات مخصصة' : 'Custom Instructions'}
                  </p>
                </div>
              </div>

              <div className="premium-gradient-focus-border rounded-2xl w-full">
                <textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: اشرح بالعربي، ركز على قوانين الفيزياء، لخص النقاط في جداول...' : 'e.g. Focus on formulas, answer in Arabic, use tables for summary...'}
                  className="w-full bg-black/[0.03] dark:bg-black/40 hover:bg-black/[0.05] dark:hover:bg-black/50 border border-white/10 dark:border-white/5 rounded-2xl p-6 text-[15px] text-[var(--text-primary)] outline-none min-h-[160px] resize-none transition-all placeholder:text-[var(--text-muted)]/50 focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#14B8A6]/50 font-medium leading-relaxed shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] block"
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest px-1">
                <span>{lang === 'ar' ? 'سيتم تطبيقها عند الإعادة' : 'Apply on re-run'}</span>
                <FiCpu className="text-[#14B8A6]/50" />
              </div>
            </div>

          </div>
          )}
        </div>
      </div>

      {/* CHIC MEDIA MODAL */}
      <AnimatePresence>
        {showMediaModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-8"
            >
              <div 
                className="absolute inset-0 bg-black/95 backdrop-blur-3xl cursor-pointer"
                onClick={() => setShowMediaModal(false)}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMediaModal(false); }}
                  className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white transition-all active:scale-90 group shadow-2xl border border-white/20 z-[1002]"
                >
                  <FiX size={24} />
                  <span className="sr-only">Close</span>
                </button>
              </div>

            {/* Modal Container */}
            <div className="relative w-full max-w-6xl aspect-video z-[1001] flex items-center justify-center p-0 md:p-4">
              {/* Premium Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#14B8A6]/30 via-transparent to-[#00D4FF]/30 blur-[100px] opacity-60 pointer-events-none animate-pulse" />
              
              <motion.div
                initial={{ scale: 0.95, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 30, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                className="relative w-full h-full bg-black md:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(20,184,166,0.3)] border-y md:border border-[#14B8A6]/40"
              >
              {currentVideo.sourceType === 'pdf' ? (
                <iframe
                  src={`${getAssetUrl(currentVideo.originalUrl)}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  title="Source Content Viewer"
                />
              ) : youtubeId ? (
                <iframe
                  className="w-full h-full border-none shadow-2xl"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&vq=hd1080`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={getAssetUrl(currentVideo.originalUrl)}
                  className="w-full h-full object-contain shadow-2xl"
                  controls
                  autoPlay
                  controlsList="nodownload"
                />
              )}

              {/* Top Bar for Modal Title */}
              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] border border-[#14B8A6]/30">
                     <FiPlay size={16} />
                   </div>
                   <h2 className="text-white font-bold tracking-tight text-lg shadow-black/40 drop-shadow-lg">{currentVideo.title}</h2>
                </div>
              </div>
            </motion.div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoDetail;