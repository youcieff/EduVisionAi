"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiEdit3, FiCheck, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { videoAPI } from '../../api/api';
import useLanguageStore from '../../store/languageStore';
import useThemeStore from '../../store/themeStore';

const PersonalNotes = ({ videoId }) => {
  const { lang, t } = useLanguageStore();
  const { isDark } = useThemeStore();
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await videoAPI.getPersonalNotes(videoId);
        const fetchedNote = res.data.data.note || '';
        setNote(fetchedNote);
        if (fetchedNote) {
          setLastSaved(new Date());
          setIsEditing(false); // Default to view mode if content exists
        } else {
          setIsEditing(true); // Default to edit mode if empty
        }
      } catch (error) {
        console.error('Failed to load notes', error);
      } finally {
        setIsLoaded(true);
      }
    };
    if (videoId) fetchNotes();
  }, [videoId]);

  const saveNotes = useCallback(async (contentToSave) => {
    if (!videoId) return;
    try {
      setIsSaving(true);
      await videoAPI.savePersonalNotes(videoId, contentToSave);
      setLastSaved(new Date());
      setIsEditing(false); // Switch to viewing after manual save
      toast.success(lang === 'ar' ? 'تم حفظ الملاحظات بنجاح!' : 'Notes saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(lang === 'ar' ? 'فشل حفظ الملاحظات' : 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  }, [videoId, lang]);

  const handleStudyHelp = async () => {
    if (!note || note.trim().length < 10) {
      toast.error(lang === 'ar' ? 'اكتب ملاحظات أكثر أولاً لمساعدتك في مذاكرتها' : 'Write more notes first so I can help you study them');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAiAnalysis(null);
      const prompt = `I am studying my personal notes for a video. My notes are: "${note}". 
      Please analyze these notes and:
      1. Briefly explain the core concepts mentioned in simple terms.
      2. Provide 2-3 expert study tips specifically for this content.
      3. Ask me 2 challenging questions to test my understanding.
      Respond in ${lang === 'ar' ? 'Arabic' : 'English'} with a professional and encouraging tone. Use markdown formatting like bolding and bullet points.`;
      
      const res = await videoAPI.chatWithVideo(videoId, prompt);
      setAiAnalysis(res.data.data.reply);
    } catch (error) {
      console.error('AI Study Help error:', error);
      toast.error(lang === 'ar' ? 'فشل الذكاء الاصطناعي في تحليل ملاحظاتك' : 'AI failed to analyze your notes');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Removed auto-save useEffect

  return (
    <div className={`p-6 md:p-8 rounded-2xl glass border ${isDark ? 'border-[#8B5CF6]/30 bg-[#050510]/50' : 'border-indigo-200 bg-white/50'} pdf-section`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-[var(--border-color)] pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
          <span className="w-1 h-6 bg-[#8B5CF6] rounded-full inline-block" />
          <FiEdit3 className="text-[#8B5CF6]" />
          {lang === 'ar' ? 'ملاحظاتي الشخصية' : 'Personal Notes'}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {isEditing ? (
            <button 
              onClick={() => saveNotes(note)}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70 font-bold"
            >
              <FiSave className={isSaving ? 'animate-pulse' : ''} />
              {lang === 'ar' ? 'حفظ الملاحظة' : 'Save Note'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 glass border border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-xl transition-all shadow-lg active:scale-95 font-bold w-full sm:w-auto"
              >
                <FiEdit3 />
                {lang === 'ar' ? 'تعديل الملاحظة' : 'Edit Note'}
              </button>
              <button 
                onClick={handleStudyHelp}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70 font-bold group w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiCheck className="group-hover:scale-125 transition-transform" />
                )}
                {lang === 'ar' ? 'ساعدني في المذاكرة' : 'Help me study'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'ar' ? 'أضف ملاحظاتك هنا...' : 'Add your notes here...'}
              className={`w-full min-h-[400px] p-6 rounded-2xl resize-y text-lg leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/20 transition-all ${
                isDark 
                  ? 'bg-[#000000]/40 text-gray-200 border-gray-800 placeholder-gray-600' 
                  : 'bg-gray-50 text-gray-800 border-gray-200 placeholder-gray-400'
              } border`}
              dir="auto"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Organized View Area */}
            <div className={`w-full min-h-[300px] p-8 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50/50 border-gray-200'} relative group`}>
               {note ? (
                 <div className="prose prose-invert max-w-none">
                    <p className={`text-lg leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {note}
                    </p>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center py-12 opacity-40">
                    <FiEdit3 size={48} className="mb-4" />
                    <p className="text-xl font-medium">{lang === 'ar' ? 'لا توجد ملاحظات حالياً' : 'No notes yet'}</p>
                 </div>
               )}
            </div>

            {/* AI Study Assistance Area */}
            {(aiAnalysis || isAnalyzing) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-3xl border border-[#14B8A6]/30 bg-[#14B8A6]/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/10 blur-3xl -mr-16 -mt-16" />
                
                <h3 className="text-[#14B8A6] font-bold text-xl mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center">
                    <FiCheck size={18} />
                  </div>
                  {lang === 'ar' ? 'مساعد الدراسة الذكي' : 'AI Study Assistant'}
                </h3>

                {isAnalyzing ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-[#14B8A6]/10 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-[#14B8A6]/10 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-[#14B8A6]/10 rounded-full w-5/6 animate-pulse" />
                  </div>
                ) : (
                  <div className={`prose prose-lg max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-loose whitespace-pre-line`}>
                    {aiAnalysis}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PersonalNotes;
