"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FiUsers, FiVideo, FiActivity, FiStar,
  FiTrash2, FiShield, FiUser, FiSearch,
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiUserPlus, FiX,
  FiMail, FiLock, FiDatabase, FiCpu, FiDollarSign,
  FiTrendingUp, FiAward, FiMessageCircle, FiZap,
  FiCheckCircle, FiAlertCircle, FiClock, FiBarChart2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/api';
import useAuthStore from '../../store/authStore';
import useLanguageStore from '../../store/languageStore';
import useThemeStore from '../../store/themeStore';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: FiBarChart2 },
  { id: 'users', label: 'Users', labelAr: 'المستخدمين', icon: FiUsers },
  { id: 'ai', label: 'AI Engine', labelAr: 'محرك الذكاء', icon: FiCpu },
  { id: 'subscriptions', label: 'Subscriptions', labelAr: 'الاشتراكات', icon: FiDollarSign },
  { id: 'queue', label: 'Processing', labelAr: 'المعالجة', icon: FiActivity },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, isRTL } = useLanguageStore();
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Overview
  const [stats, setStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);

  // Users
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Register
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({ fullName: '', username: '', email: '', password: '' });
  const [registering, setRegistering] = useState(false);

  // Queue
  const [queueData, setQueueData] = useState(null);
  const [queueFilter, setQueueFilter] = useState('');

  // Revenue
  const [revenueData, setRevenueData] = useState(null);

  // User Profile Modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [mounted, user, router]);

  const fetchOverview = useCallback(async () => {
    try {
      const [statsRes, aiRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAiStats()
      ]);
      setStats(statsRes.data.data);
      setAiStats(aiRes.data.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 10, search: searchQuery });
      setUsersList(res.data.data.users);
      setTotalPages(res.data.data.pagination.pages);
    } catch (e) { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  }, [page, searchQuery]);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await adminAPI.getProcessingQueue({ page: 1, limit: 20, status: queueFilter || undefined });
      setQueueData(res.data.data);
    } catch (e) { console.error(e); }
  }, [queueFilter]);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await adminAPI.getRevenue();
      setRevenueData(res.data.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!mounted || !user || user.role !== 'admin') return;
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'ai') fetchOverview();
    if (activeTab === 'queue') fetchQueue();
    if (activeTab === 'subscriptions') fetchRevenue();
  }, [activeTab, mounted, user, fetchOverview, fetchUsers, fetchQueue, fetchRevenue]);

  const handleDeleteUser = async (id) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success(lang === 'ar' ? 'تم الحذف بنجاح' : 'User deleted');
      fetchUsers();
    } catch (e) { toast.error('Failed'); }
  };

  const handleRoleToggle = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUserRole(id, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleViewProfile = async (id) => {
    try {
      const res = await adminAPI.getUserProfile(id);
      setUserProfile(res.data.data);
      setShowProfileModal(true);
    } catch (e) { toast.error('Failed to fetch user profile'); }
  };

  const handleUpdateSubscription = async (id, plan) => {
    try {
      await adminAPI.updateUserSubscription(id, plan);
      toast.success(`Subscription updated to ${plan}`);
      if (showProfileModal) handleViewProfile(selectedUserId);
      fetchUsers();
    } catch (e) { toast.error('Failed'); }
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (!registerData.fullName || !registerData.username || !registerData.email || !registerData.password) {
      toast.error('Please fill all fields'); return;
    }
    setRegistering(true);
    try {
      await adminAPI.register(registerData);
      toast.success('Admin created! 👑');
      setRegisterData({ fullName: '', username: '', email: '', password: '' });
      setShowRegisterForm(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRegistering(false); }
  };

  if (!mounted || !user || user.role !== 'admin') return null;

  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
      className="glass p-5 rounded-2xl border border-[var(--glass-border)] relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} bg-opacity-10`}>
          <Icon size={20} className="text-white" />
        </div>
        {sub && <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{sub}</span>}
      </div>
      <p className="text-2xl font-black text-[var(--text-primary)]">{value ?? '—'}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{label}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-60`} />
    </motion.div>
  );

  const PlanBadge = ({ plan }) => {
    const colors = {
      free: 'bg-gray-500/20 text-gray-400',
      pro: 'bg-amber-500/20 text-amber-400',
      unlimited: 'bg-emerald-500/20 text-emerald-400'
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors[plan] || colors.free}`}>{plan || 'free'}</span>;
  };

  const StatusBadge = ({ status }) => {
    const map = {
      completed: { color: 'text-emerald-400 bg-emerald-500/15', icon: FiCheckCircle },
      processing: { color: 'text-blue-400 bg-blue-500/15', icon: FiClock },
      pending: { color: 'text-amber-400 bg-amber-500/15', icon: FiClock },
      failed: { color: 'text-red-400 bg-red-500/15', icon: FiAlertCircle }
    };
    const cfg = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
        <cfg.icon size={10} /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
            <FiShield className="text-red-500" /> {lang === 'ar' ? 'مركز القيادة' : 'Command Center'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{lang === 'ar' ? 'مراقبة وتحكم كامل في المنصة' : 'Full platform monitoring & control'}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowRegisterForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-red-500/25"
        >
          <FiUserPlus size={16} /> {lang === 'ar' ? 'أدمن جديد' : 'New Admin'}
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] text-white shadow-lg shadow-[#14B8A6]/25'
                : 'glass text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <tab.icon size={16} /> {lang === 'ar' ? tab.labelAr : tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FiUsers} label={lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'} value={stats?.totalUsers} color="from-[#14B8A6] to-[#00D4FF]" />
              <StatCard icon={FiVideo} label={lang === 'ar' ? 'إجمالي الفيديوهات' : 'Total Videos'} value={stats?.totalVideos} color="from-blue-500 to-indigo-500" />
              <StatCard icon={FiActivity} label={lang === 'ar' ? 'نشط هذا الأسبوع' : 'Active This Week'} value={stats?.activeUsers} color="from-emerald-500 to-green-500" />
              <StatCard icon={FiStar} label={lang === 'ar' ? 'إجمالي الاختبارات' : 'Total Quizzes'} value={stats?.totalQuizzes} color="from-amber-500 to-orange-500" />
            </div>
            {aiStats && (
              <>
                <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2"><FiCpu className="text-[#14B8A6]" /> {lang === 'ar' ? 'محرك الذكاء الاصطناعي' : 'AI Engine Status'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={FiVideo} label={lang === 'ar' ? 'فيديوهات معالجة (الشهر)' : 'Videos Processed (Month)'} value={aiStats.ai?.totalVideosProcessed} color="from-purple-500 to-pink-500" />
                  <StatCard icon={FiMessageCircle} label={lang === 'ar' ? 'رسائل AI (الشهر)' : 'AI Chats (Month)'} value={aiStats.ai?.totalChatMessages} color="from-cyan-500 to-blue-500" />
                  <StatCard icon={FiCheckCircle} label={lang === 'ar' ? 'مكتملة' : 'Completed'} value={aiStats.processingQueue?.completed} color="from-emerald-500 to-teal-500" sub={lang === 'ar' ? 'معالجة' : 'queue'} />
                  <StatCard icon={FiAlertCircle} label={lang === 'ar' ? 'فشلت' : 'Failed'} value={aiStats.processingQueue?.failed} color="from-red-500 to-pink-500" sub={lang === 'ar' ? 'معالجة' : 'queue'} />
                </div>
                <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2"><FiDollarSign className="text-emerald-400" /> {lang === 'ar' ? 'الإيرادات' : 'Revenue'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon={FiDollarSign} label="MRR" value={`$${aiStats.revenue?.monthly?.toFixed(2) || '0.00'}`} color="from-emerald-500 to-green-500" />
                  <StatCard icon={FiTrendingUp} label={lang === 'ar' ? 'مشتركين Pro' : 'Pro Subscribers'} value={aiStats.revenue?.proSubscribers} color="from-amber-500 to-yellow-500" />
                  <StatCard icon={FiZap} label={lang === 'ar' ? 'مشتركين Unlimited' : 'Unlimited Subs'} value={aiStats.revenue?.unlimitedSubscribers} color="from-violet-500 to-purple-500" />
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input
                  type="text" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder={lang === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-[var(--glass-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/50"
                />
              </div>
              <motion.button whileTap={{ rotate: 180 }} onClick={fetchUsers} className="p-2.5 rounded-xl glass border border-[var(--glass-border)]">
                <FiRefreshCw size={16} className="text-[var(--text-muted)]" />
              </motion.button>
            </div>

            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-border)]/30">
                      <th className="px-4 py-3 text-left font-bold text-[var(--text-muted)] text-xs uppercase">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                      <th className="px-4 py-3 text-left font-bold text-[var(--text-muted)] text-xs uppercase">{lang === 'ar' ? 'البريد' : 'Email'}</th>
                      <th className="px-4 py-3 text-center font-bold text-[var(--text-muted)] text-xs uppercase">{lang === 'ar' ? 'الخطة' : 'Plan'}</th>
                      <th className="px-4 py-3 text-center font-bold text-[var(--text-muted)] text-xs uppercase">{lang === 'ar' ? 'الدور' : 'Role'}</th>
                      <th className="px-4 py-3 text-center font-bold text-[var(--text-muted)] text-xs uppercase">{lang === 'ar' ? 'فيديوهات' : 'Videos'}</th>
                      <th className="px-4 py-3 text-center font-bold text-[var(--text-muted)] text-xs uppercase">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u._id} className="border-b border-[var(--glass-border)]/50 hover:bg-[#14B8A6]/5 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] flex items-center justify-center text-white text-xs font-black">
                              {u.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-semibold text-[var(--text-primary)]">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{u.email}</td>
                        <td className="px-4 py-3 text-center"><PlanBadge plan={u.subscription?.plan} /></td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[var(--text-muted)]">{u.totalVideos || 0}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedUserId(u._id); handleViewProfile(u._id); }}
                              className="p-1.5 rounded-lg hover:bg-[#14B8A6]/10 text-[#14B8A6] transition" title="View Profile">
                              <FiUser size={14} />
                            </button>
                            <button onClick={() => handleRoleToggle(u._id, u.role)}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition" title="Toggle Role">
                              <FiShield size={14} />
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition" title="Delete">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-4 border-t border-[var(--glass-border)]">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg glass disabled:opacity-30"><FiChevronLeft size={16} /></button>
                  <span className="text-sm font-bold text-[var(--text-muted)]">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg glass disabled:opacity-30"><FiChevronRight size={16} /></button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ AI ENGINE TAB ═══ */}
        {activeTab === 'ai' && aiStats && (
          <motion.div key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FiVideo} label={lang === 'ar' ? 'فيديوهات هذا الشهر' : 'Videos This Month'} value={aiStats.ai?.totalVideosProcessed} color="from-purple-500 to-pink-500" />
              <StatCard icon={FiMessageCircle} label={lang === 'ar' ? 'رسائل AI' : 'AI Chat Messages'} value={aiStats.ai?.totalChatMessages} color="from-cyan-500 to-blue-500" />
              <StatCard icon={FiZap} label={lang === 'ar' ? 'كويزات' : 'Quizzes Generated'} value={aiStats.ai?.totalQuizzes} color="from-amber-500 to-orange-500" />
              <StatCard icon={FiStar} label={lang === 'ar' ? 'خرائط ذهنية' : 'Mind Maps'} value={aiStats.ai?.totalMindMaps} color="from-emerald-500 to-teal-500" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">{lang === 'ar' ? 'طابور المعالجة' : 'Processing Queue'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={FiClock} label={lang === 'ar' ? 'قيد الانتظار' : 'Pending'} value={aiStats.processingQueue?.pending} color="from-amber-500 to-yellow-500" />
              <StatCard icon={FiActivity} label={lang === 'ar' ? 'قيد المعالجة' : 'Processing'} value={aiStats.processingQueue?.processing} color="from-blue-500 to-cyan-500" />
              <StatCard icon={FiCheckCircle} label={lang === 'ar' ? 'مكتملة' : 'Completed'} value={aiStats.processingQueue?.completed} color="from-emerald-500 to-green-500" />
              <StatCard icon={FiAlertCircle} label={lang === 'ar' ? 'فشلت' : 'Failed'} value={aiStats.processingQueue?.failed} color="from-red-500 to-pink-500" />
            </div>
          </motion.div>
        )}

        {/* ═══ SUBSCRIPTIONS TAB ═══ */}
        {activeTab === 'subscriptions' && revenueData && (
          <motion.div key="subs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FiDollarSign} label="MRR" value={`$${revenueData.mrr?.toFixed(2)}`} color="from-emerald-500 to-green-500" />
              <StatCard icon={FiTrendingUp} label="ARR" value={`$${revenueData.arr?.toFixed(2)}`} color="from-blue-500 to-indigo-500" />
              <StatCard icon={FiUsers} label={lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'} value={revenueData.totalUsers} color="from-purple-500 to-pink-500" />
              <StatCard icon={FiZap} label={lang === 'ar' ? 'معدل التحويل' : 'Conversion Rate'} value={`${revenueData.conversionRate}%`} color="from-amber-500 to-orange-500" />
            </div>

            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">{lang === 'ar' ? 'توزيع الباقات' : 'Plan Distribution'}</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {['free', 'pro', 'unlimited'].map(plan => (
                <div key={plan} className="glass p-5 rounded-2xl border border-[var(--glass-border)] text-center">
                  <PlanBadge plan={plan} />
                  <p className="text-3xl font-black text-[var(--text-primary)] mt-3">{revenueData.distribution?.[plan] || 0}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{lang === 'ar' ? 'مستخدمين' : 'users'}</p>
                </div>
              ))}
            </div>

            {revenueData.recentSubscribers?.length > 0 && (
              <>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">{lang === 'ar' ? 'أحدث المشتركين' : 'Recent Subscribers'}</h3>
                <div className="glass rounded-2xl border border-[var(--glass-border)] divide-y divide-[var(--glass-border)]/50">
                  {revenueData.recentSubscribers.map(sub => (
                    <div key={sub._id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] flex items-center justify-center text-white text-xs font-black">
                          {sub.username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{sub.username}</p>
                          <p className="text-xs text-[var(--text-muted)]">{sub.email}</p>
                        </div>
                      </div>
                      <PlanBadge plan={sub.subscription?.plan} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ PROCESSING QUEUE TAB ═══ */}
        {activeTab === 'queue' && (
          <motion.div key="queue" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex gap-2 mb-6">
              {['', 'pending', 'processing', 'completed', 'failed'].map(f => (
                <button key={f} onClick={() => setQueueFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${queueFilter === f ? 'bg-[#14B8A6] text-white' : 'glass text-[var(--text-muted)]'}`}>
                  {f || (lang === 'ar' ? 'الكل' : 'All')}
                </button>
              ))}
            </div>
            {queueData?.videos?.length > 0 ? (
              <div className="glass rounded-2xl border border-[var(--glass-border)] divide-y divide-[var(--glass-border)]/50">
                {queueData.videos.map(v => (
                  <div key={v._id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-xs">{v.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {v.uploadedBy?.username || 'Unknown'} • {v.sourceType || 'video'} • {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={v.processingStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-2xl border border-[var(--glass-border)] p-12 text-center">
                <FiActivity size={40} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
                <p className="text-[var(--text-muted)]">{lang === 'ar' ? 'لا توجد عمليات' : 'No items in queue'}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ USER PROFILE MODAL ═══ */}
      <AnimatePresence>
        {showProfileModal && userProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl border border-[var(--glass-border)] w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {userProfile.user?.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
                      {userProfile.user?.fullName || userProfile.user?.username}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${userProfile.user?.isEmailVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'} uppercase`}>
                        {userProfile.user?.isEmailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                      <FiMail size={12} /> {userProfile.user?.email}
                      {userProfile.user?.phone && <><span className="mx-1">•</span>{userProfile.user?.phone}</>}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400"><FiX size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Details Column */}
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="glass p-4 rounded-xl border border-[var(--glass-border)]">
                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 border-b border-[var(--glass-border)] pb-2">User Details</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span className="text-[var(--text-muted)]">Role:</span> <span className="font-semibold text-[var(--text-primary)] capitalize">{userProfile.user?.role}</span></li>
                      <li className="flex justify-between"><span className="text-[var(--text-muted)]">Joined:</span> <span className="font-semibold text-[var(--text-primary)]">{new Date(userProfile.user?.createdAt).toLocaleDateString()}</span></li>
                      <li className="flex justify-between"><span className="text-[var(--text-muted)]">XP Level:</span> <span className="font-semibold text-[var(--text-primary)] text-amber-500">Lv {userProfile.user?.level} ({userProfile.user?.xp} XP)</span></li>
                      <li className="flex justify-between"><span className="text-[var(--text-muted)]">Specialization:</span> <span className="font-semibold text-[var(--text-primary)] truncate max-w-[120px]">{userProfile.user?.specialization || 'N/A'}</span></li>
                      <li className="flex justify-between"><span className="text-[var(--text-muted)]">University:</span> <span className="font-semibold text-[var(--text-primary)] truncate max-w-[120px]">{userProfile.user?.university || 'N/A'}</span></li>
                    </ul>
                  </div>

                  {/* Subscription Card */}
                  <div className="glass p-4 rounded-xl border border-[var(--glass-border)]">
                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 border-b border-[var(--glass-border)] pb-2 flex justify-between items-center">
                      Subscription 
                      <PlanBadge plan={userProfile.user?.subscription?.plan} />
                    </h4>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {['free', 'pro', 'unlimited'].map(plan => (
                        <button key={plan} onClick={() => handleUpdateSubscription(selectedUserId, plan)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition ${
                            userProfile.user?.subscription?.plan === plan ? 'bg-[#14B8A6] text-white shadow-md' : 'bg-[var(--glass-border)] text-[var(--text-muted)] hover:text-white'
                          }`}>
                          {plan.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Area: Usage, Videos, Quizzes */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                  
                  {/* AI Usage Limits */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="glass p-3 rounded-xl border border-[var(--glass-border)] text-center">
                      <FiVideo className="mx-auto text-purple-400 mb-1" size={16} />
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Videos</p>
                      <p className="text-lg font-black text-[var(--text-primary)]">{userProfile.usage?.videosProcessed || 0}</p>
                    </div>
                    <div className="glass p-3 rounded-xl border border-[var(--glass-border)] text-center">
                      <FiMessageCircle className="mx-auto text-blue-400 mb-1" size={16} />
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Chats</p>
                      <p className="text-lg font-black text-[var(--text-primary)]">{userProfile.usage?.dailyChatCount || 0}</p>
                    </div>
                    <div className="glass p-3 rounded-xl border border-[var(--glass-border)] text-center">
                      <FiStar className="mx-auto text-amber-400 mb-1" size={16} />
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Quizzes</p>
                      <p className="text-lg font-black text-[var(--text-primary)]">{userProfile.usage?.quizzesGenerated || 0}</p>
                    </div>
                    <div className="glass p-3 rounded-xl border border-[var(--glass-border)] text-center">
                      <FiActivity className="mx-auto text-emerald-400 mb-1" size={16} />
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Mind Maps</p>
                      <p className="text-lg font-black text-[var(--text-primary)]">{userProfile.usage?.mindMapsGenerated || 0}</p>
                    </div>
                  </div>

                  {/* Tabs within Modal */}
                  <div className="glass rounded-xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="flex border-b border-[var(--glass-border)]">
                      <div className="flex-1 py-3 text-center text-sm font-bold text-[var(--text-primary)] border-r border-[var(--glass-border)] bg-[var(--glass-border)]/20">
                        Uploaded Videos ({userProfile.user?.uploadedVideos?.length || 0})
                      </div>
                      <div className="flex-1 py-3 text-center text-sm font-bold text-[var(--text-primary)] bg-[var(--glass-border)]/20">
                        Quiz Results ({userProfile.quizzes?.length || 0})
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 divide-x divide-[var(--glass-border)] h-48 overflow-y-auto">
                      {/* Videos */}
                      <div className="p-3">
                        {userProfile.user?.uploadedVideos?.length > 0 ? (
                          <div className="space-y-2">
                            {userProfile.user.uploadedVideos.map(v => (
                              <div key={v._id} className="text-xs p-2 rounded-lg bg-[var(--glass-border)]/20 flex justify-between items-center">
                                <span className="truncate flex-1 font-semibold text-[var(--text-primary)]">{v.title}</span>
                                <StatusBadge status={v.status} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)] text-center mt-4">No videos uploaded</p>
                        )}
                      </div>

                      {/* Quizzes */}
                      <div className="p-3">
                        {userProfile.quizzes?.length > 0 ? (
                          <div className="space-y-2">
                            {userProfile.quizzes.map(q => (
                              <div key={q._id} className="text-xs p-2 rounded-lg bg-[var(--glass-border)]/20 flex justify-between items-center">
                                <span className="truncate flex-1 font-semibold text-[var(--text-primary)] pr-2">{q.videoTitle}</span>
                                <span className={`font-black ${q.percentage >= 80 ? 'text-emerald-400' : q.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {q.score}/{q.totalQuestions} ({q.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)] text-center mt-4">No quizzes taken</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REGISTER ADMIN MODAL ═══ */}
      <AnimatePresence>
        {showRegisterForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowRegisterForm(false)}
          >
            <motion.form
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} onSubmit={handleRegisterAdmin}
              className="glass rounded-2xl border border-[var(--glass-border)] w-full max-w-md p-6"
            >
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <FiUserPlus className="text-red-500" /> {lang === 'ar' ? 'تسجيل أدمن جديد' : 'Register New Admin'}
              </h3>
              {[
                { key: 'fullName', icon: FiUser, placeholder: 'Full Name', type: 'text' },
                { key: 'username', icon: FiUser, placeholder: 'Username', type: 'text' },
                { key: 'email', icon: FiMail, placeholder: 'Email', type: 'email' },
                { key: 'password', icon: FiLock, placeholder: 'Password', type: 'password' },
              ].map(f => (
                <div key={f.key} className="relative mb-3">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={15} />
                  <input
                    type={f.type} value={registerData[f.key]}
                    onChange={e => setRegisterData(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-[var(--glass-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/50"
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowRegisterForm(false)} className="flex-1 py-2.5 rounded-xl glass text-[var(--text-muted)] font-bold text-sm">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={registering}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm disabled:opacity-50">
                  {registering ? '...' : (lang === 'ar' ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
