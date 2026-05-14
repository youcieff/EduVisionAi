"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiHome, FiUpload, FiGrid, FiLogOut, FiUser, FiInfo, FiAward, FiBell, FiChevronDown, FiZap, FiShield, FiRefreshCw } from 'react-icons/fi';
import EduVisionLogo from '../common/EduVisionLogo';
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs';
import useAuthStore from '../../store/authStore';
import useLanguageStore from '../../store/languageStore';
import useThemeStore from '../../store/themeStore';
import { getAssetUrl } from '../../utils/apiConfig';
import useAppSound from '../../hooks/useAppSound';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t, lang, toggleLang } = useLanguageStore();
  const { isDark, toggleTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const { playSwoosh } = useAppSound();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navRef = useRef();

  // Scroll detection for dynamic styling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent hydration mismatch by deferring auth-dependent UI
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifs = async () => {
        try {
          const { authAPI } = await import('../../api/api');
          const res = await authAPI.getNotifications();
          setNotifications(res.data.data.notifications);
          setUnreadCount(res.data.data.unreadCount);
        } catch (e) { }
      };
      fetchNotifs();
    }
  }, [isAuthenticated, pathname]);

  const handleMarkRead = async () => {
    if (unreadCount === 0) return;
    try {
      const { authAPI } = await import('../../api/api');
      await authAPI.markNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) { }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (path) => pathname === path;

  // Desktop nav items config
  const isAdmin = mounted && user?.role === 'admin';
  const getNavItems = () => {
    const items = [{ to: '/', icon: <FiHome size={15} />, label: t('nav.home') }];
    if (mounted && isAuthenticated) {
      if (isAdmin) {
        items.push(
          { to: '/admin', icon: <FiShield size={15} />, label: lang === 'ar' ? 'مركز القيادة' : 'Command Center' },
        );
      } else {
        items.push(
          { to: '/leaderboard', icon: <FiAward size={15} />, label: lang === 'ar' ? 'المتصدرين' : 'Leaderboard' },
          { to: '/review', icon: <FiRefreshCw size={15} />, label: lang === 'ar' ? 'المراجعة' : 'Review' },
          { to: '/dashboard', icon: <FiGrid size={15} />, label: t('nav.dashboard') },
        );
      }
    } else if (mounted) {
      items.push({ to: '/about', icon: <FiInfo size={15} />, label: lang === 'ar' ? 'كيف يعمل' : 'How It Works' });
    }
    return items;
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-2 px-3 md:px-6'
          : 'py-3 px-3 md:px-6'
      }`}
    >
      <div
        className={`max-w-7xl mx-auto transition-all duration-500 ${
          scrolled
            ? 'nav-glass-scrolled rounded-2xl shadow-2xl'
            : 'nav-glass rounded-2xl'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 md:px-5">
          
          {/* ═══ Logo ═══ */}
          <Link href="/" className="flex items-center gap-2.5 group relative">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="nav-logo-glow" />
              <div className="rounded-xl relative z-10 shadow-lg shadow-[#14B8A6]/20 overflow-hidden">
                <EduVisionLogo size={36} />
              </div>
            </motion.div>
            <div className="hidden sm:block">
              <span className="text-[var(--text-primary)] text-[17px] font-extrabold tracking-tight">
                Edu<span className="bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] bg-clip-text text-transparent">Vision</span>
              </span>
              <span className="text-[10px] font-black tracking-wider bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] bg-clip-text text-transparent ml-0.5 align-super">AI</span>
            </div>
          </Link>

          {/* ═══ Desktop Center Nav ═══ */}
          <div className="hidden md:flex items-center">
            <div className="nav-pill-container flex items-center gap-1 p-1 rounded-2xl">
              {getNavItems().map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => playSwoosh()}
                    className={`nav-pill-item relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 ${
                      active
                        ? 'nav-pill-active text-white shadow-lg'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] rounded-xl"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {/* Upload button — special CTA style (hidden for admins) */}
              {mounted && isAuthenticated && !isAdmin && (
                <Link
                  href="/upload"
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                    isActive('/upload')
                      ? 'nav-upload-active text-white shadow-lg shadow-[#14B8A6]/30'
                      : 'nav-upload-btn btn-gold-pulse text-[#14B8A6] hover:text-white'
                  }`}
                >
                  {isActive('/upload') && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] rounded-xl"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <FiUpload size={14} />
                    {t('nav.upload')}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* ═══ Desktop Right Actions ═══ */}
          <div className="hidden md:flex items-center gap-2" ref={navRef}>
            {mounted && isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowProfileMenu(false);
                      if (!showNotifications) handleMarkRead();
                    }}
                    className="nav-action-btn relative p-2.5 rounded-xl transition-all"
                  >
                    <FiBell size={17} className={unreadCount > 0 ? "text-[#14B8A6]" : "text-[var(--text-muted)]"} />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 border-2 border-[var(--bg-nav)]"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </motion.button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} top-full mt-3 w-80 nav-dropdown rounded-2xl shadow-2xl py-0 z-50 overflow-hidden`}
                      >
                        <div className="px-4 py-3 border-b border-[var(--border-color)] bg-gradient-to-r from-[#14B8A6]/5 to-transparent">
                          <h3 className="font-bold text-sm text-[var(--text-primary)]">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto scrollbar-hide">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center text-[var(--text-muted)] text-sm">
                              <FiBell size={24} className="mx-auto mb-2 opacity-30" />
                              {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div key={n._id} className={`px-4 py-3 border-b border-[var(--border-color)]/50 transition-colors cursor-pointer hover-glow ${!n.isRead ? 'bg-[#00D4FF]/5' : ''}`}>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{n.title}</h4>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-[var(--text-muted)]/50 mt-1 block">
                                  {new Date(n.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Profile Pill */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifications(false);
                    }}
                    className="nav-user-pill flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden ring-2 ring-[#14B8A6]/30 flex items-center justify-center bg-gradient-to-br from-[#14B8A6] to-[#00D4FF]">
                      {user?.avatar && user.avatar !== 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff' ? (
                        <Image 
                          src={getAssetUrl(user.avatar)} 
                          alt={user?.username || 'Profile'} 
                          width={150} height={150}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-black text-white">
                          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--text-secondary)] text-[13px] font-semibold max-w-[80px] truncate">{user?.username || 'User'}</span>
                    <FiChevronDown size={13} className={`text-[var(--text-muted)] transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} top-full mt-3 w-52 nav-dropdown rounded-2xl shadow-2xl py-2 z-50`}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-[var(--border-color)]">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{user?.username}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:text-[#14B8A6] transition-colors text-sm font-medium hover-glow">
                            <FiUser size={15} />
                            {lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
                          </Link>
                          <Link href="/skills" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:text-[#00D4FF] transition-colors text-sm font-medium hover-glow">
                            <FiZap size={15} className="text-[#00D4FF]" />
                            {lang === 'ar' ? 'شجرة المهارات' : 'Skill Tree'}
                          </Link>
                          {user?.role === 'admin' && (
                            <Link href="/admin" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors text-sm font-bold border-l-2 border-transparent hover:border-red-500 hover-glow">
                              <FiShield size={15} />
                              {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                            </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:text-red-400 transition-colors text-sm font-medium hover-glow">
                            <FiLogOut size={15} />
                            {t('nav.logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : mounted ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-[var(--text-muted)] hover:text-[#14B8A6] hover:-translate-y-1 text-[13px] font-semibold px-4 py-2 rounded-xl transition-all hover:bg-[#14B8A6]/10">
                  {t('nav.signIn')}
                </Link>
                <Link href="/register" className="btn-gold-spin px-5 py-2.5 rounded-xl text-[13px] font-bold inline-flex items-center gap-2">
                  {t('nav.signUp')}
                </Link>
              </div>
            ) : null}

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.85, rotate: 15 }}
              whileHover={{ scale: 1.1 }}
              className="nav-action-btn p-2.5 rounded-xl transition-all"
              title={mounted && isDark ? 'Light Mode' : 'Dark Mode'}
            >
              <AnimatePresence mode="wait">
                {mounted && isDark ? (
                  <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                    <BsSunFill size={16} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                    <BsMoonStarsFill size={15} className="text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Language Toggle */}
            <motion.button
              onClick={toggleLang}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="nav-lang-btn text-[11px] font-black tracking-wider px-3 py-2 rounded-xl transition-all"
              title="Switch Language"
            >
              {mounted && lang === 'en' ? 'عربي' : 'EN'}
            </motion.button>
          </div>

          {/* ═══ Mobile Controls ═══ */}
          <div className="flex items-center gap-1.5 md:hidden">
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.85 }}
              className="nav-action-btn p-2 rounded-lg"
            >
              {mounted && isDark ? <BsSunFill size={15} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> : <BsMoonStarsFill size={14} className="text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]" />}
            </motion.button>
            <button 
              onClick={toggleLang} 
              className="nav-lang-btn text-[10px] font-black px-2.5 py-1.5 rounded-lg"
            >
              {mounted && lang === 'en' ? 'عربي' : 'EN'}
            </button>
            <motion.button
              onClick={() => {
                setIsOpen(!isOpen);
                playSwoosh();
              }}
              whileTap={{ scale: 0.9 }}
              className="nav-action-btn p-2 rounded-lg"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <FiX size={20} className="text-[var(--text-primary)]" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <FiMenu size={20} className="text-[var(--text-primary)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ═══ Mobile Menu ═══ */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-3 py-3 space-y-1 border-t border-[var(--border-color)]/30">
                {[
                  { to: '/', icon: <FiHome size={17} />, label: t('nav.home') },
                  ...(mounted && isAuthenticated
                    ? [
                        { to: '/leaderboard', icon: <FiAward size={17} />, label: lang === 'ar' ? 'المتصدرين' : 'Leaderboard' },
                        { to: '/review', icon: <FiRefreshCw size={17} />, label: lang === 'ar' ? 'المراجعة' : 'Review' },
                        { to: '/dashboard', icon: <FiGrid size={17} />, label: t('nav.dashboard') },
                        { to: '/upload', icon: <FiUpload size={17} />, label: t('nav.upload') },
                        { to: '/profile', icon: <FiUser size={17} />, label: lang === 'ar' ? 'الملف الشخصي' : 'Profile' },
                      ]
                    : mounted ? [
                        { to: '/about', icon: <FiInfo size={17} />, label: lang === 'ar' ? 'كيف يعمل' : 'How It Works' },
                      ] : []
                  ),
                ].map((item) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => {
                      setIsOpen(false);
                      playSwoosh();
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive(item.to)
                        ? 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white shadow-lg shadow-[#14B8A6]/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}

                {mounted && isAuthenticated ? (
                  <button
                    onClick={() => { 
                      handleLogout(); 
                      setIsOpen(false); 
                      playSwoosh(); 
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/5 transition-all"
                  >
                    <FiLogOut size={17} />
                    {t('nav.logout')}
                  </button>
                ) : mounted ? (
                  <div className="pt-2 space-y-2">
                    <Link href="/login" onClick={() => setIsOpen(false)} className="block text-center px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 transition-all">
                      {t('nav.signIn')}
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)} className="block text-center nav-cta-btn text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#14B8A6]/20">
                      {t('nav.signUp')}
                    </Link>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;