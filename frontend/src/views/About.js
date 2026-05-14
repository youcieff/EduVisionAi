"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCpu, FiZap, FiBookOpen, FiClock, FiFileText, FiTarget, FiActivity, FiPlay } from 'react-icons/fi';
import useLanguageStore from '../store/languageStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAuthStore from '../store/authStore';
import SEO from '../components/common/SEO';

const About = () => {
  const { lang } = useLanguageStore();
  const { user } = useAuthStore();
  const isAr = lang === 'ar';

  useDocumentTitle(isAr ? 'كيف يعمل' : 'How It Works');

  const steps = [
    {
      icon: <FiZap className="text-2xl" />,
      color: 'from-[#14B8A6] to-[#5EEAD4]',
      title: isAr ? '1. ارفع المحتوى' : '1. Upload Content',
      desc: isAr ? 'ارفع فيديو أو رابط يوتيوب أو ملف PDF' : 'Upload a video, YouTube link, or PDF document',
    },
    {
      icon: <FiCpu className="text-2xl" />,
      color: 'from-[#00D4FF] to-[#0099CC]',
      title: isAr ? '2. التحليل بالذكاء الاصطناعي' : '2. AI Analysis',
      desc: isAr ? 'الذكاء الاصطناعي يحلل المحتوى ويستخرج المعلومات' : 'AI analyzes the content and extracts key information',
    },
    {
      icon: <FiBookOpen className="text-2xl" />,
      color: 'from-emerald-400 to-emerald-600',
      title: isAr ? '3. ادرس الملخصات' : '3. Study Summaries',
      desc: isAr ? 'راجع الملخصات والنقاط الأساسية والخرائط الذهنية' : 'Review summaries, key points, and mind maps',
    },
    {
      icon: <FiClock className="text-2xl" />,
      color: 'from-[#14B8A6] to-[#0D9488]',
      title: isAr ? '4. اختبر نفسك' : '4. Test Yourself',
      desc: isAr ? 'حل 20 سؤال يولدهم الذكاء الاصطناعي من المحتوى' : 'Take a 20-question AI-generated quiz from the content',
    },
  ];

  const features = [
    { icon: <FiFileText />, title: isAr ? 'ملخصات ذكية' : 'Smart Summaries', desc: isAr ? 'ملخصات مفصلة ونقاط أساسية' : 'Detailed summaries & key points' },
    { icon: <FiTarget />, title: isAr ? 'اختبارات تفاعلية' : 'Interactive Quizzes', desc: isAr ? '20 سؤال MCQ مولّد بالذكاء الاصطناعي' : '20 AI-generated MCQ questions' },
    { icon: <FiActivity />, title: isAr ? 'دردشة مع المحتوى' : 'Chat with Content', desc: isAr ? 'اسأل أسئلة عن المحتوى' : 'Ask questions about the content' },
    { icon: <FiCpu />, title: isAr ? 'شارات وإنجازات' : 'Badges & Achievements', desc: isAr ? 'نظام تحفيز بالنقاط والشارات' : 'Gamification with points & badges' },
    { icon: <FiBookOpen />, title: isAr ? 'بطاقات ذكية' : 'Flashcards', desc: isAr ? 'بطاقات مراجعة تفاعلية' : 'Interactive review flashcards' },
    { icon: <FiFileText />, title: isAr ? 'دعم متعدد' : 'Multi-format Support', desc: isAr ? 'فيديو + يوتيوب + PDF' : 'Video + YouTube + PDF' },
  ];

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <SEO title={isAr ? 'كيف يعمل' : 'How It Works'} description={isAr ? 'منصة EduVisionAI تحول أي محتوى تعليمي لتجربة دراسية تفاعلية باستخدام الذكاء الاصطناعي. تعرف على كيفية عملها.' : 'EduVisionAI transforms any educational content into an interactive study experience using AI. Learn how it works.'} />
      <div className="max-w-5xl mx-auto py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            {isAr ? 'كيف يعمل ' : 'How '}
            <span className="text-[#14B8A6]">EduVisionAI</span>
            {isAr ? '؟' : ' Works?'}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            {isAr
              ? 'منصة تعليمية ذكية بتحول أي محتوى تعليمي لتجربة دراسية تفاعلية باستخدام الذكاء الاصطناعي'
              : 'An intelligent learning platform that transforms any educational content into an interactive study experience using AI'}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl border border-[var(--glass-border)] text-center group hover:border-[#14B8A6]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(20,184,166,0.3)] cursor-default"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <h3 className="text-[var(--text-primary)] font-bold mb-2">{step.title}</h3>
              <p className="text-[var(--text-muted)] text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-10">
            {isAr ? 'الميزات' : 'Features'}
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="glass p-5 rounded-xl border border-[var(--glass-border)] flex items-start gap-4 hover:border-[#00D4FF]/30 transition-all duration-300">
                <div className="text-[#00D4FF] text-xl mt-1">{f.icon}</div>
                <div>
                  <h4 className="text-[var(--text-primary)] font-semibold mb-1">{f.title}</h4>
                  <p className="text-[var(--text-muted)] text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA - Only show for visitors */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center glass p-10 rounded-2xl border border-[var(--glass-border)]"
          >
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              {isAr ? 'هل أنت مستعد؟' : 'Ready to Get Started?'}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {isAr ? 'ابدأ الآن وحوّل أي محتوى تعليمي لتجربة تفاعلية' : 'Transform any learning content into an interactive experience'}
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 btn-gold-spin px-8 py-4 rounded-xl text-lg">
              <FiPlay />
              {isAr ? 'ابدأ مجاناً' : 'Start Free'}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default About;
