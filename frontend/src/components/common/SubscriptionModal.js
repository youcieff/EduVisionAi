"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiZap, FiStar, FiArrowRight } from 'react-icons/fi';
import { subscriptionAPI } from '../../api/api';
import useLanguageStore from '../../store/languageStore';
import toast from 'react-hot-toast';

const PLAN_COLORS = {
  free: { gradient: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/20', ring: 'ring-gray-500/30' },
  pro: { gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30', ring: 'ring-amber-500/30' },
  unlimited: { gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/30', ring: 'ring-emerald-500/30' }
};

const PLAN_ICONS = { free: FiStar, pro: FiZap, unlimited: FiArrowRight };

export default function SubscriptionModal({ isOpen, onClose, currentPlan = 'free', usageInfo = null }) {
  const { lang } = useLanguageStore();
  const [plans, setPlans] = useState([]);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    if (isOpen) {
      subscriptionAPI.getPlans().then(res => setPlans(res.data.data.plans)).catch(() => {});
    }
  }, [isOpen]);

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return;
    setUpgrading(planId);
    try {
      await subscriptionAPI.upgrade(planId);
      toast.success(lang === 'ar' ? 'تم ترقية خطتك بنجاح! 🎉' : 'Plan upgraded successfully! 🎉');
      onClose(true); // true = was upgraded
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => onClose(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="glass rounded-3xl border border-[var(--glass-border)] w-full max-w-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)]">
                  {lang === 'ar' ? '🚀 ارتقِ بتجربتك' : '🚀 Upgrade Your Experience'}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {lang === 'ar' ? 'وصلت للحد المجاني! اختر خطة تناسبك' : "You've reached your free limit! Choose a plan"}
                </p>
              </div>
              <button onClick={() => onClose(false)} className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition">
                <FiX size={20} />
              </button>
            </div>

            {/* Usage Info */}
            {usageInfo && (
              <div className="glass rounded-2xl border border-red-500/20 p-4 mb-6 bg-red-500/5">
                <p className="text-sm text-red-400 font-bold">
                  {lang === 'ar'
                    ? `استخدمت ${usageInfo.current} من ${usageInfo.limit} ${usageInfo.type === 'video' ? 'فيديو' : 'رسالة'} هذا الشهر`
                    : `Used ${usageInfo.current} of ${usageInfo.limit} ${usageInfo.type || 'items'} this period`
                  }
                </p>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => {
                const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.free;
                const Icon = PLAN_ICONS[plan.id] || FiStar;
                const isCurrent = currentPlan === plan.id;
                const isPopular = plan.id === 'pro';

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`relative glass rounded-2xl border p-5 transition-all ${
                      isPopular ? `border-amber-500/50 ring-2 ${colors.ring}` : 'border-[var(--glass-border)]'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase">
                        {lang === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                      </div>
                    )}

                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-3`}>
                      <Icon size={18} className="text-white" />
                    </div>

                    <h3 className="text-lg font-black text-[var(--text-primary)]">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1 mb-4">
                      <span className="text-3xl font-black text-[var(--text-primary)]">${plan.price}</span>
                      <span className="text-sm text-[var(--text-muted)]">/{lang === 'ar' ? 'شهر' : 'mo'}</span>
                    </div>

                    <ul className="space-y-2 mb-5">
                      {plan.features?.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <FiCheck size={12} className="text-emerald-400 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || plan.id === 'free' || upgrading === plan.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isCurrent
                          ? 'glass text-[var(--text-muted)] cursor-default'
                          : plan.id === 'free'
                          ? 'glass text-[var(--text-muted)] cursor-default'
                          : `bg-gradient-to-r ${colors.gradient} text-white ${colors.shadow} shadow-lg hover:shadow-xl active:scale-95`
                      } disabled:opacity-60`}
                    >
                      {isCurrent
                        ? (lang === 'ar' ? 'خطتك الحالية' : 'Current Plan')
                        : upgrading === plan.id
                        ? '...'
                        : plan.id === 'free'
                        ? (lang === 'ar' ? 'مجاني' : 'Free')
                        : (lang === 'ar' ? 'اشترك الآن' : 'Subscribe')
                      }
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
