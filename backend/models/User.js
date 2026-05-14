const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  fullName: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  university: {
    type: String,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  uploadedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  points: {
    type: Number,
    default: 0,
    index: -1 // To easily sort for leaderboard
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  skillPoints: {
    type: Number,
    default: 0
  },
  unlockedSkills: [{
    type: String
  }],
  badges: [{
    id: String,
    name: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  streakDays: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date
  },
  quizResults: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    dateTaken: {
      type: Date,
      default: Date.now
    }
  }],
  // Subscription & Usage Tracking
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'unlimited'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    subscribedAt: {
      type: Date,
      default: null
    }
  },
  // Lifetime counters (never reset)
  totalVideosProcessed: {
    type: Number,
    default: 0
  },
  totalAiTokensUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    avatar: this.avatar,
    role: this.role,
    phone: this.phone,
    specialization: this.specialization,
    university: this.university,
    isEmailVerified: this.isEmailVerified,
    points: this.points,
    xp: this.xp,
    level: this.level,
    badges: this.badges,
    streakDays: this.streakDays,
    skillPoints: this.skillPoints || 0,
    unlockedSkills: this.unlockedSkills || [],
    subscription: this.subscription || {
      plan: 'free'
    },
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;