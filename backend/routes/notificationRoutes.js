const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getNotifications);
router.post('/mark-read', protect, notificationController.markAsRead);
router.post('/invite', protect, notificationController.createInvite);

module.exports = router;
