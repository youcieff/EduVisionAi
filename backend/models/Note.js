const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
  content: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure a user can only have one note document per video (it acts as their personal notepad for that video)
noteSchema.index({ user: 1, video: 1 }, { unique: true });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
