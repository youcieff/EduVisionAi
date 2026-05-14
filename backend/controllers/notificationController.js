const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(15);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
};

// @desc    Mark all user's notifications as read
// @route   POST /api/notifications/mark-read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.status(200).json({
      status: 'success'
    });
  } catch (error) {
    console.error('Mark Notifications Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notifications as read'
    });
  }
};
// @desc    Create an invite notification
// @route   POST /api/notifications/invite
// @access  Private
exports.createInvite = async (req, res) => {
  try {
    const { targetUserId, roomId, videoTitle } = req.body;
    
    // Check if a similar invite already exists to avoid spam
    const existingInvite = await Notification.findOne({
      user: targetUserId,
      type: 'room_invite',
      link: `/room/${roomId}`,
      isRead: false
    });

    if(!existingInvite) {
      await Notification.create({
        user: targetUserId,
        title: 'Study Room Invite',
        message: `${req.user.name} invited you to study ${videoTitle}`,
        type: 'room_invite',
        link: `/room/${roomId}`,
        isRead: false
      });
    }

    res.status(201).json({ status: 'success' });
  } catch (error) {
    console.error('Create Invite Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create invite' });
  }
};
