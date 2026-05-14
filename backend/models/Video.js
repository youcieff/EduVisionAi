const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  originalUrl: {
    type: String,
    trim: true
  },
  sourceType: {
    type: String,
    enum: ['video', 'youtube', 'pdf', 'image', 'pptx'],
    default: 'video'
  },
  filePath: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  duration: {
    type: Number // in seconds
  },
  thumbnail: {
    type: String,
    default: '/uploads/thumbnails/default.jpg'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // AI Processing Results
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingStartedAt: {
    type: Date
  },
  transcript: {
    type: String,
    default: ''
  },
  userPrompt: { type: String, default: '' },
  preferredLang: { type: String, default: '' },
  summary: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }],
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String
    }],
    correctAnswer: {
      type: String
    },
    explanation: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  
  // AI-generated flashcards (concept/formula cards)
  flashcards: [{
    front: { type: String, required: true },
    back: { type: String, required: true }
  }],
  
  // Sub-videos (clips)
  subVideos: [{
    title: {
      type: String,
      required: true
    },
    startTime: {
      type: Number,
      required: true
    },
    endTime: {
      type: Number,
      required: true
    },
    summary: {
      type: String
    },
    filePath: {
      type: String
    }
  }],
  
  // Metadata
  category: {
    type: String,
    enum: ['science', 'technology', 'mathematics', 'history', 'language', 'arts', 'business', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Processing metadata
  aiModel: {
    type: String,
    default: 'gpt-4'
  },
  processingTime: {
    type: Number // in seconds
  },
  processingError: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better search performance
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ uploadedBy: 1, createdAt: -1 });
videoSchema.index({ processingStatus: 1 });

// Virtual for like count
videoSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to increment views
videoSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
