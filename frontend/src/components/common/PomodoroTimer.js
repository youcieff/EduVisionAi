"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPlay, FiPause, FiRotateCcw, FiCoffee, FiSettings, FiBell, FiCheck } from 'react-icons/fi';
import useLanguageStore from '../../store/languageStore';

function playAlertSound(type = 'session') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === 'session' 
      ? [523.25, 659.25, 783.99, 1046.5]
      : [783.99, 659.25, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.25 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.5);
    });
  } catch (e) {}
}

function sendNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
    });
  }
}

export default function PomodoroTimer() {
  const { lang } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [seconds, setSeconds] = useState(workMinutes * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [tempWork, setTempWork] = useState(workMinutes);
  const [tempBreak, setTempBreak] = useState(breakMinutes);
  const [alert, setAlert] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isRunning && !isBreak) setSeconds(workMinutes * 60);
  }, [workMinutes, isRunning, isBreak]);

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        setIsRunning(false);
        if (!isBreak) {
          setSessions(s => s + 1);
          setIsBreak(true);
          playAlertSound('session');
          setAlert({ type: 'session', message: lang === 'ar' ? '🎉 وقت التركيز انتهى! خذ استراحة' : '🎉 Focus done! Take a break' });
          sendNotification(lang === 'ar' ? 'انتهى وقت التركيز ⏰' : 'Focus Complete ⏰', lang === 'ar' ? 'خذ استراحة 🧘' : 'Time for a break 🧘');
          setTimeout(() => setAlert(null), 5000);
          return breakMinutes * 60;
        } else {
          setIsBreak(false);
          playAlertSound('break');
          setAlert({ type: 'break', message: lang === 'ar' ? '🔔 الاستراحة انتهت! وقت التركيز 💪' : '🔔 Break over! Focus time 💪' });
          sendNotification(lang === 'ar' ? 'انتهت الاستراحة 🔔' : 'Break Over 🔔', lang === 'ar' ? 'كمّل 💪' : 'Get back to it 💪');
          setTimeout(() => setAlert(null), 5000);
          return workMinutes * 60;
        }
      }
      return prev - 1;
    });
  }, [isBreak, workMinutes, breakMinutes, lang]);

  useEffect(() => {
    if (isRunning) intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, tick]);

  const reset = () => { setIsRunning(false); setIsBreak(false); setSeconds(workMinutes * 60); setAlert(null); };

  const handleSaveSettings = () => {
    let w = Math.min(120, Math.max(1, parseInt(tempWork) || 25));
    let b = Math.min(30, Math.max(1, parseInt(tempBreak) || 5));
    setWorkMinutes(w); setBreakMinutes(b); setShowSettings(false);
    if (!isRunning) { setIsBreak(false); setSeconds(w * 60); }
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const total = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = ((total - seconds) / total) * 100;
  const presets = [{ w: 25, b: 5, l: '25/5' }, { w: 50, b: 10, l: '50/10' }, { w: 90, b: 15, l: '90/15' }];

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(20,184,166,0.8)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center"
        title="Pomodoro Timer"
      >
        <FiClock size={24} />
        {isRunning && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse border-2 border-[var(--bg-nav)]" />}
      </motion.button>

      {/* Alert Toast */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed bottom-44 right-6 z-[70] w-72 rounded-2xl border px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl ${
              alert.type === 'session' ? 'bg-[#14B8A6]/15 border-[#14B8A6]/40' : 'bg-[#F59E0B]/15 border-[#F59E0B]/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FiBell size={16} className={alert.type === 'session' ? 'text-[#14B8A6]' : 'text-[#F59E0B]'} />
              <p className="text-xs font-semibold text-[var(--text-primary)] flex-1" dir="auto">{alert.message}</p>
              <button onClick={() => setAlert(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm leading-none">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsOpen(false); setShowSettings(false); }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="fixed bottom-[6.5rem] right-6 z-[60] w-72 glass rounded-2xl border border-[#14B8A6]/30 shadow-[0_16px_48px_rgba(0,0,0,0.35)] p-5 text-center"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isBreak ? <FiCoffee className="text-[#F59E0B]" size={16} /> : <FiClock className="text-[#14B8A6]" size={16} />}
                  <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">
                    {isBreak ? (lang === 'ar' ? 'استراحة' : 'Break') : (lang === 'ar' ? 'تركيز' : 'Focus')}
                  </span>
                </div>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => { setShowSettings(!showSettings); setTempWork(workMinutes); setTempBreak(breakMinutes); }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    showSettings 
                      ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40' 
                      : 'glass border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[#14B8A6]'
                  }`}
                >
                  <FiSettings size={12} />
                </motion.button>
              </div>

              {/* Settings (Compact) */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--input-bg)]/40 p-3 mb-4 space-y-3">
                      {/* Presets Row */}
                      <div className="flex gap-1.5 justify-center">
                        {presets.map(p => (
                          <button
                            key={p.l}
                            onClick={() => { setTempWork(p.w); setTempBreak(p.b); }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
                              tempWork === p.w && tempBreak === p.b
                                ? 'bg-[#14B8A6] text-white shadow-md shadow-[#14B8A6]/30'
                                : 'bg-[var(--glass-border)]/30 text-[var(--text-muted)] hover:text-[#14B8A6]'
                            }`}
                          >
                            {p.l}
                          </button>
                        ))}
                      </div>

                      {/* Session Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            {lang === 'ar' ? 'جلسة' : 'Session'}
                          </span>
                          <span className="text-xs font-black text-[#14B8A6]">{tempWork}<span className="text-[10px] font-medium text-[var(--text-muted)]"> {lang === 'ar' ? 'د' : 'min'}</span></span>
                        </div>
                        <input
                          type="range" min="1" max="120" value={tempWork}
                          onChange={e => setTempWork(parseInt(e.target.value))}
                          className="pomodoro-slider pomodoro-slider--teal"
                          style={{ '--fill': `${(tempWork / 120) * 100}%` }}
                        />
                      </div>

                      {/* Break Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            {lang === 'ar' ? 'استراحة' : 'Break'}
                          </span>
                          <span className="text-xs font-black text-[#F59E0B]">{tempBreak}<span className="text-[10px] font-medium text-[var(--text-muted)]"> {lang === 'ar' ? 'د' : 'min'}</span></span>
                        </div>
                        <input
                          type="range" min="1" max="30" value={tempBreak}
                          onChange={e => setTempBreak(parseInt(e.target.value))}
                          className="pomodoro-slider pomodoro-slider--amber"
                          style={{ '--fill': `${(tempBreak / 30) * 100}%` }}
                        />
                      </div>

                      {/* Save */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSaveSettings}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <FiCheck size={13} />
                        {lang === 'ar' ? 'حفظ' : 'Save'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timer Circle */}
              <div className="relative w-36 h-36 mx-auto mb-5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-color)" strokeWidth="4" opacity="0.3" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={isBreak ? '#F59E0B' : 'url(#pomGrad)'}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="pomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14B8A6" />
                      <stop offset="100%" stopColor="#00D4FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center select-none">
                  <span className="text-[2.5rem] leading-none font-black font-mono text-[var(--text-primary)] tracking-tight">{mins}:{secs}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(20,184,166,0.5)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsRunning(!isRunning)}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white flex items-center justify-center shadow-lg"
                >
                  {isRunning ? <FiPause size={24} /> : <FiPlay size={24} className="translate-x-0.5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -180 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={reset}
                  className="w-10 h-10 rounded-full glass border border-[var(--glass-border)] text-[var(--text-muted)] flex items-center justify-center hover:text-[#00D4FF] hover:border-[#00D4FF]/40 transition-colors"
                >
                  <FiRotateCcw size={16} />
                </motion.button>
              </div>

              {/* Info Footer */}
              <div className="flex items-center justify-center gap-2.5 text-[10px] text-[var(--text-muted)] font-medium mb-2">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] inline-block" />{workMinutes}{lang === 'ar' ? 'د' : 'm'}</span>
                <span className="opacity-30">|</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block" />{breakMinutes}{lang === 'ar' ? 'د' : 'm'}</span>
                <span className="opacity-30">|</span>
                <span className="text-[#14B8A6] font-black">{sessions}</span> {lang === 'ar' ? 'جلسة' : 'done'}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pomodoro-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
        }
        .pomodoro-slider--teal {
          background: linear-gradient(to right, #14B8A6 0%, #14B8A6 var(--fill), rgba(255,255,255,0.08) var(--fill), rgba(255,255,255,0.08) 100%);
        }
        .pomodoro-slider--amber {
          background: linear-gradient(to right, #F59E0B 0%, #F59E0B var(--fill), rgba(255,255,255,0.08) var(--fill), rgba(255,255,255,0.08) 100%);
        }
        .pomodoro-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.3);
          border: 2px solid #14B8A6;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .pomodoro-slider--amber::-webkit-slider-thumb {
          border-color: #F59E0B;
        }
        .pomodoro-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        .pomodoro-slider::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.3);
          border: 2px solid #14B8A6;
          cursor: pointer;
        }
        .pomodoro-slider--amber::-moz-range-thumb {
          border-color: #F59E0B;
        }
      `}</style>
    </>
  );
}
