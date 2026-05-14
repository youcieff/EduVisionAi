"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import useAuthStore from '../../../store/authStore';
import useLanguageStore from '../../../store/languageStore';
import useThemeStore from '../../../store/themeStore';
import useAppSound from '../../../hooks/useAppSound';
import api from '../../../api/api';
import { FiUsers, FiMessageSquare, FiSend, FiLogOut, FiFileText, FiBookOpen, FiHelpCircle, FiMap } from 'react-icons/fi';
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
  
  const chatEndRef = useRef(null);
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
        fromUsername: user.name || 'Student'
      });
      toast.success(lang === 'ar' ? `تم إرسال الدعوة لـ ${targetUser.name}` : `Invite sent to ${targetUser.name}`);
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

    const username = user.name || 'Student';
    newSocket.emit('join-room', { roomId: videoId, username });

    // Listeners
    newSocket.on('room-update', (data) => {
      setUsers(data.users || []);
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

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    
    socket.emit('room-chat', {
      roomId: videoId,
      username: user?.name,
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
                  <div className="absolute top-full right-0 mt-2 w-72 glass shadow-2xl rounded-2xl border border-[var(--glass-border)] p-4 z-50">
                    <h4 className="font-bold mb-3">{lang === 'ar' ? 'ابحث عن صديق' : 'Search for friend'}</h4>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب اسم...' : 'Type name...'}
                      className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[#14B8A6] mb-2"
                    />
                    {isSearching ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-2">{lang === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {searchResults.map(u => (
                          <div key={u._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition border border-transparent hover:border-white/10">
                            <span className="text-sm font-semibold truncate max-w-[120px] text-[var(--text-primary)]">{u.name}</span>
                            <button onClick={() => sendInvite(u)} className="text-xs bg-[#14B8A6] text-gray-900 px-3 py-1.5 rounded-md font-bold hover:scale-105 active:scale-95 transition-transform">
                              {lang === 'ar' ? 'إرسال' : 'Send'}
                            </button>
                          </div>
                        ))}
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
          <div className="glass p-4 rounded-2xl border border-[var(--glass-border)]">
            <h3 className="font-bold flex items-center gap-2 mb-3">
              <FiUsers className="text-[#14B8A6]" /> {lang === 'ar' ? 'الطلاب المتصلين' : 'Active Students'} ({(users || []).length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {(users || []).map((u, i) => (
                <div key={i} className="px-3 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs font-semibold flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#00D4FF] flex items-center justify-center text-white">
                    {u?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {u?.username || 'Unknown'}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Container */}
          <div className="glass rounded-2xl border border-[var(--glass-border)] flex-1 flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-[var(--glass-border)]">
              <h3 className="font-bold flex items-center gap-2">
                <FiMessageSquare className="text-[#14B8A6]" /> {lang === 'ar' ? 'دردشة الغرفة' : 'Room Chat'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] text-sm pt-10">
                  {lang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.username === user?.name ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-[var(--text-muted)] mb-1">{msg.username}</span>
                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                      msg.username === user?.name 
                        ? 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white rounded-br-none' 
                        : 'bg-[var(--input-bg)] text-[var(--text-primary)] rounded-bl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
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
