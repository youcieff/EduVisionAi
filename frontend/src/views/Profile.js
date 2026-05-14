"use client";
import React, { useState, useEffect } from 'react';
import { getAssetUrl } from '../utils/apiConfig';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiSave, FiTarget, FiAward, FiBookOpen, FiZap, FiCamera } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useLanguageStore from '../store/languageStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { authAPI } from '../api/api';
import PremiumBackground from '../components/PremiumBackground';



const Profile = () => {
  const { user, updateProfile, loading } = useAuthStore();
  const { lang, isRTL } = useLanguageStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [stats, setStats] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authAPI.getDashboard();
        setStats(response.data.data.stats);
      } catch (e) {}
    };
    fetchStats();
  }, []);

  const iconStart = isRTL ? { right: '0.75rem' } : { left: '0.75rem' };
  const inputPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error(lang === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required');
      return;
    }

    const result = await updateProfile({ fullName, username, phone, specialization, university });
    if (result?.success) {
      toast.success(lang === 'ar' ? 'تم تحديث البيانات ✅' : 'Profile updated ✅');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(lang === 'ar' ? 'يرجى اختيار صورة صحيحة' : 'Please select a valid image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error(lang === 'ar' ? 'حجم الصورة يجب أن لا يتخطى 5 ميجابايت' : 'Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await authAPI.uploadAvatar(formData);
      if (response.data.status === 'success') {
        const updatedUser = response.data.data.user;
        useAuthStore.getState().setUser(updatedUser); // Update global store
        toast.success(lang === 'ar' ? 'تم تحديث الصورة الشخصية' : 'Photo updated successfully');
      }
    } catch (error) {
      console.error('Avatar upload failed:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || (lang === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload photo'));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden pb-12">
      <PremiumBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-ultra relative z-10 p-8 md:p-12 rounded-[2.5rem] w-full max-w-xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)] mt-8"
      >
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <motion.div 
            initial={{ y: 0 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className={`relative inline-block rounded-full 
              ${user?.unlockedSkills?.includes('aura_diamond') ? 'ring-4 ring-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.8)]' :
                user?.unlockedSkills?.includes('aura_gold') ? 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)]' :
                user?.unlockedSkills?.includes('memory_master') ? 'ring-4 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]' :
                user?.unlockedSkills?.includes('focus_master') ? 'ring-4 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)]' :
                ''
              }
            `}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] rounded-full flex items-center justify-center text-4xl font-bold text-[#050510] overflow-hidden border-2 border-[var(--bg-deep)] relative z-10">
              {user?.avatar && user.avatar !== 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff' ? (
                <Image 
                  src={getAssetUrl(user.avatar)} 
                  alt="Profile" 
                  width={200} height={200}
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.username?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            
            {/* Camera Floating Icon */}
            <label 
              className={`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-[#0f172a] border border-white/50 dark:border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-[0_5px_20px_rgba(20,184,166,0.4)] transition-all z-20 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
              title={lang === 'ar' ? 'تغيير الصورة' : 'Change Avatar'}
            >
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiCamera className="text-[#14B8A6] text-sm" />
              )}
            </label>
          </motion.div>
        </div>

        <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-1 flex items-center justify-center gap-3">
          {user?.unlockedSkills?.includes('crown_master') && <span className="text-4xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" title="Crown Master">👑</span>}
          {user?.username || (lang === 'ar' ? 'الملف الشخصي' : 'Profile')}
        </h2>
        <div className="flex flex-col items-center mb-6">
          <p className="text-[var(--text-muted)] text-center text-sm">{user?.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] font-black bg-[var(--text-primary)] text-[var(--bg-deep)] px-3 py-1 rounded-full uppercase tracking-widest">
              LVL {user?.level || 1}
            </span>
            <span className="text-[10px] font-black bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] text-white px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
              <FiZap size={10} /> {user?.skillPoints || 0} SP
            </span>
          </div>
        </div>

        {/* Learning Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 dark:border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
              <FiBookOpen className="text-[#00D4FF] text-2xl mx-auto mb-2 opacity-80" />
              <p className="text-[var(--text-primary)] font-black text-xl md:text-2xl">{stats.totalVideosUploaded || 0}</p>
              <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-1">{lang === 'ar' ? 'المحتوى' : 'Uploads'}</p>
            </div>
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 dark:border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
              <FiTarget className="text-[#14B8A6] text-2xl mx-auto mb-2 opacity-80" />
              <p className="text-[var(--text-primary)] font-black text-xl md:text-2xl">{stats.totalQuizzesTaken || 0}</p>
              <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-1">{lang === 'ar' ? 'الاختبارات' : 'Quizzes'}</p>
            </div>
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 dark:border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
              <FiAward className="text-[#10B981] text-2xl mx-auto mb-2 opacity-80" />
              <p className="text-[var(--text-primary)] font-black text-xl md:text-2xl">{stats.averageScore || '0%'}</p>
              <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-1">{lang === 'ar' ? 'المتوسط' : 'Avg Score'}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2 px-1">
              {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative premium-gradient-focus-border rounded-2xl w-full flex">
              <FiUser className="absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10 pointer-events-none" style={iconStart} size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-black/[0.03] dark:bg-black/40 hover:bg-black/[0.05] dark:hover:bg-black/50 border border-white/10 dark:border-white/5 rounded-2xl ${inputPadding} py-4 text-[15px] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#14B8A6]/50 transition-all font-medium shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] relative z-0 outline-none`}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2 px-1">
              {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <div className="relative premium-gradient-focus-border rounded-2xl w-full flex">
              <FiUser className="absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10 pointer-events-none" style={iconStart} size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full bg-black/[0.03] dark:bg-black/40 hover:bg-black/[0.05] dark:hover:bg-black/50 border border-white/10 dark:border-white/5 rounded-2xl ${inputPadding} py-4 text-[15px] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#14B8A6]/50 transition-all font-medium shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] relative z-0 outline-none`}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2 px-1">
              {lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
            </label>
            <div className="relative premium-gradient-focus-border rounded-2xl w-full flex">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full bg-black/[0.03] dark:bg-black/40 hover:bg-black/[0.05] dark:hover:bg-black/50 border border-white/10 dark:border-white/5 rounded-2xl px-4 py-4 text-[15px] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#14B8A6]/50 transition-all font-medium shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] relative z-0 outline-none`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2 px-1">
                {lang === 'ar' ? 'التخصص (اختياري)' : 'Specialization (Optional)'}
              </label>
              <div className="relative premium-gradient-focus-border rounded-2xl w-full flex">
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className={`w-full bg-black/[0.03] dark:bg-black/40 hover:bg-black/[0.05] dark:hover:bg-black/50 border border-white/10 dark:border-white/5 rounded-2xl px-4 py-4 text-[15px] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#14B8A6]/50 transition-all font-medium shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] relative z-0 outline-none`}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2 px-1">
                {lang === 'ar' ? 'الجامعة (اختياري)' : 'University (Optional)'}
              </label>
              <div className="relative premium-gradient-focus-border rounded-2xl w-full flex">
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className={`w-full bg-black/[0.03] dark:bg-black/40 hover:bg-black/[0.05] dark:hover:bg-black/50 border border-white/10 dark:border-white/5 rounded-2xl px-4 py-4 text-[15px] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[#14B8A6]/50 transition-all font-medium shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] relative z-0 outline-none`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2 px-1">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative w-full flex">
              <FiMail className="absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)]/50 z-10 pointer-events-none" style={iconStart} size={18} />
              <input
                type="email"
                value={user?.email || ''}
                className={`w-full bg-black/[0.01] dark:bg-black/20 border border-white/5 dark:border-white/5 rounded-2xl ${inputPadding} py-4 text-[15px] opacity-60 cursor-not-allowed font-medium shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]`}
                disabled
              />
            </div>
            <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mt-2 px-1 opacity-70">
              {lang === 'ar' ? 'البريد الإلكتروني لا يمكن تغييره' : 'Email cannot be changed'}
            </p>
          </div>

          {/* Account Info */}
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/10 dark:border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'عضو منذ' : 'Member since'}</span>
              <span className="text-[var(--text-primary)] font-bold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-white/5 dark:border-white/5">
              <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'الدور' : 'Role'}</span>
              <span className="px-3 py-1 bg-[#14B8A6]/10 text-[#14B8A6] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#14B8A6]/20">
                {user?.role || 'student'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 mt-8 text-sm"
          >
            <FiSave size={18} />
            {loading 
              ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
