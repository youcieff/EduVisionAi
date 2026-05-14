require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

const videoProcessingService = require('./services/videoProcessingService');

async function downloadYouTubeAudio(youtubeUrl, outputPath) {
  return videoProcessingService.downloadYouTubeAudio(youtubeUrl, outputPath);
}

async function test() {
  const videoId = 'CQGsaAW7jcM';
  const youtubeUrl = 'https://youtu.be/CQGsaAW7jcM';
  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  
  const audioOutputPath = path.join(uploadsDir, `yt_audio_${videoId}.mp3`);
  
  try {
    console.log('1. Downloading...');
    await downloadYouTubeAudio(youtubeUrl, audioOutputPath);
    
    let actualPath = null;
    if (fs.existsSync(audioOutputPath)) actualPath = audioOutputPath;
    else if (fs.existsSync(audioOutputPath + '.mp3')) actualPath = audioOutputPath + '.mp3';
    
    if (!actualPath) {
      const files = fs.readdirSync(uploadsDir).filter(f => f.includes(`yt_audio_${videoId}`));
      if (files.length > 0) actualPath = path.join(uploadsDir, files[0]);
    }
    
    console.log('2. File saved to:', actualPath);
    const fileStat = fs.statSync(actualPath);
    console.log(`Size: ${(fileStat.size / (1024 * 1024)).toFixed(1)} MB`);
    
    console.log('3. Getting duration...');
    const audioDuration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(actualPath, (err, metadata) => {
        if (err) {
          console.error('ffprobe error:', err);
          return resolve(2700);
        }
        resolve(Math.ceil(metadata.format.duration || 2700));
      });
    });
    console.log(`Duration: ${Math.round(audioDuration / 60)} minutes`);
    
    const CHUNK_DURATION = 900;
    const chunkPath = path.join(uploadsDir, `yt_audio_${videoId}_chunk0.mp3`);
    
    console.log('4. Extracting first chunk...');
    await new Promise((resolve, reject) => {
      ffmpeg(actualPath)
        .setStartTime(0)
        .setDuration(CHUNK_DURATION)
        .toFormat('mp3')
        .audioBitrate('64k')
        .on('end', () => resolve())
        .on('error', (err) => {
          console.error('ffmpeg split error:', err);
          reject(err);
        })
        .save(chunkPath);
    });
    
    const chunkSize = fs.statSync(chunkPath).size / (1024 * 1024);
    console.log(`Chunk 0 size: ${chunkSize.toFixed(1)} MB`);
    
    console.log('5. Transcribing chunk 0...');
    const openaiService = require('./services/openaiService');
    const chunkTranscript = await openaiService.transcribeAudio(chunkPath);
    console.log('Transcript length:', chunkTranscript.length);
    console.log('Preview:', chunkTranscript.substring(0, 100));
    
    console.log('✅ Pipeline test complete');
    
  } catch (err) {
    fs.writeFileSync('debug.log', err.stack || err.message, 'utf8');
    console.error('❌ Pipeline failed, see debug.log');
  }
}

test();
