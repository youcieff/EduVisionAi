const mongoose = require('mongoose');

const flashcardProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  cardIndex: {
    type: Number,
    required: true
  },
  // SM-2 Algorithm Fields
  easeFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number,
    default: 0 // days
  },
  repetitions: {
    type: Number,
    default: 0
  },
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  lastReviewDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for fast lookups
flashcardProgressSchema.index({ user: 1, video: 1, cardIndex: 1 }, { unique: true });
// Index for fetching due cards
flashcardProgressSchema.index({ user: 1, nextReviewDate: 1 });

const FlashcardProgress = mongoose.model('FlashcardProgress', flashcardProgressSchema);

module.exports = FlashcardProgress;
