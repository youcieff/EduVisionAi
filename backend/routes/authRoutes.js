const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, uploadAvatar, verifyOtp, resendOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);
router.post('/avatar', protect, uploadImage.single('avatar'), uploadAvatar);
router.put('/change-password', protect, changePassword);

module.exports = router;