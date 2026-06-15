"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import useAuthStore from '../../../store/authStore';
import useLanguageStore from '../../../store/languageStore';
import useThemeStore from '../../../store/themeStore';
import useAppSound from '../../../hooks/useAppSound';
import api from '../../../api/api';
import { FiUsers, FiMessageSquare, FiSend, FiLogOut, FiFileText, FiBookOpen, FiHelpCircle, FiMap, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Flashcards from '../../../components/video/Flashcards';
import MindMap from '../../../components/video/MindMap';
import { motion } from 'framer-motion';

export default function StudyRoomPage() {
  const { id: videoId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang } = useLanguageStore();
  const { isDark } = useThemeStore();
  const { playSwoosh, playXpPop } = useAppSound();
  
  const [video, setVideo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const chatContainerRef = useRef(null);
  const inviteRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await api.get(`/videos/${videoId}`);
        if (res.data.status === 'success') {
          setVideo(res.data.data.video);
        }
      } catch (err) {
        toast.error('Failed to load video');
        router.push('/dashboard');
      }
    };
    fetchVideo();
  }, [videoId, router]);

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/users/search?q=${q}`);
      if (res.data.status === 'success') {
        setSearchResults(res.data.data.users);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const sendInvite = async (targetUser) => {
    try {
      await api.post('/notifications/invite', {
        targetUserId: targetUser._id,
        roomId: videoId,
        videoTitle: video.title
      });
      socket?.emit('send-invite', {
        toUserId: targetUser._id,
        roomId: videoId,
        videoTitle: video.title,
        fromUsername: user.username || 'Student'
      });
      toast.success(lang === 'ar' ? `تم إرسال الدعوة لـ ${targetUser.username || targetUser.name}` : `Invite sent to ${targetUser.username || targetUser.name}`);
      setShowInviteModal(false);
      setSearchQuery('');
    } catch(err) {
      toast.error(lang === 'ar' ? 'فشل إرسال الدعوة' : 'Failed to send invite');
    }
  };

  // Socket connection
  useEffect(() => {
    if (!user) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL);
    setSocket(newSocket);

    const username = user?.username || user?.name || 'Student';
    newSocket.emit('join-room', { roomId: videoId, username });

    // Listeners
    newSocket.on('room-update', (data) => {
      // Handle both formats (array or object with users array)
      const userList = Array.isArray(data) ? data : (data.users || []);
      setUsers(userList);
      
      if (data.videoState && data.videoState.currentTime > 0) {
        // Initial sync on join
        if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - data.videoState.currentTime) > 2) {
          playerRef.current.seekTo(data.videoState.currentTime);
        }
        setPlaying(data.videoState.playing);
      }
    });

    newSocket.on('user-joined', (data) => {
      toast.success(`${data.username} joined the room!`, { icon: '👋' });
      playSwoosh();
    });

    newSocket.on('user-left', (data) => {
      toast(`${data.username} left the room`, { icon: '🚶' });
    });

    newSocket.on('room-message', (data) => {
      setMessages(prev => [...prev, data]);
      playXpPop(); // little pop for messages
    });

    newSocket.on('video-sync', (state) => {
      // no-op since video is removed
    });

    newSocket.on('room-tab-changed', (data) => {
      setActiveTab(data.tab);
    });

    return () => {
      newSocket.emit('leave-room', { roomId: videoId, username });
      newSocket.disconnect();
    };
  }, [videoId, user, playSwoosh, playXpPop]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inviteRef.current && !inviteRef.current.contains(e.target)) {
        setShowInviteModal(false);
      }
    };
    if (showInviteModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInviteModal]);

  // Scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    
    socket.emit('room-chat', {
      roomId: videoId,
      senderId: user?._id || user?.id,
      username: user?.username || user?.name || 'Student',
      message: chatInput
    });
    setChatInput('');
  };

  const handlePlay = () => {
    if (!socket) return;
    setPlaying(true);
    socket.emit('video-play', { roomId: videoId, currentTime: playerRef.current?.getCurrentTime() || 0 });
  };

  const handlePause = () => {
    if (!socket) return;
    setPlaying(false);
    socket.emit('video-pause', { roomId: videoId, currentTime: playerRef.current?.getCurrentTime() || 0 });
  };

  const handleSeek = (seconds) => {
    if (!socket) return;
    isSeeking.current = true;
    socket.emit('video-seek', { roomId: videoId, currentTime: seconds });
    setTimeout(() => { isSeeking.current = false; }, 1000); // debounce sync
  };

  const handleProgress = (state) => {
    // Periodically emit our time if we are the host, or just occasionally to keep room alive
    const now = Date.now();
    if (playing && now - lastSyncTime.current > 5000) {
      lastSyncTime.current = now;
      socket?.emit('video-play', { roomId: videoId, currentTime: state.playedSeconds });
    }
  };

  if (!video) return <div className="min-h-screen flex items-center justify-center">Loading Room...</div>;

  return (
    <div className={`min-h-screen flex flex-col pt-20 pb-6 px-4 md:px-8 ${(mounted && isDark) ? 'bg-[#0B1120] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Left: Study Area replacing Video */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Tabs UI */}
          <div className="glass p-2 rounded-2xl border border-[var(--glass-border)] flex flex-wrap gap-2">
            <button 
              onClick={() => { setActiveTab('summary'); socket?.emit('room-tab-change', { roomId: videoId, tab: 'summary' }) }}
              className={`flex flex-1 justify-center items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'summary' ? 'bg-[#14B8A6] text-gray-900 shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[#14B8A6]/5'}`}
            >
              <FiFileText /> {lang === 'ar' ? 'الملخص' : 'Summary'}
            </button>
            <button 
              onClick={() => { setActiveTab('mindmap'); socket?.emit('room-tab-change', { roomId: videoId, tab: 'mindmap' }) }}
              className={`flex flex-1 justify-center items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'mindmap' ? 'bg-[#00D4FF] text-gray-900 shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[#00D4FF]/5'}`}
            >
              <FiMap /> {lang === 'ar' ? 'الخريطة' : 'Mind Map'}
            </button>
            <button 
              onClick={() => { setActiveTab('flashcards'); socket?.emit('room-tab-change', { roomId: videoId, tab: 'flashcards' }) }}
              className={`flex flex-1 justify-center items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'flashcards' ? 'bg-[#10B981] text-gray-900 shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[#10B981]/5'}`}
            >
              <FiBookOpen /> {lang === 'ar' ? 'البطاقات' : 'Flashcards'}
            </button>
            <button 
              onClick={() => { setActiveTab('quiz'); socket?.emit('room-tab-change', { roomId: videoId, tab: 'quiz' }) }}
              className={`flex flex-1 justify-center items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'quiz' ? 'bg-[#F43F5E] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[#F43F5E]/5'}`}
            >
              <FiHelpCircle /> {lang === 'ar' ? 'الكويز' : 'Quiz'}
            </button>
          </div>

          <div className="flex-1 glass rounded-2xl border border-[var(--glass-border)] shadow-2xl relative bg-[var(--bg-deep)] p-6 md:p-8 min-h-[500px] overflow-auto custom-scrollbar">
            {activeTab === 'summary' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b pb-4 border-[var(--glass-border)]"><span className="w-1 h-6 bg-[#14B8A6] rounded-full inline-block" /> {lang === 'ar' ? 'الملخص' : 'Summary'}</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-lg">{video.summary || (lang === 'ar' ? 'غير متاح' : 'Not available')}</p>
              </motion.div>
            )}
            {activeTab === 'mindmap' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[400px]">
                <MindMap title={video.title} keyPoints={video.keyPoints} />
              </motion.div>
            )}
            {activeTab === 'flashcards' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Flashcards flashcards={video.flashcards} questions={video.questions} />
              </motion.div>
            )}
            {activeTab === 'quiz' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-10">
                <h2 className="text-2xl font-bold mb-4">{lang === 'ar' ? 'اختبار للمذاكرة المشتركة' : 'Collaborative Study Quiz'}</h2>
                <p className="text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">{lang === 'ar' ? 'اقرأ الأسئلة وتناقش مع الطلاب في الغرفة. لتقديم الإجابات وتقييم الأداء، يرجى التوجه لصفحة الفيديو الرئيسية.' : 'Read questions and discuss with students in the room. To submit answers and be scored, please visit the main video page.'}</p>
                <div className="mt-8 flex flex-col items-center gap-4">
                   {video.questions?.map((q, i) => <div key={i} className="text-left text-sm text-[var(--text-primary)] bg-[var(--input-bg)] p-6 rounded-xl border border-[var(--glass-border)] shadow-md w-full"><p className="font-bold mb-3">{i+1}. {q.question}</p><ul className="space-y-2 opacity-80">{q.options?.map((opt, oi) => <li key={oi} className="ml-4 list-disc">{opt}</li>)}</ul></div>)}
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Room Header Info */}
          <div className="glass p-6 rounded-2xl border border-[var(--glass-border)] flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black mb-1">{video.title}</h1>
              <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Study Session
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowInviteModal(!showInviteModal)}
                  className="px-4 py-2 bg-[#14B8A6] text-gray-900 rounded-xl hover:bg-[#14B8A6]/90 font-bold flex items-center gap-2 transition"
                >
                  <FiUsers /> {lang === 'ar' ? 'دعوة صديق' : 'Invite Friend'}
                </button>
                
                {/* Invite Dropdown */}
                {showInviteModal && (
                  <div 
                    ref={inviteRef}
                    style={{ 
                      backgroundColor: isDark ? '#0a0a1a' : '#ffffff', 
                      backdropFilter: 'blur(40px)',
                      color: isDark ? 'white' : '#0f172a'
                    }}
                    className={`absolute bottom-full right-0 mb-8 w-[400px] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.4)] rounded-[3rem] border ${isDark ? 'border-white/10' : 'border-gray-200'} p-10 z-[999] animate-in fade-in scale-in slide-in-from-bottom-8 duration-500 ring-1 ${isDark ? 'ring-white/5' : 'ring-black/5'}`}
                  >
                    <div className="flex items-center gap-8 mb-10">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.3)] shrink-0">
                        <FiUsers className="text-white text-4xl" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className={`font-black text-3xl tracking-tighter leading-none mb-2 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{lang === 'ar' ? 'دعوة صديق' : 'Invite Friend'}</h4>
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                          <p className="text-[11px] text-[#14B8A6] font-black uppercase tracking-[0.25em] opacity-80">Collaborative Mode</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative mb-8">
                      <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        placeholder={lang === 'ar' ? 'اكتب اسم صديقك...' : 'Type friend name...'}
                        className={`w-full bg-[var(--input-bg)] border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-2xl pl-14 pr-5 py-4 text-sm focus:outline-none focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/20 transition-all placeholder:opacity-50 shadow-inner ${isDark ? 'text-white' : 'text-gray-900'}`}
                      />
                    </div>
                    {isSearching ? (
                      <div className="flex flex-col items-center py-12 gap-5">
                        <div className="w-12 h-12 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[12px] uppercase tracking-[0.25em] text-[var(--text-muted)] font-black opacity-50">{lang === 'ar' ? 'جاري البحث' : 'Searching'}</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-1">
                        {searchResults.length === 0 && searchQuery.length > 1 ? (
                           <div className="text-center py-10">
                             <p className="text-sm text-[var(--text-muted)] font-black opacity-40">{lang === 'ar' ? 'لا يوجد نتائج' : 'No friends found'}</p>
                           </div>
                        ) : (
                          searchResults.map(u => (
                            <div key={u._id} className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-[#14B8A6]/10 transition-all border border-transparent hover:border-[#14B8A6]/20 group">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0D9488] flex items-center justify-center text-white text-sm font-black uppercase shadow-xl shadow-[#14B8A6]/20 group-hover:rotate-[360deg] transition-all duration-700">
                                  {u.username?.charAt(0) || u.name?.charAt(0)}
                                </div>
                                <span className="text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[#14B8A6] transition-colors truncate">{u.username || u.name}</span>
                              </div>
                              <button 
                                onClick={() => sendInvite(u)} 
                                className="ml-4 text-[10px] uppercase tracking-[0.2em] bg-[#14B8A6] text-gray-900 px-5 py-2.5 rounded-xl font-black hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-[#14B8A6]/30 shrink-0"
                              >
                                {lang === 'ar' ? 'إرسال' : 'Invite'}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={() => router.push(`/video/${videoId}`)}
                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 font-bold flex items-center gap-2 transition"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar (Users & Chat) */}
        <div className="w-full lg:w-96 flex flex-col gap-4 h-[600px] lg:h-[calc(100vh-120px)] lg:max-h-[800px] sticky top-20">
          
          {/* Active Users */}
          <div className={`glass p-6 rounded-2xl border border-[var(--glass-border)] ${isDark ? 'bg-[#0a0a1a]/40' : 'bg-white/40'}`}>
            <h3 className="font-black text-[var(--text-primary)] text-sm mb-4 tracking-tighter uppercase opacity-50 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
              {lang === 'ar' ? `الطلاب المتصلين حالياً (${(users || []).filter(u => u !== (user?.username || user?.name || 'Student')).length})` : `Other Students Online (${(users || []).filter(u => u !== (user?.username || user?.name || 'Student')).length})`}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {(users || []).filter(u => u !== (user?.username || user?.name || 'Student')).length === 0 ? (
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-40 italic">
                  {lang === 'ar' ? 'أنت الوحيد هنا حالياً' : 'Studying solo at the moment'}
                </p>
              ) : (
                (users || []).filter(u => u !== (user?.username || user?.name || 'Student')).map((u, i) => (
                  <div key={i} className={`pl-1 pr-4 py-1.5 rounded-[2rem] border border-[#14B8A6]/20 text-xs font-bold transition-all hover:scale-105 flex items-center gap-3 ${isDark ? 'bg-[#14B8A6]/10 text-white' : 'bg-white text-[#0f172a] shadow-sm'}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#00D4FF] flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg shadow-[#14B8A6]/20">
                      {(u || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="tracking-tight">{u}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Container */}
          <div className="glass rounded-2xl border border-[var(--glass-border)] flex-1 flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-[var(--glass-border)]">
              <h3 className="font-bold flex items-center gap-2">
                <FiMessageSquare className="text-[#14B8A6]" /> {lang === 'ar' ? 'دردشة الغرفة' : 'Room Chat'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-[var(--bg-deep)]/30" ref={chatContainerRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-40 py-10 scale-90">
                  <FiMessageSquare size={40} className="mb-3" />
                  <p className="font-bold tracking-widest uppercase text-[10px]">{lang === 'ar' ? 'لا توجد رسائل بعد' : 'Waiting for messages'}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === (user?._id || user?.id);
                  return (
                    <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && (
                        <div className="flex items-center gap-2 mb-1.5 ml-1">
                          <div className="w-4 h-4 rounded-full bg-[#14B8A6] flex items-center justify-center text-[8px] text-white font-black uppercase">
                            {msg.username?.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black text-[#14B8A6] uppercase tracking-widest">
                            {msg.username}
                          </span>
                        </div>
                      )}
                      <div className={`relative px-4 py-3 rounded-2xl max-w-[85%] text-[13.5px] shadow-sm leading-relaxed ${
                        isMine 
                          ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-tr-none shadow-[#14B8A6]/10 font-medium' 
                          : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-tl-none border border-[var(--glass-border)]'
                      }`}>
                        {msg.message}
                        <div className={`text-[8px] mt-1.5 flex justify-end opacity-60 font-medium ${isMine ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-[var(--input-bg)]/50 border-t border-[var(--glass-border)] flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-[var(--text-primary)]"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-[#14B8A6] text-white disabled:opacity-50 hover:scale-105 transition"
              >
                <FiSend />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
