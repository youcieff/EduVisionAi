const express = require('express');
const router = express.Router();
const User = require('../models/User');
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, userController.getDashboardStats);

// @desc    Unlock a skill tree node
// @route   POST /api/users/skills/unlock
// @access  Private
router.post('/skills/unlock', protect, userController.unlockSkill);

// @desc    Search users by name
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const q = req.query.q;
    if(!q || q.length < 2) return res.status(200).json({ status: 'success', data: { users: [] }});
    const users = await User.find({ 
      name: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id } 
    }).select('name avatar role isPremium').limit(10);
    res.status(200).json({ status: 'success', data: { users }});
  } catch(error) {
    res.status(500).json({ status: 'error', message: 'Failed to search users' });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// @desc    Get AI study recommendations
// @route   GET /api/users/study-recommendations
// @access  Private
router.get('/study-recommendations', protect, userController.getStudyRecommendations);

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
router.get('/leaderboard', protect, userController.getLeaderboard);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('uploadedVideos', 'title thumbnail views createdAt');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
});

module.exports = router;
