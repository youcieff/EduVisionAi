const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// @route   POST /api/admin/login
// @desc    Admin Login
// @access  Public (Checks for admin role inside controller)
router.post('/login', adminController.adminLogin);



// ==========================================================
// All routes below require Authentication & Admin Privileges
// ==========================================================
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/stats
// @desc    Get Platform Statistics
// @access  Private/Admin
router.get('/stats', adminController.getStats);

// @route   POST /api/admin/register
// @desc    Register a new Admin (only by existing admin)
// @access  Private/Admin
router.post('/register', adminController.adminRegister);

// @route   GET /api/admin/users
// @desc    Get Paginated Users list
// @access  Private/Admin
router.get('/users', adminController.getUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update User Role (promote/demote)
// @access  Private/Admin
router.put('/users/:id/role', adminController.updateUserRole);

// @route   DELETE /api/admin/users/:id
// @desc    Delete User
// @access  Private/Admin
router.delete('/users/:id', adminController.deleteUser);

// @route   GET /api/admin/ai-stats
// @desc    AI & Platform Consumption Stats
// @access  Private/Admin
router.get('/ai-stats', adminController.getAiStats);

// @route   GET /api/admin/users/:id/usage
// @desc    Get detailed usage for a specific user
// @access  Private/Admin
router.get('/users/:id/usage', adminController.getUserUsage);

// @route   GET /api/admin/users/:id/profile
// @desc    Get detailed user profile including videos and stats
// @access  Private/Admin
router.get('/users/:id/profile', adminController.getUserProfile);

// @route   GET /api/admin/processing-queue
// @desc    Video processing queue monitor
// @access  Private/Admin
router.get('/processing-queue', adminController.getProcessingQueue);

// @route   PUT /api/admin/users/:id/subscription
// @desc    Manually update user subscription
// @access  Private/Admin
router.put('/users/:id/subscription', adminController.updateUserSubscription);

// @route   GET /api/admin/revenue
// @desc    Revenue & Subscription dashboard
// @access  Private/Admin
router.get('/revenue', adminController.getRevenue);

module.exports = router;
