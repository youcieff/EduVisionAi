const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload, uploadDocument, uploadImage, handleMulterError } = require('../middleware/upload');

// Protected routes (specific paths BEFORE parameterized :id routes)
router.get('/user/my-videos', protect, videoController.getMyVideos);

router.post(
  '/upload',
  protect,
  upload.single('video'),
  handleMulterError,
  videoController.uploadVideo
);

router.post('/upload-url', protect, videoController.uploadFromUrl);

router.post(
  '/upload-doc',
  protect,
  uploadDocument.single('pdf'), // can be any field name, but frontend currently uses 'pdf'
  handleMulterError,
  videoController.uploadDocument
);

// Forwarding old routes to unified document controller
router.post('/upload-pdf', protect, uploadDocument.single('pdf'), handleMulterError, videoController.uploadDocument);
router.post('/upload-pptx', protect, uploadDocument.single('pptx'), handleMulterError, videoController.uploadDocument);

router.post(
  '/upload-image',
  protect,
  uploadImage.single('image'),
  handleMulterError,
  videoController.uploadImage
);

// Chat audio generation route
router.post('/chat/audio', protect, videoController.generateChatAudio);

// Old PPTX route handled above

// Public routes
router.get('/', optionalAuth, videoController.getAllVideos);

// SRS Flashcard Routes (must be before :id routes)
router.get('/flashcards/due', protect, videoController.getDueFlashcards);
router.post('/flashcards/review', protect, videoController.reviewFlashcard);

// Anki Export: Download flashcards as CSV
router.get('/export-anki/:id', protect, videoController.exportAnkiCSV);

// AI Study Coach: Personalized study recommendations
router.get('/study-coach', protect, videoController.getStudyCoach);

// Hidden Achievements list
router.get('/achievements', protect, videoController.getAchievements);

// Parameterized routes LAST
router.get('/:id', optionalAuth, videoController.getVideo);
router.delete('/:id', protect, videoController.deleteVideo);
router.post('/:id/submit-quiz', protect, videoController.submitQuiz);
router.post('/:id/like', protect, videoController.toggleLike);
router.post('/:id/retry-processing', protect, videoController.retryProcessing);
router.post('/:id/regenerate-component', protect, videoController.regenerateComponent);
router.post('/:id/cancel', protect, videoController.cancelProcessing);
router.post('/:id/chat', protect, videoController.chatWithVideo);
router.get('/:id/notes', protect, videoController.getPersonalNotes);
router.post('/:id/notes', protect, videoController.savePersonalNotes);

module.exports = router;
