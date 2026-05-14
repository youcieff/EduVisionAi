const Video = require('../models/Video');
const User = require('../models/User');
const Note = require('../models/Note');
const FlashcardProgress = require('../models/FlashcardProgress');
const Usage = require('../models/Usage');
const { checkQuota } = require('./subscriptionController');
const videoProcessingService = require('../services/videoProcessingService');
const path = require('path');
const fs = require('fs').promises;
const { YoutubeTranscript } = require('youtube-transcript');

// URL description cleaner
const cleanYouTubeDescription = (description) => {
  if (!description) return '';
  
  let cleaned = description;
  
  // Remove promotional blocks at the end
  const promoKeywords = [
    'اشترك', 'لا تنسوا', 'تابعونا', 'للتواصل', 'رابط الدعم', 'حساباتنا', 
    'شكرا للمشاهدة', 'Subscribe', 'Follow us', 'Instagram', 'Facebook', 'Twitter', 'Patreon',
    'اكتبوا لنا في التعليقات', 'شارك الفيديو'
  ];
  
  // Sort by earliest appearance to cut from the first promo block
  let earliestIdx = -1;
  for (const keyword of promoKeywords) {
    const idx = cleaned.indexOf(keyword);
    if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
      earliestIdx = idx;
    }
  }
  
  if (earliestIdx > 50) { // Only truncate if it's not the very first sentence
    cleaned = cleaned.substring(0, earliestIdx);
  }

  // Remove timestamp lines and common headers
  cleaned = cleaned.split('\n')
    .filter(line => !/^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}/.test(line)) // Matches 0:00, 00:00, 1:00:00
    .filter(line => !/(التسلسل الزمني|فهرس الحلقة|Timecode|Timestamps|Chapters)/i.test(line))
    .join('\n');

  // Remove hashtags
  cleaned = cleaned.replace(/#\S+/g, '');
  
  // Remove HTTP URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  
  // Remove separator lines like __, ---, ===
  cleaned = cleaned.replace(/^[\-_=]{2,}\s*$/gm, '');

  // Clean up extra spaces/blank lines left behind
  cleaned = cleaned.replace(/\s+$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
};

// @desc    Upload and process video
// @route   POST /api/videos/upload
// @access  Private
exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, category, tags, prompt } = req.body;

    // Check quota before processing
    const quota = await checkQuota(req.user.id, 'video');
    if (!quota.allowed) {
      if (req.file) try { await fs.unlink(req.file.path); } catch (e) {}
      return res.status(403).json({
        status: 'error',
        message: 'You have reached your monthly video limit. Please upgrade your plan.',
        upgradeRequired: true,
        usage: { current: quota.current, limit: quota.limit, plan: quota.plan }
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a video file'
      });
    }
    
    const video = await Video.create({
      title: title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      description: description || '',
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      category: category || 'other',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      userPrompt: prompt || '',
      processingStatus: 'pending'
    });
    
    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploadedVideos: video._id }
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Video uploaded successfully. Processing started...',
      data: { video }
    });
    
    // Track usage
    Usage.incrementCounter(req.user.id, 'videosProcessed').catch(e => console.error('Usage track error:', e));
    User.findByIdAndUpdate(req.user.id, { $inc: { totalVideosProcessed: 1 } }).catch(e => {});
    processVideoAsync(video._id, req.file.path, prompt);
    
  } catch (error) {
    console.error('Upload Video Error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload video'
    });
  }
};

// Async video processing function
async function processVideoAsync(videoId, videoPath, userPrompt = '') {
  try {
    console.log(`🎬 Processing video: ${videoId}`);
    
    // Update status to processing
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'processing',
      processingStartedAt: new Date()
    });
    
    // Emit initial processing state via Socket.io
    const io = req?.app?.get('io');
    if (io) io.emit(`processing:${videoId}`, { status: 'processing', progress: 10, message: 'Starting extraction...' });
    
    console.log('🎬 Starting video processing...');
    
    // Extract audio
    const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
    console.log('🎵 Extracting audio...');
    await videoProcessingService.extractAudio(videoPath, audioPath);
    
    // Transcribe with Whisper
    console.log('📝 Transcribing audio...');
    const transcript = await require('../services/openaiService').transcribeAudio(audioPath);
    
    // Fetch video document for metadata
    const video = await Video.findById(videoId);
    const preferredLang = video?.preferredLang || '';
    const title = video?.title || '';
    
    const openaiService = require('../services/openaiService');
    
    // Update progress: Transcription complete
    if (io) io.emit(`processing:${videoId}`, { status: 'processing', progress: 50, message: 'Generating summary & concepts...' });
    
    console.log('⚡ Running AI generation concurrently...');
    
    // BATCH 1: Description + Summary (lightweight, run together)
    const [descResult, summResult] = await Promise.allSettled([
      openaiService.generateDetailedDescription(transcript, userPrompt, title, preferredLang),
      openaiService.generateSummary(transcript, userPrompt, title, preferredLang),
    ]);
    const description = descResult.status === 'fulfilled' ? descResult.value : 'حدث خطأ أثناء إنشاء الشرح المفصل.';
    const summary = summResult.status === 'fulfilled' ? summResult.value : 'حدث خطأ أثناء إنشاء الملخص.';
    
    // Small breathing room for rate limits between batches
    await new Promise(r => setTimeout(r, 2000));
    
    // BATCH 2: Key Points + Flashcards (medium weight, run together)
    const [kpResult, fcResult] = await Promise.allSettled([
      openaiService.extractKeyPoints(transcript, userPrompt, title, preferredLang),
      openaiService.generateFlashcards(transcript, userPrompt, title, preferredLang),
    ]);
    const keyPoints = kpResult.status === 'fulfilled' ? kpResult.value : ['حدث خطأ أثناء استخراج النقاط الرئيسية'];
    const flashcards = fcResult.status === 'fulfilled' ? fcResult.value : openaiService.generateDefaultFlashcards();
    
    await new Promise(r => setTimeout(r, 2000));
    
    // BATCH 3: Questions (heaviest call — needs its own slot)
    let questions;
    try {
      questions = await openaiService.generateQuestions(transcript, userPrompt, title, preferredLang);
    } catch (e) {
      console.error('❌ Questions failed:', e.message);
      questions = openaiService.generateDefaultQuestions();
    }
    
    // Get video metadata
    const metadata = await videoProcessingService.getVideoMetadata(videoPath);
    
    // Clean up temporary audio file
    try {
      await fs.unlink(audioPath);
      console.log('🧹 Cleaned up temporary audio file');
    } catch (err) {
      console.error('⚠️ Failed to clean up audio file:', err);
    }
    
    // Update video with results
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'completed',
      transcript: transcript,
      description: description,
      summary: summary,
      keyPoints: keyPoints,
      questions: questions,
      flashcards: flashcards,
      duration: metadata.duration,
      aiModel: 'llama-3.3-70b'
    }, { new: true });
    
    if (io) io.emit(`processing:${videoId}`, { status: 'completed', progress: 100, message: 'Analysis complete!' });
    
    console.log(`✨ Video processing completed: ${videoId}`);
    
  } catch (error) {
    console.error(`❌ Video processing failed: ${videoId}`, error);
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });
    const io = req?.app?.get('io');
    if (io) io.emit(`processing:${videoId}`, { status: 'failed', message: 'Processing failed.' });
  }
}

// @desc    Upload video from URL
// @route   POST /api/videos/upload-url
// @access  Private
exports.uploadFromUrl = async (req, res) => {
  try {
    const { url, title, description, category, tags, prompt } = req.body;

    // Check quota before processing
    const quota = await checkQuota(req.user.id, 'video');
    if (!quota.allowed) {
      return res.status(403).json({
        status: 'error',
        message: 'You have reached your monthly video limit. Please upgrade your plan.',
        upgradeRequired: true,
        usage: { current: quota.current, limit: quota.limit, plan: quota.plan }
      });
    }
    
    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required'
      });
    }

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    // Auto-fetch metadata for YouTube videos
    let duration = 0;
    let finalTitle = title || '';
    let ytDescription = '';
    let thumbnail = '';
    
    if (isYouTube) {
      try {
        const metadata = await videoProcessingService.getYouTubeMetadata(url);
        if (!finalTitle || finalTitle === 'YouTube Video') finalTitle = metadata.title;
        duration = metadata.duration || 0;
        ytDescription = metadata.description || '';
        if (metadata.thumbnails && metadata.thumbnails.length > 0) {
          thumbnail = metadata.thumbnails[metadata.thumbnails.length - 1].url || '';
        }
      } catch (metaErr) {
        console.log('⚠️ Failed to fetch YouTube metadata:', metaErr.message);
      }
    }
    
    // Fallback title if still empty
    if (!finalTitle) finalTitle = 'Untitled Video';
    
    // Create video document
    const video = await Video.create({
      title: finalTitle,
      description: description || cleanYouTubeDescription(ytDescription).substring(0, 1000) || '',
      originalUrl: url,
      filePath: url,
      fileName: `url_${Date.now()}.mp4`,
      duration: duration || null,
      thumbnail: thumbnail || undefined,
      uploadedBy: req.user.id,
      category: category || 'other',
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [],
      processingStatus: 'pending',
    });
    
    // Add video to user's uploaded videos
    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploadedVideos: video._id }
    });
    
    res.status(201).json({
      status: 'success',
      message: isYouTube 
        ? 'YouTube video saved! AI is analyzing the content...'
        : 'Video URL saved successfully.',
      data: { video }
    });

    // Process YouTube video asynchronously
    if (isYouTube) {
      processYoutubeVideoAsync(video._id, url, req.app.get('io'));
    } else {
      await Video.findByIdAndUpdate(video._id, {
        processingStatus: 'completed',
        summary: 'فيديو من رابط خارجي. يمكنك مشاهدته عبر الرابط المرفق.',
        keyPoints: ['الفيديو متاح للمشاهدة', 'تم الرفع من رابط خارجي'],
        questions: [{
          question: 'هل شاهدت الفيديو المُرفق من الرابط الخارجي؟',
          options: ['نعم', 'لا', 'جزئياً', 'لاحقاً'],
          correctAnswer: 0
        }]
      });
    }
    
  } catch (error) {
    console.error('Upload URL Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to save video URL'
    });
  }
};

// Async YouTube video processing function
async function processYoutubeVideoAsync(videoId, youtubeUrl, io = null) {
  let transcript = '';
  try {
    console.log(`🎬 Processing YouTube video: ${videoId}`);
    
    // Update status to processing
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'processing',
      processingStartedAt: new Date()
    });
    
    if (io) io.emit(`processing:${videoId}`, { status: 'processing', progress: 10, message: 'Starting analysis...' });
    
    // Fetch video document for existing data & metadata
    const videoData = await Video.findById(videoId);
    
    // Check if we already have a usable transcript (retry scenario)
    if (videoData?.transcript && videoData.transcript.length > 100 && !videoData.transcript.includes('غير متاح') && !videoData.transcript.includes('Unable to extract')) {
      transcript = videoData.transcript;
      console.log(`♻️ Reusing existing transcript (${transcript.length} chars)`);
    } else {
      console.log('🎬 Starting YouTube video AI processing...');
      
      // Detect if title is Arabic to prioritize Arabic captions
      const titleHasArabic = /[\u0600-\u06FF]/.test(videoData?.title || '');
      
      // Order transcript attempts: prioritize Arabic if title is Arabic
      const transcriptAttempts = titleHasArabic
        ? [
            { lang: 'ar', label: 'Arabic' },
            { lang: undefined, label: 'default language' },
            { lang: 'en', label: 'English' },
          ]
        : [
            { lang: undefined, label: 'default language' },
            { lang: 'en', label: 'English' },
            { lang: 'ar', label: 'Arabic' },
          ];
      
      let transcriptFetched = false;
      for (const attempt of transcriptAttempts) {
        if (transcriptFetched) break;
        try {
          console.log(`📝 Trying transcript (${attempt.label})...`);
          const config = attempt.lang ? { lang: attempt.lang } : undefined;
          const transcriptArray = await YoutubeTranscript.fetchTranscript(youtubeUrl, config);
          if (transcriptArray && transcriptArray.length > 0) {
            transcript = transcriptArray.map(t => t.text).join(' ');
            transcriptFetched = true;
            console.log(`✅ Transcript fetched successfully (${attempt.label}, ${transcript.length} chars)`);
          }
        } catch (err) {
          console.log(`⚠️ Transcript attempt (${attempt.label}) failed: ${err.message}`);
        }
      }
      
      // FALLBACK 2: Download audio + Whisper transcription (full video, chunked)
      if (!transcriptFetched || transcript.length < 50) {
        console.log('⚠️ No captions found. Attempting audio download + Whisper transcription (FULL VIDEO)...');
        const uploadsDir = path.join(path.dirname(require.main?.filename || __dirname), 'uploads');
        const audioOutputPath = path.join(uploadsDir, `yt_audio_${videoId}.mp3`);
        const chunkFiles = []; // track all temp files for cleanup
        try {
          await videoProcessingService.downloadYouTubeAudio(youtubeUrl, audioOutputPath);
          
          const fsSync = require('fs');
          // yt-dlp sometimes adds extra extension — find the actual file
          let actualPath = null;
          if (fsSync.existsSync(audioOutputPath)) actualPath = audioOutputPath;
          else if (fsSync.existsSync(audioOutputPath + '.mp3')) actualPath = audioOutputPath + '.mp3';
          if (!actualPath) {
            const files = fsSync.readdirSync(uploadsDir).filter(f => f.includes(`yt_audio_${videoId}`));
            if (files.length > 0) actualPath = path.join(uploadsDir, files[0]);
          }
          
          if (actualPath) {
            chunkFiles.push(actualPath);
            const fileStat = fsSync.statSync(actualPath);
            const fileSizeMB = fileStat.size / (1024 * 1024);
            console.log(`📦 Audio file size: ${fileSizeMB.toFixed(1)} MB`);
            
            const openaiService = require('../services/openaiService');
            const ffmpeg = require('fluent-ffmpeg');
            
            // Get audio duration via ffprobe
            const audioDuration = await new Promise((resolve) => {
              ffmpeg.ffprobe(actualPath, (err, metadata) => {
                if (err) { resolve(2700); return; } // fallback: 45 min
                resolve(Math.ceil(metadata.format.duration || 2700));
              });
            });
            console.log(`⏱️ Audio duration: ${Math.round(audioDuration / 60)} minutes`);
            
            const CHUNK_DURATION = 600; // 10 minutes per chunk
            const numChunks = Math.ceil(audioDuration / CHUNK_DURATION);
            const transcriptParts = [];
            
            // Detect language from title to give Whisper a better hint
            const titleLower = (videoData.title || '').toLowerCase();
            let whisperLangHint = '';
            const arabicInTitle = (titleLower.match(/[\u0600-\u06FF]/g) || []).length;
            if (arabicInTitle > 3 || titleLower.includes('arabic') || titleLower.includes('عرب')) {
              whisperLangHint = 'ar';
            } else if (/^[a-zA-Z0-9\s.,!?':;()-]+$/.test(titleLower) && titleLower.length > 5) {
              whisperLangHint = 'en';
            }
            
            console.log(`🔪 Splitting into ${numChunks} chunks of ${CHUNK_DURATION / 60} min each...`);
            
            for (let i = 0; i < numChunks; i++) {
              const startTime = i * CHUNK_DURATION;
              const chunkPath = path.join(uploadsDir, `yt_audio_${videoId}_chunk${i}.mp3`);
              chunkFiles.push(chunkPath);
              
              try {
                // Extract chunk with ffmpeg
                await new Promise((resolve, reject) => {
                  ffmpeg(actualPath)
                    .setStartTime(startTime)
                    .setDuration(CHUNK_DURATION)
                    .toFormat('mp3')
                    .audioBitrate('96k') // 96k for better transcription quality
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .save(chunkPath);
                });
                
                if (!fsSync.existsSync(chunkPath)) {
                  console.log(`⚠️ Chunk ${i + 1} not created, skipping`);
                  continue;
                }
                
                const chunkSize = fsSync.statSync(chunkPath).size / (1024 * 1024);
                console.log(`🎤 Transcribing chunk ${i + 1}/${numChunks} (${chunkSize.toFixed(1)} MB, ${Math.round(startTime / 60)}-${Math.round(Math.min(startTime + CHUNK_DURATION, audioDuration) / 60)} min)...`);
                
                const chunkTranscript = await openaiService.transcribeAudio(chunkPath, whisperLangHint);
                
                if (chunkTranscript && chunkTranscript.length > 20 && !chunkTranscript.includes('غير متاح') && !chunkTranscript.includes('حدث خطأ')) {
                  transcriptParts.push(chunkTranscript);
                  console.log(`✅ Chunk ${i + 1} transcribed: ${chunkTranscript.length} chars`);
                  
                  if (io) io.emit(`processing:${videoId}`, { 
                    status: 'processing', 
                    progress: 10 + Math.round(((i + 1) / numChunks) * 60), 
                    message: `Transcribing part ${i + 1}/${numChunks}...` 
                  });
                } else {
                  console.log(`⚠️ Chunk ${i + 1} transcription failed or too short`);
                }
                
                // Small delay between Whisper calls
                if (i < numChunks - 1) {
                  await new Promise(r => setTimeout(r, 1000));
                }
              } catch (chunkErr) {
                console.error(`❌ Chunk ${i + 1} failed:`, chunkErr.message);
              }
            }
            
            // Combine all parts with proper separation and deduplication
            if (transcriptParts.length > 0) {
              // Simple deduplication: remove repeated sentences at chunk boundaries
              for (let i = 1; i < transcriptParts.length; i++) {
                const prevEnd = transcriptParts[i - 1].split(/[.!?ـ،]\.?/).slice(-3).join(' ').trim();
                if (prevEnd.length > 30) {
                  const overlapIdx = transcriptParts[i].indexOf(prevEnd.substring(0, 40));
                  if (overlapIdx >= 0 && overlapIdx < 100) {
                    transcriptParts[i] = transcriptParts[i].substring(overlapIdx + prevEnd.length).trim();
                  }
                }
              }
              transcript = transcriptParts.join('\n\n');
              transcriptFetched = true;
              console.log(`✅ Full Whisper transcription complete! ${transcriptParts.length}/${numChunks} chunks, ${transcript.length} total chars`);
            } else {
              console.log('⚠️ All Whisper chunks failed');
            }
          } else {
            console.log('⚠️ Audio download did not produce expected file');
          }
        } catch (audioErr) {
          console.error('⚠️ Audio download + Whisper failed:', audioErr.message);
        } finally {
          // Clean up ALL temp audio files
          const fsSync = require('fs');
          for (const f of chunkFiles) {
            try { if (fsSync.existsSync(f)) await fs.unlink(f); } catch (e) { /* ignore */ }
          }
          // Also clean any leftover yt-dlp files
          try {
            const leftover = fsSync.readdirSync(uploadsDir).filter(f => f.includes(`yt_audio_${videoId}`));
            for (const f of leftover) {
              try { await fs.unlink(path.join(uploadsDir, f)); } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
        }
      }
      
      // FALLBACK 3 (last resort): use video description from metadata
      if (!transcriptFetched || transcript.length < 50) {
        console.log('⚠️ All transcript methods failed. Using metadata as last resort...');
        try {
          const metadata = await videoProcessingService.getYouTubeMetadata(youtubeUrl);
          if (metadata.description && metadata.description.length > 100) {
            transcript = `Video Title: ${metadata.title}\n\nVideo Description:\n${metadata.description}`;
            console.log(`✅ Using video description as transcript (${transcript.length} chars)`);
          } else {
            transcript = `This is an educational video titled: "${metadata.title}". ` +
              `The video is ${Math.round((metadata.duration || 0) / 60)} minutes long. ` +
              (metadata.description ? `Description: ${metadata.description}` : '');
            console.log('⚠️ Using minimal fallback transcript from title/metadata');
          }
        } catch (metaErr) {
          console.error('⚠️ Metadata fallback also failed:', metaErr.message);
          transcript = 'Unable to extract transcript or description from this YouTube video.';
        }
      }
    }
    
    // Generate AI content from transcript with delays to avoid rate limits
    const openaiService = require('../services/openaiService');
    const userPrompt = videoData?.userPrompt || '';
    const preferredLang = videoData?.preferredLang || '';
    const title = videoData?.title || '';
    const delay = ms => new Promise(r => setTimeout(r, ms));
    
    if (io) io.emit(`processing:${videoId}`, { status: 'processing', progress: 80, message: 'Generating AI content...' });
    
    let description = '', summary = '', keyPoints = [], questions = [], flashcards = [];
    
    // BATCH 1: Description + Summary run in parallel (independent tasks)
    const [descResult, summResult] = await Promise.allSettled([
      openaiService.generateDetailedDescription(transcript, userPrompt, title, preferredLang)
        .catch(e => { console.error('❌ Description failed:', e.message); return 'حدث خطأ أثناء إنشاء الشرح المفصل.'; }),
      openaiService.generateSummary(transcript, userPrompt, title, preferredLang)
        .catch(e => { 
          console.error('❌ Summary failed:', e.message); 
          return e.message.includes('429') ? 'عذراً، لقد استنفدت باقة الذكاء الاصطناعي اليومية (Rate Limit). يرجى الانتظار والمحاولة لاحقاً.' : 'حدث خطأ أثناء إنشاء الملخص.'; 
        }),
    ]);
    description = descResult.status === 'fulfilled' ? descResult.value : 'حدث خطأ أثناء إنشاء الشرح المفصل.';
    summary = summResult.status === 'fulfilled' ? summResult.value : 'حدث خطأ أثناء إنشاء الملخص.';
    
    await delay(2000); // Rate limit protection between batches
    
    // BATCH 2: Key Points + Flashcards (parallel — independent of each other)
    const [kpResult, fcResult] = await Promise.allSettled([
      openaiService.extractKeyPoints(transcript, userPrompt, title, preferredLang)
        .catch(e => { console.error('❌ Key points failed:', e.message); return [e.message.includes('429') ? 'عذراً، لقد استنفدت باقة الذكاء الاصطناعي اليومية (Rate Limit).' : 'حدث خطأ أثناء استخراج النقاط الرئيسية']; }),
      openaiService.generateFlashcards(transcript, userPrompt, title, preferredLang)
        .catch(e => { console.error('❌ Flashcards failed:', e.message); return openaiService.generateDefaultFlashcards(); }),
    ]);
    keyPoints = kpResult.status === 'fulfilled' ? kpResult.value : ['حدث خطأ أثناء استخراج النقاط الرئيسية'];
    flashcards = fcResult.status === 'fulfilled' ? fcResult.value : openaiService.generateDefaultFlashcards();
    
    await delay(2000);
    
    // BATCH 3: Questions (heaviest call — needs its own slot)
    try {
      console.log('❓ Generating questions...');
      questions = await openaiService.generateQuestions(transcript, userPrompt, title, preferredLang);
    } catch (e) { 
      console.error('❌ Questions failed:', e.message); 
      questions = openaiService.generateDefaultQuestions(); 
    }
    
    // Update video with results
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'completed',
      transcript: transcript,
      description: description,
      summary: summary,
      keyPoints: keyPoints,
      questions: questions,
      flashcards: flashcards,
      aiModel: 'llama-3.3-70b'
    });
    
    if (io) io.emit(`processing:${videoId}`, { status: 'completed', progress: 100, message: 'Analysis complete!' });
    
    console.log(`✅ YouTube Video processed successfully: ${videoId}`);
    
  } catch (error) {
    console.error(`❌ YouTube Video processing failed: ${videoId}`, error);
    
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });
    
    if (io) io.emit(`processing:${videoId}`, { status: 'failed', message: 'Processing failed.' });
  }
}

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
exports.getAllVideos = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    const query = { isPublic: true, processingStatus: 'completed' };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    const videos = await Video.find(query)
      .populate('uploadedBy', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-transcript -questions')
      .lean();
    
    const count = await Video.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        videos,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
    
  } catch (error) {
    console.error('Get Videos Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch videos'
    });
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Public
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'username avatar fullName');
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Auto-recovery mechanism for permanently stuck videos (e.g., if server restarted during processing)
    if (video.processingStatus === 'processing' || video.processingStatus === 'pending') {
      const timeSinceUpdate = Date.now() - new Date(video.updatedAt || video.createdAt).getTime();
      const STUCK_TIMEOUT = 25 * 60 * 1000; // 25 minutes
      if (timeSinceUpdate > STUCK_TIMEOUT) {
        video.processingStatus = 'failed';
        video.processingError = 'استغرقت المعالجة وقتاً أطول من المعتاد بسبب ضغط الخوادم أو توقف السيرفر. يرجى المحاولة من جديد.';
        await video.save();
      }
    }
    
    // Only increment views on real visits, not polling calls
    if (req.query.skipView !== 'true') {
      await video.incrementViews();
    }
    
    res.status(200).json({
      status: 'success',
      data: { video }
    });
    
  } catch (error) {
    console.error('Get Video Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch video'
    });
  }
};

// @desc    Get user's uploaded videos
// @route   GET /api/videos/user/my-videos
// @access  Private
exports.getMyVideos = async (req, res) => {
  try {
    const videos = await Video.find({ uploadedBy: req.user.id })
      .sort({ createdAt: -1 })
      .select('-transcript -questions -flashcards -keyPoints')
      .lean();
    
    res.status(200).json({
      status: 'success',
      data: { videos }
    });
    
  } catch (error) {
    console.error('Get My Videos Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your videos'
    });
  }
};

// @desc    Cancel video processing
// @route   POST /api/videos/:id/cancel
// @access  Private
exports.cancelProcessing = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check ownership
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this video'
      });
    }

    if (video.processingStatus !== 'pending' && video.processingStatus !== 'processing') {
      return res.status(400).json({
        status: 'error',
        message: 'Video is not currently processing'
      });
    }
    
    video.processingStatus = 'failed';
    video.processingError = 'تم إيقاف المعالجة بناءً على طلبك.';
    await video.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Processing cancelled'
    });
    
  } catch (error) {
    console.error('Cancel Processing Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel processing'
    });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check ownership
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this video'
      });
    }
    
    // Delete video file (only if it's not a URL)
    if (video.filePath && !video.filePath.startsWith('http')) {
      try {
        await fs.unlink(video.filePath);
      } catch (err) {
        console.error('Failed to delete video file:', err);
      }
    }
    
    // Delete video document
    await Video.findByIdAndDelete(req.params.id);
    
    // Remove from user's uploaded videos
    await User.findByIdAndUpdate(video.uploadedBy, {
      $pull: { uploadedVideos: video._id }
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete Video Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete video'
    });
  }
};

// @desc    Toggle like on video
// @route   POST /api/videos/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    const userIndex = video.likes.indexOf(req.user.id);
    
    if (userIndex > -1) {
      // Unlike
      video.likes.splice(userIndex, 1);
    } else {
      // Like
      video.likes.push(req.user.id);
    }
    
    await video.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        likes: video.likes.length,
        isLiked: userIndex === -1
      }
    });
    
  } catch (error) {
    console.error('Toggle Like Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle like'
    });
  }
};

// @desc    Submit answers for a video quiz
// @route   POST /api/videos/:id/submit-quiz
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // Array of selected options or indices
    const videoId = req.params.id;
    const userId = req.user.id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of answers'
      });
    }

    const video = await Video.findById(videoId).select('questions').lean();

    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }

    if (!video.questions || video.questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'This video does not have a quiz'
      });
    }

    let score = 0;
    const totalQuestions = video.questions.length;
    const results = [];

    // Score the quiz — supports both index-based and text-based answers
    video.questions.forEach((q, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      let userAnswerDisplay = userAnswer;
      const correctIdx = parseInt(q.correctAnswer, 10);
      
      if (typeof userAnswer === 'number' || (typeof userAnswer === 'string' && !isNaN(userAnswer) && userAnswer.trim().length <= 2)) {
        // Index-based: frontend sent the option index
        const answerIdx = parseInt(userAnswer, 10);
        isCorrect = answerIdx === correctIdx;
        userAnswerDisplay = q.options && q.options[answerIdx] ? q.options[answerIdx] : userAnswer;
      } else {
        // Text-based: frontend sent the option text (legacy support)
        const answerIdx = q.options ? q.options.findIndex(opt => String(opt).trim() === String(userAnswer).trim()) : -1;
        isCorrect = answerIdx === correctIdx;
        userAnswerDisplay = userAnswer;
      }
      
      if (isCorrect) score++;

      const correctAnswerDisplay = q.options && q.options[correctIdx] ? q.options[correctIdx] : q.correctAnswer;

      results.push({
        question: q.question,
        userAnswer: userAnswerDisplay,
        correctAnswer: correctAnswerDisplay,
        explanation: q.explanation || '',
        isCorrect
      });
    });

    // Update or push to User's quizResults
    const user = await User.findById(userId);
    
    // Check if user already took this quiz
    const existingResultIndex = user.quizResults.findIndex(
      (r) => r.video.toString() === videoId
    );

    let pointsGained = 0;
    let xpGained = 0;
    
    // --- RPG SKILLS MULTIPLIER ---
    let xpMultiplier = 1;
    if (user.unlockedSkills) {
      if (user.unlockedSkills.includes('focus_master')) xpMultiplier = 1.30;
      else if (user.unlockedSkills.includes('focus_2')) xpMultiplier = 1.15;
      else if (user.unlockedSkills.includes('focus_1')) xpMultiplier = 1.05;
    }

    if (existingResultIndex !== -1) {
      // If score improved, give the difference
      const prevScore = user.quizResults[existingResultIndex].score;
      if (score > prevScore) {
        pointsGained = (score - prevScore) * 100;
        xpGained = Math.round((score - prevScore) * 50 * xpMultiplier);
        user.quizResults[existingResultIndex].score = score;
      }
      user.quizResults[existingResultIndex].dateTaken = Date.now();
      user.quizResults[existingResultIndex].totalQuestions = totalQuestions;
    } else {
      // First attempt
      pointsGained = score * 100;
      xpGained = Math.round(score * 50 * xpMultiplier);
      user.quizResults.push({
        video: videoId,
        score,
        totalQuestions
      });
    }

    if (pointsGained > 0) {
      user.points = (user.points || 0) + pointsGained;
    }
    if (xpGained > 0) {
      const prevLevel = Math.floor((user.xp || 0) / 1000) + 1;
      user.xp = (user.xp || 0) + xpGained;
      
      // Level up: every 1000 XP = 1 level
      const newLevel = Math.floor(user.xp / 1000) + 1;
      user.level = newLevel;
      
      // Award Skill Points
      const levelsGained = newLevel - prevLevel;
      if (levelsGained > 0) {
        user.skillPoints = (user.skillPoints || 0) + levelsGained;
      }
    }

    // === STREAK SYSTEM ===
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastActive === yesterday) {
        user.streakDays = (user.streakDays || 0) + 1;
      } else if (lastActive !== today) {
        user.streakDays = 1; // Reset streak
      }
      user.lastActiveDate = new Date();
    }

    // === BADGE SYSTEM ===
    const hasBadge = (badgeId) => user.badges.some(b => b.id === badgeId);
    // Perfect Score Badge
    if (score === totalQuestions && !hasBadge('perfect_score')) {
      user.badges.push({ id: 'perfect_score', name: '🎯 Perfect Score', icon: '🎯' });
    }
    // First Quiz Badge
    if (user.quizResults.length === 1 && !hasBadge('first_quiz')) {
      user.badges.push({ id: 'first_quiz', name: '🚀 First Quiz', icon: '🚀' });
    }
    // 7-Day Streak Badge
    if (user.streakDays >= 7 && !hasBadge('week_streak')) {
      user.badges.push({ id: 'week_streak', name: '🔥 Week Streak', icon: '🔥' });
    }
    // 30-Day Streak Badge
    if (user.streakDays >= 30 && !hasBadge('month_streak')) {
      user.badges.push({ id: 'month_streak', name: '💎 Month Streak', icon: '💎' });
    }
    // 10 Quizzes Badge
    if (user.quizResults.length >= 10 && !hasBadge('quiz_master')) {
      user.badges.push({ id: 'quiz_master', name: '🏆 Quiz Master', icon: '🏆' });
    }

    // === HIDDEN ACHIEVEMENTS CHECK ===
    const { checkAchievements } = require('../utils/achievements');
    const hiddenUnlocked = checkAchievements(user);
    if (hiddenUnlocked.length > 0) {
      user.badges.push(...hiddenUnlocked);
    }

    await user.save();

    // Calculate level-up info for frontend celebration
    const leveledUp = xpGained > 0 && Math.floor((user.xp - xpGained) / 1000) + 1 < user.level;

    res.status(200).json({
      status: 'success',
      data: {
        score,
        totalQuestions,
        results,
        xpGained,
        totalXp: user.xp,
        level: user.level,
        leveledUp,
        streakDays: user.streakDays,
        newBadges: user.badges.filter(b => {
          const earnedToday = new Date(b.earnedAt).toDateString() === today;
          return earnedToday;
        }),
        skillPoints: user.skillPoints,
        unlockedSkills: user.unlockedSkills
      }
    });

  } catch (error) {
    console.error('Submit Quiz Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit quiz answers'
    });
  }
};

// @desc    Retry AI processing for a failed video
// @route   POST /api/videos/:id/retry-processing
// @access  Private
exports.retryProcessing = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }

    // Check ownership
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    // Allow retrying anytime (regenerates AI content)
    if (video.processingStatus === 'processing') {
      return res.status(400).json({
        status: 'error',
        message: 'Video is already being processed'
      });
    }

    const { instructions, language } = req.body;

    // Reset status and save new instructions if provided
    video.processingStatus = 'pending';
    video.processingError = '';
    if (instructions !== undefined) {
      video.userPrompt = instructions;
    }
    if (language !== undefined) {
      video.preferredLang = language;
    }
    await video.save();

    res.status(200).json({
      status: 'success',
      message: 'Retrying AI processing with instructions...'
    });

    const promptToUse = video.userPrompt;

    // Re-trigger processing asynchronously
    if (video.sourceType === 'pdf') {
      processDocumentAsync(video._id, video.filePath, promptToUse);
    } else if (video.sourceType === 'image') {
      processImageAsync(video._id, video.filePath, promptToUse);
    } else if (video.sourceType === 'pptx') {
      processPPTXAsync(video._id, video.filePath, promptToUse);
    } else {
      const isYouTube = video.originalUrl && (video.originalUrl.includes('youtube.com') || video.originalUrl.includes('youtu.be'));

      if (isYouTube) {
        processYoutubeVideoAsync(video._id, video.originalUrl, req.app.get('io'));
      } else if (video.filePath && !video.filePath.startsWith('http')) {
        processVideoAsync(video._id, video.filePath, promptToUse);
      } else {
        await Video.findByIdAndUpdate(video._id, {
          processingStatus: 'completed',
          summary: 'فيديو من رابط خارجي. يمكنك مشاهدته عبر الرابط المرفق.',
          keyPoints: ['الفيديو متاح للمشاهدة', 'تم الرفع من رابط خارجي'],
        });
      }
    }

  } catch (error) {
    console.error('Retry Processing Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retry processing'
    });
  }
};

// @desc    Regenerate a specific AI component (mindMap, quiz, etc.)
// @route   POST /api/videos/:id/regenerate-component
// @access  Private
exports.regenerateComponent = async (req, res) => {
  try {
    const { component, instructions } = req.body;
    if (!component) {
      return res.status(400).json({ status: 'error', message: 'Component name is required' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ status: 'error', message: 'Video not found' });
    }

    // Check ownership
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    if (!video.transcript || video.transcript.length < 50) {
      return res.status(400).json({ status: 'error', message: 'Transcript not available. Please retry full processing.' });
    }

    const openaiService = require('../services/openaiService');
    const userPrompt = instructions || video.userPrompt;
    const preferredLang = video.preferredLang;
    const title = video.title;

    console.log(`🔄 Regenerating ${component} for video ${video._id}...`);

    let result;
    let updateField;
    if (component === 'mindMap' || component === 'keyPoints') {
      result = await openaiService.extractKeyPoints(video.transcript, userPrompt, title, preferredLang);
      updateField = 'keyPoints';
    } else if (component === 'quiz' || component === 'questions') {
      result = await openaiService.generateQuestions(video.transcript, userPrompt, title, preferredLang);
      updateField = 'questions';
    } else if (component === 'summary') {
      result = await openaiService.generateSummary(video.transcript, userPrompt, title, preferredLang);
      updateField = 'summary';
    } else if (component === 'description') {
      result = await openaiService.generateDetailedDescription(video.transcript, userPrompt, title, preferredLang);
      updateField = 'description';
    } else if (component === 'flashcards') {
      result = await openaiService.generateFlashcards(video.transcript, userPrompt, title, preferredLang);
      updateField = 'flashcards';
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid component name' });
    }

    // Use atomic update to avoid Mongoose VersionError from concurrent requests
    await Video.findByIdAndUpdate(req.params.id, { $set: { [updateField]: result } });

    res.status(200).json({
      status: 'success',
      message: `${component} regenerated successfully`,
      data: { [updateField]: result }
    });

  } catch (error) {
    console.error(`Regenerate ${req.body.component} Error:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to regenerate ${req.body.component}`
    });
  }
};

// @desc    Chat with video — ask AI questions about video content
// @route   POST /api/videos/:id/chat
// @access  Private
exports.chatWithVideo = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    // Check chat quota
    const quota = await checkQuota(req.user.id, 'chat');
    if (!quota.allowed) {
      return res.status(403).json({
        status: 'error',
        message: 'You have reached your daily AI chat limit. Please upgrade your plan.',
        upgradeRequired: true,
        usage: { current: quota.current, limit: quota.limit, plan: quota.plan }
      });
    }
    // Track chat usage
    Usage.incrementCounter(req.user.id, 'aiChatMessages').catch(e => {});

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ status: 'error', message: 'Video not found' });
    }

    // If transcript is too short, we can still chat using title and description as fallback
    const chatContext = video.transcript && video.transcript.length >= 50 
      ? video.transcript 
      : `${video.title || ''}\n${video.description || ''}`;

    if (!chatContext.trim() || chatContext.trim().length < 5) {
      return res.status(400).json({ status: 'error', message: 'Not enough video context available for chat' });
    }

    const openaiService = require('../services/openaiService');
    const reply = await openaiService.chatWithVideo(video.transcript, message, video.title);

    res.status(200).json({
      status: 'success',
      data: { reply }
    });
  } catch (error) {
    console.error('Chat with video error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to chat with video' });
  }
};

// @desc    Get user's personal notes for a specific video
// @route   GET /api/videos/:id/notes
// @access  Private
exports.getPersonalNotes = async (req, res) => {
  try {
    const note = await Note.findOne({ user: req.user.id, video: req.params.id });
    res.status(200).json({
      status: 'success',
      data: { note: note ? note.content : '' }
    });
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get notes' });
  }
};

// @desc    Save user's personal notes for a specific video
// @route   POST /api/videos/:id/notes
// @access  Private
exports.savePersonalNotes = async (req, res) => {
  try {
    const { content } = req.body;
    let note = await Note.findOne({ user: req.user.id, video: req.params.id });
    
    if (note) {
      note.content = content;
      await note.save();
    } else {
      note = await Note.create({ user: req.user.id, video: req.params.id, content });
    }

    res.status(200).json({
      status: 'success',
      data: { note: note.content }
    });
  } catch (error) {
    console.error('Save Notes Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save notes' });
  }
};

// @desc    Upload and process Document (PDF, Word, Excel, PPT, Text)
// @route   POST /api/videos/upload-doc
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    const { title, category, prompt } = req.body;

    // Check quota before processing
    const quota = await checkQuota(req.user.id, 'video');
    if (!quota.allowed) {
      if (req.file) try { await fs.unlink(req.file.path); } catch (e) {}
      return res.status(403).json({
        status: 'error',
        message: 'You have reached your monthly upload limit. Please upgrade your plan.',
        upgradeRequired: true,
        usage: { current: quota.current, limit: quota.limit, plan: quota.plan }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a document file'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const finalTitle = title || path.basename(req.file.originalname, ext);

    const video = await Video.create({
      title: finalTitle,
      description: '',
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      sourceType: ext.replace('.', '') || 'document',
      uploadedBy: req.user.id,
      category: category || 'other',
      userPrompt: prompt || '',
      processingStatus: 'pending'
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploadedVideos: video._id }
    });

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded! AI is analyzing the content...',
      data: { video }
    });

    processDocumentAsync(video._id, req.file.path, prompt);

  } catch (error) {
    console.error('Upload Document Error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document'
    });
  }
};

// @desc    Upload and process Image
// @route   POST /api/videos/upload-image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    const { title, category, prompt } = req.body;

    // Check quota before processing
    const quota = await checkQuota(req.user.id, 'video');
    if (!quota.allowed) {
      if (req.file) try { await fs.unlink(req.file.path); } catch (e) {}
      return res.status(403).json({
        status: 'error',
        message: 'You have reached your monthly upload limit. Please upgrade your plan.',
        upgradeRequired: true,
        usage: { current: quota.current, limit: quota.limit, plan: quota.plan }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file'
      });
    }

    const ext = path.extname(req.file.originalname);
    const finalTitle = title || path.basename(req.file.originalname, ext);

    const video = await Video.create({
      title: finalTitle,
      description: '',
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      sourceType: 'image',
      uploadedBy: req.user.id,
      category: category || 'other',
      userPrompt: prompt || '',
      processingStatus: 'pending'
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploadedVideos: video._id }
    });

    res.status(201).json({
      status: 'success',
      message: 'Image uploaded! AI is analyzing the content...',
      data: { video }
    });

    processImageAsync(video._id, req.file.path, prompt);

  } catch (error) {
    console.error('Upload Image Error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload image'
    });
  }
};

// @desc    Upload and process PowerPoint
// @route   POST /api/videos/upload-pptx
// @access  Private
exports.uploadPPTX = async (req, res) => {
  try {
    const { title, category, prompt } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a PowerPoint file'
      });
    }

    const ext = path.extname(req.file.originalname);
    const finalTitle = title || path.basename(req.file.originalname, ext);

    const video = await Video.create({
      title: finalTitle,
      description: '',
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      sourceType: 'pptx',
      uploadedBy: req.user.id,
      category: category || 'other',
      userPrompt: prompt || '',
      processingStatus: 'pending'
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploadedVideos: video._id }
    });

    res.status(201).json({
      status: 'success',
      message: 'PowerPoint uploaded! AI is analyzing the content...',
      data: { video }
    });

    processPPTXAsync(video._id, req.file.path, prompt);

  } catch (error) {
    console.error('Upload PPTX Error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload PowerPoint'
    });
  }
};

// Async Document processing function (PDF, Word, Excel, PPT, Text)
async function processDocumentAsync(videoId, docPath, userPrompt = '') {
  try {
    console.log(`📄 Processing Document: ${videoId}`);
    await Video.findByIdAndUpdate(videoId, { processingStatus: 'processing' });

    const ext = path.extname(docPath).toLowerCase();
    let transcript = '';
    let duration = 0; // used for page count or length indicator

    if (ext === '.pdf') {
      const { PDFParse } = require('pdf-parse');
      const pdfBuffer = await fs.readFile(docPath);
      const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
      const pdfData = await parser.getText();
      transcript = pdfData.text;
      duration = pdfData.pages?.length || pdfData.total || 0;
      await parser.destroy().catch(() => {});
    } else if (['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'].includes(ext)) {
      const officeparser = require('officeparser');
      transcript = await officeparser.parseOfficeAsync(docPath);
      // Heuristic for "duration" in office docs could be word count / 200 or just 1
      duration = 1; 
    } else if (['.txt', '.rtf', '.html', '.htm'].includes(ext)) {
      transcript = await fs.readFile(docPath, 'utf8');
      // Simple HTML tag removal if it's HTML
      if (ext.startsWith('.htm')) {
        transcript = transcript.replace(/<[^>]*>?/gm, '');
      }
      duration = 1;
    }

    if (!transcript || transcript.trim().length < 20) {
      throw new Error(`Insufficient text content in ${ext} for AI analysis.`);
    }

    console.log(`📄 Document text extracted: ${transcript.length} chars (Type: ${ext})`);

    const openaiService = require('../services/openaiService');
    const video = await Video.findById(videoId);
    const title = video?.title || '';
    const preferredLang = video?.preferredLang || '';

    console.log('⚡ Running AI generation concurrently for document...');

    // BATCH 1: Description + Summary (parallel)
    const [descResult, summResult] = await Promise.allSettled([
      openaiService.generateDetailedDescription(transcript, userPrompt, title, preferredLang),
      openaiService.generateSummary(transcript, userPrompt, title, preferredLang),
    ]);
    const description = descResult.status === 'fulfilled' ? descResult.value : 'حدث خطأ أثناء إنشاء الشرح المفصل.';
    const summary = summResult.status === 'fulfilled' ? summResult.value : 'حدث خطأ أثناء إنشاء الملخص.';

    await new Promise(r => setTimeout(r, 2000));

    // BATCH 2: Key Points + Flashcards (parallel)
    const [kpResult, fcResult] = await Promise.allSettled([
      openaiService.extractKeyPoints(transcript, userPrompt, title, preferredLang),
      openaiService.generateFlashcards(transcript, userPrompt, title, preferredLang),
    ]);
    const keyPoints = kpResult.status === 'fulfilled' ? kpResult.value : ['حدث خطأ أثناء استخراج النقاط الرئيسية'];
    const flashcards = fcResult.status === 'fulfilled' ? fcResult.value : openaiService.generateDefaultFlashcards();

    await new Promise(r => setTimeout(r, 2000));

    // BATCH 3: Questions (heaviest — solo)
    let questions;
    try {
      questions = await openaiService.generateQuestions(transcript, userPrompt, title, preferredLang);
    } catch (e) {
      console.error('❌ Questions failed:', e.message);
      questions = openaiService.generateDefaultQuestions();
    }

    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'completed',
      transcript: transcript.substring(0, 50000),
      description,
      summary,
      keyPoints,
      questions,
      flashcards,
      duration: duration,
      aiModel: 'llama-3.3-70b'
    });

    console.log(`✅ Document processed successfully: ${videoId}`);
  } catch (error) {
    console.error(`❌ Document processing failed: ${videoId}`, error);
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });
  }
}

// Async Image processing function
async function processImageAsync(videoId, imagePath, userPrompt = '') {
  try {
    console.log(`🖼️ Processing Image: ${videoId}`);
    await Video.findByIdAndUpdate(videoId, { processingStatus: 'processing' });

    const openaiService = require('../services/openaiService');

    // Analyze image with vision AI
    const imageAnalysis = await openaiService.analyzeImage(imagePath, userPrompt);

    if (!imageAnalysis || imageAnalysis.length < 20) {
      throw new Error('Image analysis returned insufficient content.');
    }

    console.log(`🖼️ Image analyzed: ${imageAnalysis.length} chars`);

    // Use the analysis text to generate structured content
    const video = await Video.findById(videoId);
    const title = video?.title || '';
    const preferredLang = video?.preferredLang || '';
    
    const description = imageAnalysis;
    const summary = await openaiService.generateSummary(imageAnalysis, userPrompt, title, preferredLang);
    const keyPoints = await openaiService.extractKeyPoints(imageAnalysis, userPrompt, title, preferredLang);
    const questions = await openaiService.generateQuestions(imageAnalysis, userPrompt, title, preferredLang);

    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'completed',
      transcript: imageAnalysis.substring(0, 50000),
      description,
      summary,
      keyPoints,
      questions,
      aiModel: 'llama-3.2-90b-vision'
    });

    console.log(`✅ Image processed successfully: ${videoId}`);
  } catch (error) {
    console.error(`❌ Image processing failed: ${videoId}`, error);
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });
  }
}

// Async PPTX processing function
async function processPPTXAsync(videoId, pptxPath, userPrompt = '') {
  try {
    console.log(`📊 Processing PPTX: ${videoId}`);
    await Video.findByIdAndUpdate(videoId, { processingStatus: 'processing' });

    // Extract text from PPTX using officeparser
    const officeparser = require('officeparser');
    const transcript = await officeparser.parseOfficeAsync(pptxPath);

    if (!transcript || transcript.trim().length < 50) {
      throw new Error('PowerPoint has insufficient text content for AI analysis.');
    }

    console.log(`📊 PPTX text extracted: ${transcript.length} chars`);

    const openaiService = require('../services/openaiService');
    const video = await Video.findById(videoId);
    const title = video?.title || '';
    const preferredLang = video?.preferredLang || '';

    console.log('⚡ Running AI generation concurrently for PPTX...');

    // BATCH 1: Description + Summary (parallel)
    const [descResult, summResult] = await Promise.allSettled([
      openaiService.generateDetailedDescription(transcript, userPrompt, title, preferredLang),
      openaiService.generateSummary(transcript, userPrompt, title, preferredLang),
    ]);
    const description = descResult.status === 'fulfilled' ? descResult.value : 'حدث خطأ أثناء إنشاء الشرح المفصل.';
    const summary = summResult.status === 'fulfilled' ? summResult.value : 'حدث خطأ أثناء إنشاء الملخص.';

    await new Promise(r => setTimeout(r, 2000));

    // BATCH 2: Key Points + Flashcards (parallel)
    const [kpResult, fcResult] = await Promise.allSettled([
      openaiService.extractKeyPoints(transcript, userPrompt, title, preferredLang),
      openaiService.generateFlashcards(transcript, userPrompt, title, preferredLang),
    ]);
    const keyPoints = kpResult.status === 'fulfilled' ? kpResult.value : ['حدث خطأ أثناء استخراج النقاط الرئيسية'];
    const flashcards = fcResult.status === 'fulfilled' ? fcResult.value : openaiService.generateDefaultFlashcards();

    await new Promise(r => setTimeout(r, 2000));

    // BATCH 3: Questions (heaviest — solo)
    let questions;
    try {
      questions = await openaiService.generateQuestions(transcript, userPrompt, title, preferredLang);
    } catch (e) {
      console.error('❌ Questions failed:', e.message);
      questions = openaiService.generateDefaultQuestions();
    }

    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'completed',
      transcript: transcript.substring(0, 50000),
      description,
      summary,
      keyPoints,
      questions,
      flashcards,
      aiModel: 'llama-3.3-70b'
    });

    console.log(`✅ PPTX processed successfully: ${videoId}`);
  } catch (error) {
    console.error(`❌ PPTX processing failed: ${videoId}`, error);
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });
  }
}

// @desc    Generate audio for AI chat responses
// @route   POST /api/videos/chat/audio
// @access  Private
exports.generateChatAudio = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ status: 'error', message: 'Text is required for audio generation' });
    }
    const openaiService = require('../services/openaiService');
    const audioBuffer = await openaiService.generateSpeech(text);
    
    // Convert ArrayBuffer to Node Buffer
    const buffer = Buffer.from(audioBuffer);
    
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Generate Audio Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate audio' });
  }
}

// @desc    Get due flashcards for review (SRS)
// @route   GET /api/videos/flashcards/due
// @access  Private
exports.getDueFlashcards = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Find all cards that are due for review
    const dueProgress = await FlashcardProgress.find({
      user: userId,
      nextReviewDate: { $lte: now }
    }).sort({ nextReviewDate: 1 }).limit(20).lean();

    // Also find videos that have flashcards but no progress (new cards)
    const reviewedVideoCardPairs = await FlashcardProgress.find({ user: userId }).select('video cardIndex').lean();
    const reviewedMap = new Set(reviewedVideoCardPairs.map(p => `${p.video}_${p.cardIndex}`));

    // Get user's videos with flashcards
    const user = await User.findById(userId).select('uploadedVideos').lean();
    const userVideoIds = user?.uploadedVideos || [];

    const videosWithFlashcards = await Video.find({
      _id: { $in: userVideoIds },
      flashcards: { $exists: true, $not: { $size: 0 } }
    }).select('title flashcards').lean();

    const newCards = [];
    for (const video of videosWithFlashcards) {
      if (!video.flashcards) continue;
      video.flashcards.forEach((card, index) => {
        const key = `${video._id}_${index}`;
        if (!reviewedMap.has(key)) {
          newCards.push({
            videoId: video._id,
            videoTitle: video.title,
            cardIndex: index,
            front: card.front,
            back: card.back,
            isNew: true
          });
        }
      });
    }

    // Merge due cards with their flashcard content
    const dueCards = [];
    for (const prog of dueProgress) {
      const video = await Video.findById(prog.video).select('title flashcards').lean();
      if (video && video.flashcards && video.flashcards[prog.cardIndex]) {
        dueCards.push({
          videoId: video._id,
          videoTitle: video.title,
          cardIndex: prog.cardIndex,
          front: video.flashcards[prog.cardIndex].front,
          back: video.flashcards[prog.cardIndex].back,
          isNew: false,
          interval: prog.interval,
          repetitions: prog.repetitions
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        dueCards: [...dueCards, ...newCards.slice(0, 10)],
        totalDue: dueCards.length,
        totalNew: newCards.length
      }
    });
  } catch (error) {
    console.error('Get Due Flashcards Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get due flashcards' });
  }
};

// @desc    Review a flashcard (SM-2 Algorithm)
// @route   POST /api/videos/flashcards/review
// @access  Private
exports.reviewFlashcard = async (req, res) => {
  try {
    const { videoId, cardIndex, quality } = req.body;
    // quality: 0-5 (0=blackout, 1=wrong, 2=hard, 3=good, 4=easy, 5=perfect)
    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ status: 'error', message: 'Quality must be between 0-5' });
    }

    let progress = await FlashcardProgress.findOne({
      user: req.user.id,
      video: videoId,
      cardIndex
    });

    if (!progress) {
      progress = new FlashcardProgress({
        user: req.user.id,
        video: videoId,
        cardIndex
      });
    }

    // SM-2 Algorithm Implementation
    let { easeFactor, interval, repetitions } = progress;

    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Incorrect response — reset
      repetitions = 0;
      interval = 1;
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    progress.easeFactor = easeFactor;
    progress.interval = interval;
    progress.repetitions = repetitions;
    progress.lastReviewDate = new Date();
    progress.nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    await progress.save();

    // Award XP for reviewing
    const user = await User.findById(req.user.id);
    
    // --- RPG SKILLS MEMORY BONUS ---
    let memXp = 10;
    if (user.unlockedSkills && user.unlockedSkills.includes('memory_1')) {
      memXp = 30; // Triples flashcard XP
    }
    
    const prevLevel = Math.floor((user.xp || 0) / 1000) + 1;
    user.xp = (user.xp || 0) + memXp;
    const newLevel = Math.floor(user.xp / 1000) + 1;
    user.level = newLevel;
    
    const levelsGained = newLevel - prevLevel;
    if (levelsGained > 0) {
      user.skillPoints = (user.skillPoints || 0) + levelsGained;
    }
    
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        nextReviewDate: progress.nextReviewDate,
        interval: progress.interval,
        easeFactor: progress.easeFactor,
        xpGained: memXp
      }
    });
  } catch (error) {
    console.error('Review Flashcard Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to review flashcard' });
  }
};

// @desc    Export flashcards as Anki-compatible CSV
// @route   GET /api/videos/export-anki/:id
// @access  Private
exports.exportAnkiCSV = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).lean();
    if (!video) return res.status(404).json({ status: 'error', message: 'Video not found' });

    if (!video.flashcards || video.flashcards.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No flashcards available for this video' });
    }

    // Anki CSV format: front\tback (tab-separated)
    const header = '#separator:tab\n#html:true\n#deck:EduVisionAI - ' + (video.title || 'Flashcards').replace(/[,\n\r]/g, ' ') + '\n';
    const rows = video.flashcards.map(fc => {
      const front = (fc.front || fc.question || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const back = (fc.back || fc.answer || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
      return `${front}\t${back}`;
    }).join('\n');

    const csv = header + rows;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="EduVisionAI_Flashcards_${req.params.id}.txt"`);
    res.send(csv);
  } catch (error) {
    console.error('Anki Export Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to export flashcards' });
  }
};

// @desc    AI Study Coach — personalized study recommendations
// @route   GET /api/videos/study-coach
// @access  Private
exports.getStudyCoach = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const videos = await Video.find({ uploadedBy: req.user.id }).select('title questions processingStatus').lean();

    const quizResults = user.quizResults || [];
    const totalQuizzes = quizResults.length;
    const avgAccuracy = totalQuizzes > 0
      ? Math.round(quizResults.reduce((sum, q) => sum + (q.score / q.totalQuestions) * 100, 0) / totalQuizzes)
      : 0;

    // Find weak areas (quizzes with < 60% accuracy)
    const weakVideos = [];
    for (const qr of quizResults) {
      const accuracy = (qr.score / qr.totalQuestions) * 100;
      if (accuracy < 60) {
        const vid = videos.find(v => v._id.toString() === qr.video.toString());
        if (vid) weakVideos.push({ videoId: vid._id, title: vid.title, accuracy: Math.round(accuracy) });
      }
    }

    // Find videos with no quiz attempt
    const attemptedVideoIds = quizResults.map(q => q.video.toString());
    const unattempted = videos
      .filter(v => v.questions?.length > 0 && !attemptedVideoIds.includes(v._id.toString()) && v.processingStatus === 'completed')
      .map(v => ({ videoId: v._id, title: v.title }))
      .slice(0, 5);

    // Generate recommendations
    const recommendations = [];

    if (weakVideos.length > 0) {
      recommendations.push({
        type: 'retry',
        priority: 'high',
        message: `You scored below 60% on ${weakVideos.length} quiz(es). Retry them to strengthen your understanding.`,
        items: weakVideos.slice(0, 3),
      });
    }

    if (unattempted.length > 0) {
      recommendations.push({
        type: 'new_quiz',
        priority: 'medium',
        message: `You have ${unattempted.length} video(s) with untaken quizzes. Test your knowledge!`,
        items: unattempted,
      });
    }

    if (user.streakDays < 3) {
      recommendations.push({
        type: 'streak',
        priority: 'low',
        message: `Your streak is only ${user.streakDays || 0} day(s). Study daily to build momentum!`,
        items: [],
      });
    }

    if (totalQuizzes >= 5 && avgAccuracy >= 80) {
      recommendations.push({
        type: 'praise',
        priority: 'info',
        message: `Amazing! Your average accuracy is ${avgAccuracy}%. Keep pushing to maintain your edge.`,
        items: [],
      });
    }

    res.json({
      status: 'success',
      data: {
        stats: { totalQuizzes, avgAccuracy, streakDays: user.streakDays || 0, level: user.level || 1 },
        recommendations,
        weakAreas: weakVideos.slice(0, 5),
        unattempted: unattempted,
      }
    });
  } catch (error) {
    console.error('Study Coach Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load study coach' });
  }
};

// @desc    Get all achievements with unlock status
// @route   GET /api/videos/achievements
// @access  Private
exports.getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const { HIDDEN_ACHIEVEMENTS } = require('../utils/achievements');
    const unlockedIds = (user.badges || []).map(b => b.id);

    const achievements = HIDDEN_ACHIEVEMENTS.map(a => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      description: a.description,
      unlocked: unlockedIds.includes(a.id),
      earnedAt: user.badges?.find(b => b.id === a.id)?.earnedAt || null,
    }));

    res.json({
      status: 'success',
      data: {
        total: achievements.length,
        unlocked: achievements.filter(a => a.unlocked).length,
        achievements,
      }
    });
  } catch (error) {
    console.error('Achievements Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load achievements' });
  }
};

// =====================================================
// SPACED REPETITION SYSTEM (SRS) — SM-2 Algorithm
// =====================================================

// @desc    Get all flashcards due for review today
// @route   GET /api/videos/flashcards/due
// @access  Private
exports.getDueFlashcards = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 1. Get all due progress records
    const dueProgress = await FlashcardProgress.find({
      user: userId,
      nextReviewDate: { $lte: now }
    }).sort({ nextReviewDate: 1 }).lean();

    // 2. Get all videos the user has accessed (with flashcards)
    const userVideos = await Video.find({
      uploadedBy: userId,
      processingStatus: 'completed',
      'flashcards.0': { $exists: true }
    }).select('_id title flashcards sourceType').lean();

    // 3. Build set of already-tracked card keys
    const trackedKeys = new Set(
      dueProgress.map(p => `${p.video}_${p.cardIndex}`)
    );

    // 4. Find NEW (unreviewed) cards from user's videos
    const newCards = [];
    for (const video of userVideos) {
      (video.flashcards || []).forEach((fc, idx) => {
        const key = `${video._id}_${idx}`;
        if (!trackedKeys.has(key)) {
          newCards.push({
            video: video._id,
            videoTitle: video.title,
            sourceType: video.sourceType,
            cardIndex: idx,
            front: fc.front,
            back: fc.back,
            isNew: true,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0
          });
        }
      });
    }

    // 5. Enrich due progress with card content
    const videoMap = {};
    for (const v of userVideos) videoMap[v._id.toString()] = v;

    const dueCards = dueProgress.map(p => {
      const v = videoMap[p.video.toString()];
      if (!v || !v.flashcards[p.cardIndex]) return null;
      return {
        video: p.video,
        videoTitle: v.title,
        sourceType: v.sourceType,
        cardIndex: p.cardIndex,
        front: v.flashcards[p.cardIndex].front,
        back: v.flashcards[p.cardIndex].back,
        isNew: false,
        easeFactor: p.easeFactor,
        interval: p.interval,
        repetitions: p.repetitions,
        lastReviewDate: p.lastReviewDate
      };
    }).filter(Boolean);

    // 6. Combine: due cards first, then new cards (limit to 30 max per session)
    const allCards = [...dueCards, ...newCards].slice(0, 30);

    res.json({
      status: 'success',
      data: {
        totalDue: dueCards.length,
        totalNew: newCards.length,
        cards: allCards
      }
    });
  } catch (error) {
    console.error('Get Due Flashcards Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch due flashcards' });
  }
};

// @desc    Submit a flashcard review (SM-2 algorithm)
// @route   POST /api/videos/flashcards/review
// @access  Private
// @body    { videoId, cardIndex, quality } — quality: 0-5
exports.reviewFlashcard = async (req, res) => {
  try {
    const { videoId, cardIndex, quality } = req.body;
    const userId = req.user.id;

    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ status: 'error', message: 'Quality must be 0-5' });
    }

    // Find or create progress record
    let progress = await FlashcardProgress.findOne({
      user: userId, video: videoId, cardIndex
    });

    if (!progress) {
      progress = new FlashcardProgress({
        user: userId, video: videoId, cardIndex,
        easeFactor: 2.5, interval: 0, repetitions: 0
      });
    }

    // ============== SM-2 Algorithm ==============
    const q = Math.round(quality);

    if (q < 3) {
      // Failed — reset repetitions, short interval
      progress.repetitions = 0;
      progress.interval = 0;
    } else {
      // Success — advance
      if (progress.repetitions === 0) {
        progress.interval = 1; // 1 day
      } else if (progress.repetitions === 1) {
        progress.interval = 3; // 3 days
      } else {
        progress.interval = Math.round(progress.interval * progress.easeFactor);
      }
      progress.repetitions += 1;
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    progress.easeFactor = Math.max(1.3, progress.easeFactor + efDelta);

    // Set next review date
    const nextDate = new Date();
    if (progress.interval === 0) {
      // Review again in 10 minutes (same session)
      nextDate.setMinutes(nextDate.getMinutes() + 10);
    } else {
      nextDate.setDate(nextDate.getDate() + progress.interval);
    }
    progress.nextReviewDate = nextDate;
    progress.lastReviewDate = new Date();

    await progress.save();

    // Award XP for reviewing
    await User.findByIdAndUpdate(userId, {
      $inc: { xp: q >= 3 ? 15 : 5, points: q >= 3 ? 15 : 5 }
    });

    res.json({
      status: 'success',
      data: {
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
        nextReviewDate: progress.nextReviewDate,
        xpEarned: q >= 3 ? 15 : 5
      }
    });
  } catch (error) {
    console.error('Review Flashcard Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save review' });
  }
};