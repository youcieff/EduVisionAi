const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'المستخدم غير موجود',
        });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error);
      return res.status(401).json({
        status: 'error',
        message: 'غير مصرح',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'لا يوجد توكن، غير مصرح',
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'صلاحيات غير كافية',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      console.error('Optional Auth Error:', error);
    }
  }

  next();
};

module.exports = { protect, adminOnly, optionalAuth };