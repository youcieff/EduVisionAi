const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const OpenAIService = require('./openaiService');
const youtubedl = require('youtube-dl-exec');

class VideoProcessingService {
  async extractAudio(videoPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .on('end', () => {
          console.log('✅ Audio extracted successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Audio extraction error:', err);
          reject(new Error('Failed to extract audio'));
        })
        .save(outputPath);
    });
  }

  async getYouTubeMetadata(url) {
    try {
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com', 
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
      });
      return {
        title: info.title,
        description: info.description,
        thumbnails: info.thumbnails,
        duration: parseInt(info.duration, 10),
      };
    } catch (error) {
      console.error('❌ Failed to get YouTube metadata:', error);
      throw new Error('Invalid YouTube URL or unable to fetch metadata');
    }
  }

  async downloadYouTubeAudio(url, outputPath) {
    return new Promise((resolve, reject) => {
      console.log(`🎵 Downloading audio from YouTube: ${url}`);
      youtubedl(url, {
        output: outputPath,
        extractAudio: true,
        audioFormat: 'mp3',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com', 
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
      }).then(output => {
        console.log('✅ YouTube audio downloaded successfully');
        resolve(outputPath);
      }).catch(err => {
        console.error('❌ YouTube download stream error:', err);
        reject(new Error('Failed to download YouTube audio stream'));
      });
    });
  }

  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            format: metadata.format.format_name,
          });
        }
      });
    });
  }

  async generateThumbnail(videoPath, outputPath, timestamp = '00:00:01') {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x240',
        })
        .on('end', () => {
          console.log('✅ Thumbnail generated');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Thumbnail error:', err);
          reject(err);
        });
    });
  }

  async createVideoClip(videoPath, outputPath, startTime, duration) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Clip created: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Clip creation error:', err);
          reject(err);
        })
        .run();
    });
  }

  async processVideoWithAI(videoPath, videoId) {
    try {
      console.log('🎬 Starting AI processing...');
      
      const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
      
      // Extract audio
      console.log('🎵 Extracting audio...');
      await this.extractAudio(videoPath, audioPath);
      
      // Transcribe
      console.log('📝 Transcribing audio...');
      const transcript = await OpenAIService.transcribeAudio(audioPath);
      
      // Generate detailed description
      console.log('📄 Generating detailed description...');
      const description = await OpenAIService.generateDetailedDescription(transcript);
      
      // Generate summary
      console.log('📊 Generating summary...');
      const summary = await OpenAIService.generateSummary(transcript);
      
      // Extract key points
      console.log('🔑 Extracting key points...');
      const keyPoints = await OpenAIService.extractKeyPoints(transcript);
      
      // Generate questions
      console.log('❓ Generating questions...');
      const questions = await OpenAIService.generateQuestions(transcript);
      
      console.log('✅ AI processing completed successfully!');
      
      return {
        transcript,
        description,
        summary,
        keyPoints,
        questions,
      };
    } catch (error) {
      console.error('❌ AI processing error:', error);
      throw error;
    }
  }

  async generateSubVideos(videoPath, duration, outputDir) {
    try {
      const segmentDuration = 300; // 5 minutes
      const numSegments = Math.ceil(duration / segmentDuration);
      const subVideos = [];

      for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentDuration;
        const segmentPath = path.join(
          outputDir,
          `segment_${i + 1}.mp4`
        );

        await this.createVideoClip(
          videoPath,
          segmentPath,
          startTime,
          segmentDuration
        );

        subVideos.push({
          title: `Part ${i + 1}`,
          filePath: segmentPath,
          startTime,
          duration: Math.min(segmentDuration, duration - startTime),
        });
      }

      console.log(`✅ Created ${subVideos.length} sub-videos`);
      return subVideos;
    } catch (error) {
      console.error('❌ Sub-video generation error:', error);
      return [];
    }
  }
}

module.exports = new VideoProcessingService();