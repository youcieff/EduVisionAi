const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Current billing period
  periodStart: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  },
  periodEnd: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
  },
  // Monthly counters
  videosProcessed: { type: Number, default: 0 },
  aiChatMessages: { type: Number, default: 0 },
  quizzesGenerated: { type: Number, default: 0 },
  flashcardsGenerated: { type: Number, default: 0 },
  mindMapsGenerated: { type: Number, default: 0 },
  // Estimated cost tracking (in cents)
  estimatedCostCents: { type: Number, default: 0 },
  // Daily chat counter (resets daily)
  dailyChatCount: { type: Number, default: 0 },
  lastChatDate: { type: Date }
}, {
  timestamps: true
});

// Compound index for fast lookups
usageSchema.index({ user: 1, periodStart: 1 }, { unique: true });

// Static: Get or create current period usage for a user
usageSchema.statics.getCurrentUsage = async function(userId) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let usage = await this.findOne({
    user: userId,
    periodStart: { $lte: now },
    periodEnd: { $gte: now }
  });

  if (!usage) {
    usage = await this.create({
      user: userId,
      periodStart,
      periodEnd
    });
  }

  // Reset daily chat count if it's a new day
  const today = new Date().toDateString();
  if (usage.lastChatDate && usage.lastChatDate.toDateString() !== today) {
    usage.dailyChatCount = 0;
    usage.lastChatDate = now;
    await usage.save();
  }

  return usage;
};

// Static: Increment a specific counter
usageSchema.statics.incrementCounter = async function(userId, field, amount = 1) {
  const usage = await this.getCurrentUsage(userId);
  usage[field] = (usage[field] || 0) + amount;
  if (field === 'aiChatMessages') {
    usage.dailyChatCount = (usage.dailyChatCount || 0) + amount;
    usage.lastChatDate = new Date();
  }
  await usage.save();
  return usage;
};

// Static: Platform-wide stats for admin
usageSchema.statics.getPlatformStats = async function() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await this.aggregate([
    { $match: { periodStart: { $gte: periodStart } } },
    {
      $group: {
        _id: null,
        totalVideosProcessed: { $sum: '$videosProcessed' },
        totalChatMessages: { $sum: '$aiChatMessages' },
        totalQuizzes: { $sum: '$quizzesGenerated' },
        totalFlashcards: { $sum: '$flashcardsGenerated' },
        totalMindMaps: { $sum: '$mindMapsGenerated' },
        totalCostCents: { $sum: '$estimatedCostCents' },
        activeUsers: { $addToSet: '$user' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalVideosProcessed: 0,
      totalChatMessages: 0,
      totalQuizzes: 0,
      totalFlashcards: 0,
      totalMindMaps: 0,
      totalCostCents: 0,
      activeUsersCount: 0
    };
  }

  return {
    ...stats[0],
    activeUsersCount: stats[0].activeUsers.length,
    activeUsers: undefined,
    _id: undefined
  };
};

const Usage = mongoose.model('Usage', usageSchema);
module.exports = Usage;
