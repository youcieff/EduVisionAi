"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiLink, FiX, FiFileText, FiImage, FiMonitor, FiFilm, FiFile, FiMessageSquare, FiZap, FiChevronDown, FiCheck } from 'react-icons/fi';
import { BsPlayBtnFill, BsFileEarmarkTextFill, BsImageFill } from 'react-icons/bs';
import useVideoStore from '../store/videoStore';
import useLanguageStore from '../store/languageStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import PremiumBackground from '../components/PremiumBackground';

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?/\s]+)/,
    /(?:youtube\.com\/embed\/)([^?/\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// ─── Accent colors per type ───────────────────────────────────
const ACCENT = {
  documents: '#00D4FF',
  videos: '#14B8A6',
  pdf: '#38BDF8',
  image: '#00D4FF',
  pptx: '#EF4444',
  file: '#14B8A6',
  url: '#2DD4BF',
};

const Upload = () => {
  // ── Top-level section: documents | videos ──
  const [section, setSection] = useState('documents');
  // ── Sub-tab inside each section ──
  const [docTab, setDocTab] = useState('docs');  // docs | image
  const [vidTab, setVidTab] = useState('file');  // file | url

  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [prompt, setPrompt] = useState('');

  const { uploadVideo, uploadFromUrl, uploadPDF, uploadImage, uploadPPTX, uploading, uploadProgress } = useVideoStore();
  const { t } = useLanguageStore();
  useDocumentTitle(t('nav.upload') || 'Upload');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('section');
    const t = params.get('tab');
    
    if (s === 'documents' || s === 'videos') setSection(s);
    if (s === 'documents' && (t === 'docs' || t === 'image')) setDocTab(t);
    if (s === 'videos' && (t === 'file' || t === 'url')) setVidTab(t);

    // Backward compatibility for old links
    if (params.get('type') === 'pdf') {
      setSection('documents');
      setDocTab('docs');
    }
  }, [location.search]);

  const youtubeId = useMemo(() => getYouTubeVideoId(url), [url]);
  const isYouTube = !!youtubeId;

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Auto-fetch YouTube Title
  useEffect(() => {
    const fetchYTTitle = async () => {
      if (isYouTube && !title && youtubeId) {
        try {
          const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`);
          const data = await res.json();
          if (data && data.title) {
            setTitle(data.title);
          }
        } catch (error) {
          console.error("Error auto-fetching YouTube title:", error);
        }
      }
    };
    fetchYTTitle();
  }, [isYouTube, youtubeId, title]);

  // Clear Title if URL is emptied
  useEffect(() => {
    if (section === 'videos' && vidTab === 'url' && !url) {
      setTitle('');
    }
  }, [url, section, vidTab]);

  // ── Helpers ──
  const clearFile = () => {
    setFile(null);
    if (filePreviewUrl) { URL.revokeObjectURL(filePreviewUrl); setFilePreviewUrl(null); }
    ['video-upload', 'pdf-upload', 'image-upload', 'pptx-upload'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/') || selectedFile.type === 'application/pdf') {
      setFilePreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFilePreviewUrl(null);
    }
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const currentUploadType = section === 'documents' ? docTab : vidTab;
  const accent = ACCENT[currentUploadType] || '#14B8A6';

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (section === 'videos' && vidTab === 'url') {
      if (!url) { toast.error(t('upload.errorUrl') || 'Please enter a video URL'); return; }
      if (!isYouTube && !title) { toast.error(t('upload.errorTitle') || 'Please enter a title'); return; }
    } else {
      if (!file) { toast.error(t('upload.errorFile') || 'Please select a file'); return; }
    }

    let result;
    const formData = new FormData();

    if (section === 'documents') {
      if (docTab === 'docs') {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['pptx', 'ppt'].includes(ext)) {
          formData.append('pptx', file);
          formData.append('title', title);
          formData.append('category', category);
          if (prompt) formData.append('prompt', prompt);
          result = await uploadPPTX(formData);
        } else if (ext === 'pdf') {
          formData.append('pdf', file);
          formData.append('title', title);
          formData.append('category', category);
          if (prompt) formData.append('prompt', prompt);
          result = await uploadPDF(formData);
        } else {
          // New generic document upload (Backend will be updated to handle this in uploadPDF or new endpoint)
          formData.append('pdf', file); // TEMPORARY: using uploadPDF endpoint for now
          formData.append('title', title);
          formData.append('category', category);
          if (prompt) formData.append('prompt', prompt);
          result = await uploadPDF(formData);
        }
      } else if (docTab === 'image') {
        formData.append('image', file);
        formData.append('title', title);
        formData.append('category', category);
        if (prompt) formData.append('prompt', prompt);
        result = await uploadImage(formData);
      }
    } else {
      if (vidTab === 'file') {
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        if (prompt) formData.append('prompt', prompt);
        result = await uploadVideo(formData);
      } else {
        result = await uploadFromUrl({
          url,
          title: title || '',
          description,
          category,
          prompt: prompt || '',
        });
      }
    }

    if (result?.success) {
      // Navigate immediately to the video detail page
      if (result.video?._id) {
        router.push(`/video/${result.video._id}`);
      }

      // clear the form
      clearFile();
      setUrl('');
      setTitle('');
      setPrompt('');
    }
  };

  // ── File accept string ──
  const getAccept = () => {
    if (section === 'documents') {
      if (docTab === 'docs') return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.html,.htm';
      if (docTab === 'image') return 'image/jpeg,image/png,image/webp,image/gif';
    }
    return 'video/*';
  };

  const getInputId = () => {
    if (section === 'documents') return `${docTab}-upload`;
    return 'video-upload';
  };

  const getFieldKey = () => {
    if (section === 'documents') return docTab;
    return vidTab;
  };

  // ── Section selector button (Segmented Control style) ──
  const SectionBtn = ({ id, icon: Icon, label }) => {
    const isActive = section === id;
    return (
      <button
        onClick={() => { if (id !== section) { setSection(id); clearFile(); setUrl(''); setTitle(''); setPrompt(''); } }}
        className={`flex-1 relative py-3 rounded-xl font-bold transition-all duration-300 text-sm flex items-center justify-center gap-2 overflow-hidden ${
          isActive 
            ? 'text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]' 
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="active-section-bg"
            className={`absolute inset-0 z-0 bg-gradient-to-r ${
              id === 'documents' 
                ? 'from-[#00D4FF] to-[#0091B3]' 
                : 'from-[#14B8A6] to-[#0D9488]'
            } shadow-[0_0_20px_rgba(20,184,166,0.2)]`}
            initial={false}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        
        {/* Glass Border Overlay for Active Tab */}
        {isActive && (
          <div className="absolute inset-0 z-[5] border border-white/20 rounded-xl pointer-events-none" />
        )}

        <div className="relative z-10 flex items-center gap-2">
          <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
          <span className="uppercase tracking-wider text-xs md:text-sm">{label}</span>
        </div>

        {/* Shimmer Effect */}
        {isActive && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 z-[6] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          />
        )}
      </button>
    );
  };

  // ── Sub-tab button (Mini Card Style) ──
  const SubTabBtn = ({ id, icon: Icon, label, color }) => {
    const isActive = getFieldKey() === id;
    return (
      <button
        onClick={() => {
          if (section === 'documents') { setDocTab(id); } else { setVidTab(id); }
          clearFile(); setTitle(''); setPrompt('');
        }}
        className={`flex-1 relative p-4 rounded-2xl transition-all duration-500 flex flex-col items-center justify-center gap-2 overflow-hidden border ${
          isActive 
            ? 'glass-card border-white/20 dark:border-white/10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] scale-[1.02]' 
            : 'bg-white/5 dark:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 dark:hover:bg-black/20 border-white/5 opacity-70 hover:opacity-100 hover:scale-[1.01]'
        }`}
        style={isActive ? { borderColor: `${color}40`, boxShadow: `0 0 20px ${color}15` } : {}}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isActive ? `bg-gradient-to-br from-white/10 to-transparent shadow-lg text-white` : `bg-white/5 text-[var(--text-muted)] group-hover:bg-white/10`
        }`}
        style={isActive ? { backgroundColor: `${color}20`, color: color } : {}}
        >
          <Icon size={24} className={isActive ? 'animate-pulse' : ''} />
        </div>
        
        <span className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {label}
        </span>

        {/* Shimmer Effect */}
        {isActive && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-0 z-[6] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
          />
        )}
        
        {/* Glow Dot */}
        {isActive && (
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        )}
      </button>
    );
  };

  // ── Custom Select Component ──
  const CustomSelect = ({ value, onChange, options, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedOption = options[value] || value;

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-10 bg-[var(--input-bg)]/50 border border-[var(--border-color)] rounded-xl px-3 flex items-center justify-between text-sm text-[var(--input-text-accent)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-all outline-none ${isOpen ? 'ring-2 ring-[var(--accent)]/20 border-[var(--accent)] bg-[var(--input-bg)]' : 'hover:bg-[var(--border-hover)]'}`}
        >
          <span className="font-medium">{selectedOption}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <FiChevronDown className="text-[var(--text-muted)]" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
              className="absolute start-0 w-full z-[100] mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-select-scrollbar"
            >
              <div className="py-1">
                {Object.entries(options).map(([val, lab]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { onChange(val); setIsOpen(false); }}
                    style={{ direction: 'ltr' }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-all duration-300 group relative overflow-hidden border-l-2 border-r-2 border-transparent ${
                      value === val 
                        ? 'text-[var(--accent)] font-bold bg-[var(--accent)]/20' 
                        : 'text-[var(--text-primary)] hover:bg-[var(--accent)]/10 hover:pl-6 hover:border-l-[#14B8A6] hover:border-r-[#14B8A6] hover:shadow-[inset_0_0_12px_rgba(20,184,166,0.12)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 pointer-events-none">
                      {value === val && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="w-1 h-4 bg-[var(--accent)] rounded-full"
                        />
                      )}
                      <span className="font-medium text-inherit">{lab}</span>
                    </div>
                    {value === val && <FiCheck size={14} className="text-[var(--accent)] pointer-events-none" />}
                    
                    {/* Hover Accent Line - Forced absolute left for consistency */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-[var(--accent)] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center pointer-events-none" 
                      style={{ left: 0, right: 'auto' }}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  useEffect(() => {
    // Only hide overflow on desktop to prevent double scrollbar
    const mql = window.matchMedia('(min-width: 768px)');
    const update = (e) => { document.body.style.overflow = e.matches ? 'hidden' : 'auto'; };
    update(mql);
    mql.addEventListener('change', update);
    return () => {
      document.body.style.overflow = 'auto';
      mql.removeEventListener('change', update);
    };
  }, []);

  return (
    <div className="min-h-screen md:h-screen pt-16 md:pt-12 px-4 pb-4 md:overflow-hidden flex items-start md:items-center justify-center relative">
      <PremiumBackground />

      <div className="max-w-6xl w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* ═══ Left Column: Upload Controls ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-ultra p-5 md:p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.3)] relative overflow-hidden flex flex-col min-h-[400px] md:min-h-[500px] md:max-h-[520px]"
          >
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4 text-center tracking-tight">
              {t('upload.title')}
            </h2>

            {/* ── Section Toggle (Segmented Control Container) ── */}
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl p-1.5 rounded-2xl mb-8 max-w-sm mx-auto w-full border border-white/20 dark:border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_10px_30px_-5px_rgba(0,0,0,0.2)] flex relative overflow-hidden transition-all hover:bg-white/20 dark:hover:bg-black/30">
              <SectionBtn id="documents" icon={FiFile} label={t('upload.documents') || 'Files'} />
              <SectionBtn id="videos" icon={FiFilm} label={t('upload.videos') || 'Videos'} />
            </div>

            {/* ── Sub-tabs ── */}
            <div className="flex justify-center gap-2 mb-3 flex-wrap">
              <AnimatePresence mode="wait">
                {section === 'documents' ? (
                  <motion.div key="doc-tabs" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex gap-2">
                    <SubTabBtn id="docs" icon={FiFileText} label={t('home.docs') || 'Docs'} color={ACCENT.pdf} />
                    <SubTabBtn id="image" icon={FiImage} label={t('home.image') || 'Image'} color={ACCENT.image} />
                  </motion.div>
                ) : (
                  <motion.div key="vid-tabs" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex gap-2">
                    <SubTabBtn id="file" icon={FiUpload} label={t('upload.uploadVideo')} color={ACCENT.file} />
                    <SubTabBtn id="url" icon={FiLink} label={t('upload.videoUrl')} color={ACCENT.url} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── File/URL Input Area ── */}
            <div className="flex-grow flex flex-col justify-center">
              {!(section === 'videos' && vidTab === 'url') ? (
                <div className="relative group flex-grow max-h-[240px]">
                  <input
                    type="file"
                    accept={getAccept()}
                    onChange={handleFileSelect}
                    className="hidden"
                    id={getInputId()}
                  />
                  <label
                    htmlFor={getInputId()}
                    className="block w-full h-full bg-[var(--input-bg)]/40 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer hover:bg-[var(--input-bg)]/60 transition-all duration-300 group-hover:border-opacity-50 flex flex-col items-center justify-center space-y-2"
                    style={{ borderColor: `${accent}40` }}
                  >
                    {file ? (
                      <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-1">
                          <FiUpload size={20} />
                        </div>
                        <span className="px-3 py-1 rounded-xl text-xs font-bold max-w-full truncate block" style={{ color: accent, backgroundColor: `${accent}15` }}>
                           {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); clearFile(); }}
                          className="text-red-400 hover:text-red-300 text-[10px] mt-2 font-semibold flex items-center transition-colors"
                        >
                          <FiX className="mr-1" /> {t('upload.removeFile')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-secondary)] mx-auto flex items-center justify-center text-[var(--text-muted)] group-hover:scale-110 transition-transform duration-300" style={{ color: `${accent}88` }}>
                          {docTab === 'image' && section === 'documents' ? <FiImage size={24} /> : <FiFileText size={24} />}
                        </div>
                        <div>
                          <p className="text-[var(--text-primary)] font-bold text-base">
                            {docTab === 'image' && section === 'documents' ? t('upload.clickToSelectImage')
                              : docTab === 'docs' && section === 'documents' ? (t('upload.clickToSelectDoc') || 'Select Document')
                              : t('upload.clickToSelect')}
                          </p>
                          <p className="text-[var(--text-muted)] text-xs mt-1">
                            {t('upload.maxSize')}
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-5 max-w-md mx-auto w-full">
                  <div className="space-y-2">
                    <label className="block text-[var(--text-secondary)] text-sm font-bold px-1">{t('upload.urlLabel')}</label>
                    <div className="premium-gradient-focus-border rounded-xl relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full h-12 bg-black/[0.03] dark:bg-black/40 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[var(--accent)] transition-all duration-500 outline-none pl-10 font-bold tracking-wide shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] hover:bg-black/[0.05] dark:hover:bg-black/50"
                        placeholder={t('upload.urlPlaceholder')}
                      />
                      <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={16} />
                    </div>

                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ═══ Right Column: Information & Preview ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full"
          >
            <form onSubmit={handleSubmit} className="glass p-5 md:p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl h-full flex flex-col md:max-h-[520px]">
              
              {/* Top Row: Preview + Info Side-by-Side */}
              <div className="flex flex-col sm:flex-row gap-4 mb-3">
                {/* Preview Box with Moving Gradient Border */}
                <div className="w-full sm:w-1/2 aspect-[16/9] rounded-2xl relative flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] group overflow-hidden h-[120px] p-[2px]">
                   {/* Spinning Gradient Borders */}
                   <div 
                     className="absolute w-[200%] h-[200%] animate-[spin_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-500 z-0" 
                     style={{ background: `conic-gradient(from 0deg, transparent 0 340deg, ${accent} 360deg)` }}
                   />
                   <div 
                     className="absolute w-[200%] h-[200%] animate-[spin_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-500 z-0" 
                     style={{ background: `conic-gradient(from 180deg, transparent 0 340deg, ${accent} 360deg)` }}
                   />
                   
                   {/* Inner Solid Background */}
                   <div className="absolute inset-[2px] bg-[var(--bg-secondary)] rounded-[14px] z-10 border border-[var(--border-color)]/30 shadow-[inset_0_2px_15px_rgba(0,0,0,0.05)] overflow-hidden transition-colors" />
                   
                   {/* Content Container (z-20) */}
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center rounded-[14px] overflow-hidden">
                    {file || youtubeId ? (
                       <div className="w-full h-full relative">
                         {section === 'documents' && docTab === 'image' && filePreviewUrl ? (
                           <Image src={filePreviewUrl} alt="Preview" fill className="object-contain" unoptimized />
                         ) : section === 'documents' && docTab === 'docs' && file?.type === 'application/pdf' && filePreviewUrl ? (
                           <iframe src={filePreviewUrl + "#toolbar=0&navpanes=0"} className="w-full h-full border-none pointer-events-none" title="PDF Preview" />
                         ) : section === 'videos' && vidTab === 'file' && filePreviewUrl ? (
                           <video src={filePreviewUrl} className="w-full h-full object-contain" controls={false} autoPlay muted loop />
                         ) : (section === 'videos' && vidTab === 'url' && youtubeId) ? (
                           <iframe
                             className="w-full h-full border-none"
                             src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1`}
                             title="YouTube Preview"
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowFullScreen
                           />
                         ) : file ? (
                           <div className="flex flex-col items-center justify-center h-full bg-[var(--accent)]/5 p-4 animate-in fade-in zoom-in duration-500">
                              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mb-2 shadow-sm border border-[var(--accent)]/20">
                                 {file.name.split('.').pop().toLowerCase() === 'docx' || file.name.split('.').pop().toLowerCase() === 'doc' ? <FiFileText size={20} /> : 
                                  file.name.split('.').pop().toLowerCase() === 'pptx' || file.name.split('.').pop().toLowerCase() === 'ppt' ? <FiMonitor size={20} /> :
                                  <FiFile size={20} />}
                              </div>
                              <p className="text-[10px] font-black text-[var(--text-primary)] truncate max-w-full px-2 text-center leading-tight">{file.name}</p>
                              <p className="text-[8px] text-[var(--text-muted)] mt-1 font-bold uppercase tracking-tighter">{(file.name.split('.').pop())} {t('upload.document') || 'Document'}</p>
                           </div>
                         ) : null}
                       </div>
                    ) : (
                       <div className="text-center flex flex-col items-center justify-center space-y-2 opacity-70 group-hover:opacity-100 transition-all duration-300 relative z-20 group-hover:scale-105">
                         {/* SVG definition for the gradient icon */}
                         <svg width="0" height="0" className="absolute">
                           <linearGradient id="premium-preview-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                             <stop offset="0%" stopColor={accent} />
                             <stop offset="50%" stopColor="#8b5cf6" />
                             <stop offset="100%" stopColor="#0ea5e9" />
                           </linearGradient>
                         </svg>
                         
                         {section === 'documents' 
                           ? docTab === 'image' ? <BsImageFill size={36} style={{ fill: "url(#premium-preview-grad)" }} className="drop-shadow-sm transition-all duration-300" /> : <BsFileEarmarkTextFill size={36} style={{ fill: "url(#premium-preview-grad)" }} className="drop-shadow-sm transition-all duration-300" />
                           : <BsPlayBtnFill size={36} style={{ fill: "url(#premium-preview-grad)" }} className="drop-shadow-sm transition-all duration-300" />
                         }
                         <p 
                           className="text-[11px] font-black uppercase tracking-[0.25em] mt-2 drop-shadow-sm bg-gradient-animate bg-clip-text text-transparent"
                           style={{ backgroundImage: `linear-gradient(90deg, ${accent}, #8b5cf6, #0ea5e9, ${accent})`, backgroundSize: '200% auto' }}
                         >
                           {section === 'videos' ? t('upload.preview') : docTab === 'image' ? t('upload.imagePreview') : t('upload.docPreview')}
                         </p>
                       </div>
                    )}
                   </div>
                </div>

                {/* Info Fields */}
                <div className="w-full sm:w-1/2 space-y-3 justify-center flex flex-col">
                  <div className="space-y-1.5">
                    <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider px-1">
                       {section === 'videos' ? t('upload.videoTitle') : docTab === 'image' ? t('upload.imageTitle') || 'Image Title' : t('upload.docTitle')}
                    </label>
                    <div className="premium-gradient-focus-border rounded-xl">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-11 bg-black/[0.03] dark:bg-black/40 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[var(--accent)] transition-all duration-500 outline-none font-bold tracking-wide shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] hover:bg-black/[0.05] dark:hover:bg-black/50"
                        placeholder={
                          section === 'videos' 
                            ? (isYouTube ? '' : (t('upload.videoTitlePlaceholder') || t('upload.titlePlaceholder'))) 
                            : docTab === 'image' 
                              ? (t('upload.imageTitlePlaceholder') || 'Enter image title') 
                              : (t('upload.docTitlePlaceholder') || 'Enter document title')
                        }
                        required={!isYouTube}
                      />
                    </div>
                  </div>
 
                  <div className="space-y-1.5">
                    <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider px-1">{t('upload.category')}</label>
                    <CustomSelect
                      value={category}
                      onChange={setCategory}
                      options={t('upload.categories') || {}}
                    />
                  </div>
                </div>
              </div>

              {/* AI Instructions Textarea */}
              <div className="flex-1 flex flex-col space-y-2 mb-4">
                <label className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-sm px-1">
                  <div className="w-6 h-6 rounded bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6]">
                    <FiMessageSquare size={14} />
                  </div>
                  {t('upload.optionalPrompt') || 'AI Instructions'}
                </label>
                <div className="w-full flex-grow premium-gradient-focus-border rounded-xl flex flex-col">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full flex-grow bg-black/[0.03] dark:bg-black/40 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:placeholder-transparent focus:bg-white/50 dark:focus:bg-black/60 focus:border-[var(--accent)] transition-all duration-500 outline-none resize-none leading-relaxed font-bold tracking-wide shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.4)] hover:bg-black/[0.05] dark:hover:bg-black/50"
                    placeholder={t('upload.promptPlaceholder')}
                  />
                </div>
              </div>

              {/* Submit Button & Progress */}
              <div className="mt-auto space-y-3">
                 <AnimatePresence>
                  {uploading && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-bold px-1">
                          <span className="flex items-center gap-2" style={{ color: accent }}>
                            <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                            {currentUploadType === 'url' ? t('upload.processing') : t('upload.uploading')}
                          </span>
                          <span style={{ color: accent }}>{uploadProgress}%</span>
                       </div>
                       <div className="w-full bg-[var(--input-bg)] rounded-full h-1.5 overflow-hidden border border-[var(--border-color)]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)`, width: `${uploadProgress}%` }}
                          />
                       </div>
                    </motion.div>
                  )}
                 </AnimatePresence>

                  <button
                     type="submit"
                     disabled={uploading}
                     className="w-full h-14 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed font-black text-base text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group/btn border border-white/10"
                     style={{ backgroundColor: accent, boxShadow: `0 10px 30px ${accent}40, inset 0 2px 4px rgba(255,255,255,0.3)` }}
                   >
                     {/* Animated overlay gradient */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-gradient-animate opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
                     {uploading ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         {t('upload.processing')}
                       </>
                     ) : (
                       <>
                         <FiZap className="fill-white" size={20} />
                         {section === 'videos'
                           ? (isYouTube ? t('upload.analyzeYT') : t('upload.analyzeVideo') || 'Analyze Video')
                           : docTab === 'image' ? (t('upload.analyzeImage') || 'Analyze Image') : (
                              file?.name?.toLowerCase().endsWith('.pptx') || file?.name?.toLowerCase().endsWith('.ppt') 
                                ? (t('upload.analyzePPTX') || 'Analyze PowerPoint') 
                                : file?.name?.toLowerCase().endsWith('.pdf') 
                                  ? (t('upload.analyzePDF') || 'Analyze PDF')
                                  : (t('upload.analyzeDocuments') || 'Analyze Documents')
                           )
                         }
                       </>
                     )}
                  </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Upload;