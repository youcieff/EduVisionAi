"use client";
import React, { useState, useRef } from 'react';
import { FiPlay, FiSquare, FiLoader } from 'react-icons/fi';

const AIAudioMessage = ({ content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const toggleAudio = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    try {
      setIsLoading(true);
      const api = (await import('../../api/api')).default;
      const response = await api.post('/videos/chat/audio', { text: content }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      
      // Basic animated equalizer simulation when playing
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to play audio', e);
      alert('⚠️ Failed to generate voice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="leading-relaxed whitespace-pre-line text-inherit">
        {content}
      </div>
      <div className="flex justify-start mt-1 border-t border-white/10 pt-3">
        <button 
          onClick={toggleAudio}
          disabled={isLoading}
          className="flex items-center gap-2 text-[10px] md:text-xs font-black tracking-widest uppercase text-[#8B5CF6] dark:text-[#A855F7] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 px-4 py-2.5 rounded-2xl transition-all border border-[#8B5CF6]/20 shadow-sm active:scale-95 group"
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-[#8B5CF6]" size={14} />
          ) : isPlaying ? (
            <FiSquare className="text-[#14B8A6] group-hover:scale-110 transition-transform" size={14} />
          ) : (
            <FiPlay className="text-[#8B5CF6] group-hover:scale-110 transition-transform" size={14} />
          )}
          
          <span className={isPlaying ? "text-[#14B8A6]" : "text-[#8B5CF6]"}>
            {isLoading ? 'GENERATING VOICE...' : (isPlaying ? 'STOP TUTOR' : 'LISTEN TO TUTOR')}
          </span>
          
          {isPlaying && (
            <div className="flex gap-1 items-end h-3 ml-2">
              <span className="w-1 h-2 bg-[#14B8A6] rounded-full animate-bounce" />
              <span className="w-1 h-3 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-1 h-2 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIAudioMessage;
