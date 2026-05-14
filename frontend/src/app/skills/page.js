"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiZap, FiTarget, FiAward, FiShield, FiFeather, FiUnlock, FiLock, FiCheckCircle } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import useLanguageStore from '../../store/languageStore';
import useAppSound from '../../hooks/useAppSound';
import api from '../../api/api';
import toast from 'react-hot-toast';
import PremiumBackground from '../../components/PremiumBackground';
import Confetti from '../../components/common/Confetti';

// Define the Skill Tree structure
const SKILL_TREE = [
  {
    id: 'core_student',
    title: { en: 'Core Student', ar: 'الطالب الأساسي' },
    desc: { en: 'The beginning of your journey.', ar: 'بداية رحلتك.' },
    icon: <FiStar size={24} />,
    cost: 0,
    requires: [],
    col: 2,
    row: 0,
    color: 'from-gray-500 to-gray-400'
  },
  // FOCUS BRANCH (Left)
  {
    id: 'focus_1',
    title: { en: 'Deep Focus', ar: 'التركيز العميق' },
    desc: { en: '+5% XP from all Quizzes.', ar: 'زيادة 5% على الخبرة من أية اختبارات.' },
    icon: <FiTarget size={20} />,
    cost: 1,
    requires: ['core_student'],
    col: 1,
    row: 1,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'focus_2',
    title: { en: 'Hyper Focus', ar: 'التركيز الخارق' },
    desc: { en: '+15% XP from all Quizzes.', ar: 'زيادة 15% على الخبرة من أية اختبارات.' },
    icon: <FiZap size={20} />,
    cost: 2,
    requires: ['focus_1'],
    col: 1,
    row: 2,
    color: 'from-blue-600 to-cyan-500'
  },
  {
    id: 'focus_master',
    title: { en: 'Flow State', ar: 'حالة التدفق' },
    desc: { en: '+30% XP. Unlocks blue aura.', ar: 'زيادة 30% خبرة. يفتح هالة التركيز الزرقاء.' },
    icon: <FiFeather size={20} />,
    cost: 3,
    requires: ['focus_2'],
    col: 1,
    row: 3,
    color: 'from-blue-400 to-indigo-500'
  },
  // CONSISTENCY BRANCH (Middle)
  {
    id: 'memory_1',
    title: { en: 'Retentive Mind', ar: 'الذاكرة القوية' },
    desc: { en: 'Flashcard XP is doubled (+20 XP).', ar: 'خبرة الفلاش كاردز مضاعفة.' },
    icon: <FiShield size={20} />,
    cost: 1,
    requires: ['core_student'],
    col: 2,
    row: 1,
    color: 'from-emerald-500 to-teal-400'
  },
  {
    id: 'streak_freeze',
    title: { en: 'Streak Freeze', ar: 'تجميد السلسلة' },
    desc: { en: 'Save your streak from resetting once a week.', ar: 'إحمي سلسلتك من الضياع مرة أسبوعياً.' },
    icon: <FiStar size={20} />,
    cost: 2,
    requires: ['memory_1'],
    col: 2,
    row: 2,
    color: 'from-emerald-600 to-teal-500'
  },
  {
    id: 'memory_master',
    title: { en: 'Eidetic Memory', ar: 'ذاكرة فوتوغرافية' },
    desc: { en: 'Never forget. Unlocks green aura.', ar: 'لا تنسى شيئاً أبداً. يفتح الهالة الخضراء.' },
    icon: <FiAward size={20} />,
    cost: 3,
    requires: ['streak_freeze'],
    col: 2,
    row: 3,
    color: 'from-emerald-400 to-green-500'
  },
  // PRESTIGE BRANCH (Right)
  {
    id: 'aura_gold',
    title: { en: 'Golden Aura', ar: 'الهالة الذهبية' },
    desc: { en: 'Unlock exclusive Gold profile trim.', ar: 'يفتح الفريم الذهبي لملفك الشخصي.' },
    icon: <FiAward size={20} />,
    cost: 1,
    requires: ['core_student'],
    col: 3,
    row: 1,
    color: 'from-amber-500 to-yellow-400'
  },
  {
    id: 'aura_diamond',
    title: { en: 'Diamond Aura', ar: 'الهالة الماسية' },
    desc: { en: 'Unlock exclusive Diamond profile trim.', ar: 'يفتح الفريم الماسي لملفك الشخصي.' },
    icon: <FiTarget size={20} />,
    cost: 3,
    requires: ['aura_gold'],
    col: 3,
    row: 2,
    color: 'from-purple-500 to-pink-400'
  },
  {
    id: 'crown_master',
    title: { en: 'The Crown', ar: 'التاج المكي' },
    desc: { en: 'Displays a permanent Crown next to your name on the Leaderboard.', ar: 'يظهر تاجاً جانب اسمك في لوحة المتصدرين.' },
    icon: <FiAward size={20} />,
    cost: 5,
    requires: ['aura_diamond'],
    col: 3,
    row: 3,
    color: 'from-yellow-400 to-orange-500'
  }
];

export default function SkillTreePage() {
  const { user, setUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const { lang } = useLanguageStore();
  const { playSwoosh, playLevelUp, playBadgeUnlock } = useAppSound();
  
  const [unlockedSkills, setUnlockedSkills] = useState([]);
  const [skillPoints, setSkillPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Refresh user data from server to get accurate SP and unlocked skills
    const refreshUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
        }
      } catch (err) {
        console.error('Failed to refresh user data:', err);
      }
    };
    refreshUser();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      setUnlockedSkills(user.unlockedSkills || ['core_student']);
      setSkillPoints(user.skillPoints || 0);
    }
  }, [user]);

  const handleUnlockEnd = async (node) => {
    if (isProcessing) return;
    
    // Check Requirements
    if (node.id === 'core_student') return;
    if (unlockedSkills.includes(node.id)) return;
    if (skillPoints < node.cost) {
      toast.error(lang === 'ar' ? 'نقاط المهارة غير كافية!' : 'Not enough Skill Points!');
      return;
    }
    
    const canUnlock = node.requires.every(req => unlockedSkills.includes(req));
    if (!canUnlock) {
      toast.error(lang === 'ar' ? 'يجب فتح المهارات السابقة أولاً!' : 'Must unlock prerequisite skills first!');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.post('/users/skills/unlock', { skillId: node.id, cost: node.cost });
      
      if (res.data.success || res.status === 200) {
        setSkillPoints(res.data.data.skillPoints);
        setUnlockedSkills(res.data.data.unlockedSkills);
        
        playLevelUp(); // Cinematic unlock sound
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        setSelectedNode(null);
        toast.success(lang === 'ar' ? 'تم الفتح بنجاح! 🎉' : 'Skill Unlocked successfully! 🎉');
      }
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء الفتح' : 'Failed to unlock skill');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatus = (node) => {
    if (unlockedSkills.includes(node.id)) return 'unlocked';
    if (node.requires.every(req => unlockedSkills.includes(req))) return 'available';
    return 'locked';
  };

  // Rows in the skill tree
  const rows = [0, 1, 2, 3];

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 md:px-8 relative overflow-hidden">
      <PremiumBackground />
      <Confetti active={showConfetti} />
      
      <div className="max-w-4xl mx-auto relative z-10 w-full flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-[#14B8A6] to-[#00D4FF] rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_40px_rgba(20,184,166,0.5)] rotate-3 cursor-pointer hover:rotate-6 transition-transform"
            onClick={playBadgeUnlock}
          >
            <FiTarget size={36} />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[#14B8A6]">
            {lang === 'ar' ? 'شجرة المهارات' : 'RPG Skill Tree'}
          </h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto mb-6">
            {lang === 'ar' 
              ? 'اكسب نقط مهارة (SP) مع كل مستوى جديد (Level Up). اصرف النقط لفتح قدرات تسرّع تقدمك أو تميز بروفايلك!' 
              : 'Earn Skill Points (SP) every time you Level Up. Spend them to unlock passive boosts and aesthetic prestige.'}
          </p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-4 bg-[var(--input-bg)] border border-[var(--glass-border)] px-6 py-3 rounded-2xl shadow-xl"
          >
            <div className="w-10 h-10 rounded-full bg-[#14B8A6]/20 text-[#14B8A6] flex items-center justify-center font-black">SP</div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{lang === 'ar' ? 'النقاط المتاحة' : 'Available Points'}</div>
              <div className="text-2xl font-black text-[var(--text-primary)] leading-none">{skillPoints}</div>
            </div>
          </motion.div>
        </div>

        {/* Tree Container */}
        <div className="relative w-full max-w-3xl glass-ultra rounded-[3rem] p-8 md:p-16 border border-white/20 shadow-2xl">
          
          {/* Vertical Connecting Lines (Pseudo Visuals) */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
              <path d="M 50% 12% Q 15% 30% 17% 40% T 17% 85%" fill="none" stroke="url(#gradientLink)" strokeWidth="6" strokeDasharray="10 10" />
              <path d="M 50% 12% L 50% 88%" fill="none" stroke="url(#gradientLink)" strokeWidth="6" strokeDasharray="10 10" />
              <path d="M 50% 12% Q 85% 30% 83% 40% T 83% 85%" fill="none" stroke="url(#gradientLink)" strokeWidth="6" strokeDasharray="10 10" />
              <defs>
                <linearGradient id="gradientLink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-16 md:gap-24">
            {rows.map((rowIdx) => (
              <div key={rowIdx} className="w-full flex justify-between px-4 md:px-12 relative">
                {/* 3 columns */}
                {[1, 2, 3].map((colNum) => {
                  const node = SKILL_TREE.find(s => s.row === rowIdx && s.col === colNum);
                  
                  if (!node) {
                    return <div key={colNum} className="w-20 md:w-28 opacity-0 pointer-events-none" />;
                  }

                  const status = getStatus(node);
                  
                  return (
                    <motion.div 
                      key={node.id} 
                      className={`relative w-20 md:w-28 flex flex-col items-center gap-3 cursor-pointer group`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playSwoosh();
                        setSelectedNode(node);
                      }}
                    >
                      {/* Node Icon Circle */}
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex justify-center items-center relative transition-all duration-500
                        ${status === 'unlocked' 
                          ? `bg-gradient-to-br ${node.color} shadow-[0_0_30px_rgba(20,184,166,0.4)] text-white border-2 border-white/40`
                          : status === 'available'
                            ? 'bg-[var(--input-bg)] border-2 border-[#14B8A6] text-[#14B8A6] shadow-[0_0_15px_rgba(20,184,166,0.15)] group-hover:bg-[#14B8A6]/10'
                            : 'bg-[var(--bg-deep)] border border-[var(--glass-border)] text-[var(--text-muted)] opacity-60'
                        }
                      `}>
                        {status === 'unlocked' ? <FiCheckCircle size={24} /> : status === 'locked' && node.id !== 'core_student' ? <FiLock size={20} /> : node.icon}
                        
                        {/* Cost Badge */}
                        {status !== 'unlocked' && node.cost > 0 && (
                          <div className="absolute -bottom-2 -right-2 bg-[var(--bg-deep)] border border-[#14B8A6] text-[#14B8A6] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono shadow-md z-20">
                            {node.cost}
                          </div>
                        )}
                      </div>

                      {/* Node Title */}
                      <div className="text-center w-32">
                        <span className={`text-xs md:text-sm font-bold block ${status === 'unlocked' ? 'text-[#14B8A6]' : 'text-[var(--text-primary)]'}`}>
                          {node.title[lang]}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal for Node Details & Unlock via AnimatePresence */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedNode(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={e => e.stopPropagation()}
              className="glass-ultra p-8 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${selectedNode.color}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedNode.color} text-white flex justify-center items-center shadow-lg`}>
                  {selectedNode.icon}
                </div>
                {getStatus(selectedNode) === 'unlocked' && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-black rounded-full uppercase flex items-center gap-1">
                    <FiCheckCircle /> {lang === 'ar' ? 'مفتوح' : 'Unlocked'}
                  </span>
                )}
                {getStatus(selectedNode) === 'locked' && selectedNode.id !== 'core_student' && (
                  <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-black rounded-full uppercase flex items-center gap-1">
                    <FiLock /> {lang === 'ar' ? 'مغلق' : 'Locked'}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">{selectedNode.title[lang]}</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                {selectedNode.desc[lang]}
              </p>

              {getStatus(selectedNode) === 'available' && selectedNode.id !== 'core_student' && (
                <div className="bg-[var(--input-bg)] p-4 rounded-2xl mb-6 flex justify-between items-center border border-[var(--glass-border)]">
                  <span className="text-sm font-bold text-[var(--text-secondary)]">{lang === 'ar' ? 'التكلفة:' : 'Cost:'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#14B8A6]">{selectedNode.cost}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-tight">Skill<br/>Points</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="w-full py-3 rounded-xl border border-[var(--glass-border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--input-bg)] transition-colors"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
                
                {getStatus(selectedNode) === 'available' && selectedNode.id !== 'core_student' && (
                  <button 
                    onClick={() => handleUnlockEnd(selectedNode)}
                    disabled={isProcessing || skillPoints < selectedNode.cost}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] text-white font-bold disabled:opacity-50 disabled:grayscale relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 hover:ease-in-out" />
                    {isProcessing ? '...' : (skillPoints < selectedNode.cost ? (lang === 'ar' ? 'نقاط غير كافية' : 'Not enough SP') : (lang === 'ar' ? 'فتح المهارة' : 'Unlock Skill'))}
                  </button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
