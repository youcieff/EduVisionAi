const User = require('../models/User');
const Video = require('../models/Video');
const Usage = require('../models/Usage');
const { PLANS } = require('./subscriptionController');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ status: 'error', message: 'غير مصرح لك بالدخول' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ status: 'error', message: 'بيانات الدخول غير صحيحة' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ status: 'error', message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
};

// @desc    Admin Register
// @route   POST /api/admin/register
// @access  Public
exports.adminRegister = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: 'admin',
      points: 99999, // initial points
      level: 99,
      unlockedSkills: ['core_student', 'crown_master']
    });

    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      data: {
        user: user.getPublicProfile(),
        token,
      },
      message: 'تم تسجيل حساب الإدارة بنجاح',
    });
  } catch (error) {
    console.error('Admin Register Error:', error);
    res.status(500).json({ status: 'error', message: 'حدث خطأ أثناء إنشاء حساب الإدارة' });
  }
};
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalVideos = await Video.countDocuments();
    
    // Calculate Active Users (Active in the last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: sevenDaysAgo }, role: 'user' });

    // Aggregate total quizzes taken across all users
    const usersWithQuizzes = await User.aggregate([
      { $project: { quizCount: { $size: { $ifNull: ["$quizResults", []] } } } },
      { $group: { _id: null, totalQuizzes: { $sum: "$quizCount" } } }
    ]);
    const totalQuizzes = usersWithQuizzes.length > 0 ? usersWithQuizzes[0].totalQuizzes : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalAdmins,
        totalVideos,
        activeUsers,
        totalQuizzes
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ status: 'error', message: 'فشل في جلب الإحصائيات' });
  }
};

// @desc    Get Paginated Users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const mappedUsers = users.map(u => ({
      ...u,
      totalVideos: Array.isArray(u.uploadedVideos) ? u.uploadedVideos.length : 0,
      totalQuizzes: Array.isArray(u.quizResults) ? u.quizResults.length : 0,
      uploadedVideos: undefined, // remove large arrays from memory
      quizResults: undefined 
    }));

    res.status(200).json({
      status: 'success',
      data: {
        users: mappedUsers,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ status: 'error', message: 'فشل في جلب المستخدمين' });
  }
};

// @desc    Update User Role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'دور غير صالح' });
    }

    // Prevent removing the last admin
    if (role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const targetUser = await User.findById(req.params.id);
      if (targetUser && targetUser.role === 'admin' && adminCount <= 1) {
        return res.status(400).json({ status: 'error', message: 'لا يمكن إزالة آخر مسؤول في النظام' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'المستخدم غير موجود' });
    }

    res.status(200).json({
      status: 'success',
      data: { user },
      message: 'تم تحديث صلاحيات المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Admin Update Role Error:', error);
    res.status(500).json({ status: 'error', message: 'فشل في تحديث صلاحية المستخدم' });
  }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'المستخدم غير موجود' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ status: 'error', message: 'لا يمكنك حذف حسابك الخاص' });
    }

    await user.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    res.status(500).json({ status: 'error', message: 'فشل في حذف المستخدم' });
  }
};

// @desc    Get detailed user profile including videos, quizzes, and stats
// @route   GET /api/admin/users/:id/profile
// @access  Private/Admin
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('uploadedVideos', 'title status duration views createdAt')
      .populate({
        path: 'quizResults.video',
        select: 'title'
      })
      .select('-password -otp -otpExpires');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get usage statistics
    const usage = await Usage.findOne({ user: req.params.id });

    // Format quiz results
    const quizzes = user.quizResults.map(q => ({
      _id: q._id,
      videoTitle: q.video ? q.video.title : 'Deleted Video',
      score: q.score,
      totalQuestions: q.totalQuestions,
      percentage: Math.round((q.score / q.totalQuestions) * 100),
      dateTaken: q.dateTaken
    }));

    res.status(200).json({
      status: 'success',
      data: {
        user,
        usage: usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
        quizzes
      }
    });

  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    AI & Platform Consumption Stats
// @route   GET /api/admin/ai-stats
// @access  Private/Admin
exports.getAiStats = async (req, res) => {
  try {
    const platformStats = await Usage.getPlatformStats();

    // Processing queue status
    const [pending, processing, completed, failed] = await Promise.all([
      Video.countDocuments({ processingStatus: 'pending' }),
      Video.countDocuments({ processingStatus: 'processing' }),
      Video.countDocuments({ processingStatus: 'completed' }),
      Video.countDocuments({ processingStatus: 'failed' })
    ]);

    // Subscription distribution
    const subStats = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);

    const subscriptions = { free: 0, pro: 0, unlimited: 0 };
    subStats.forEach(s => { subscriptions[s._id || 'free'] = s.count; });

    // Revenue calculation
    const revenue = {
      monthly: (subscriptions.pro * PLANS.pro.price) + (subscriptions.unlimited * PLANS.unlimited.price),
      proSubscribers: subscriptions.pro,
      unlimitedSubscribers: subscriptions.unlimited,
      freeUsers: subscriptions.free
    };

    res.status(200).json({
      status: 'success',
      data: {
        ai: platformStats,
        processingQueue: { pending, processing, completed, failed },
        subscriptions,
        revenue
      }
    });
  } catch (error) {
    console.error('Admin AI Stats Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch AI stats' });
  }
};

// @desc    Get detailed usage for a specific user
// @route   GET /api/admin/users/:id/usage
// @access  Private/Admin
exports.getUserUsage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const usage = await Usage.getCurrentUsage(user._id);
    const plan = user.subscription?.plan || 'free';
    const planConfig = PLANS[plan];

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          plan,
          planName: planConfig.name,
          subscribedAt: user.subscription?.subscribedAt,
          expiresAt: user.subscription?.expiresAt
        },
        usage: {
          videosProcessed: usage.videosProcessed,
          aiChatMessages: usage.aiChatMessages,
          quizzesGenerated: usage.quizzesGenerated,
          flashcardsGenerated: usage.flashcardsGenerated,
          mindMapsGenerated: usage.mindMapsGenerated,
          dailyChatCount: usage.dailyChatCount,
          estimatedCostCents: usage.estimatedCostCents
        },
        limits: {
          videosPerMonth: planConfig.limits.videosPerMonth === Infinity ? 'unlimited' : planConfig.limits.videosPerMonth,
          chatMessagesPerDay: planConfig.limits.chatMessagesPerDay === Infinity ? 'unlimited' : planConfig.limits.chatMessagesPerDay,
          quizzesPerMonth: planConfig.limits.quizzesPerMonth === Infinity ? 'unlimited' : planConfig.limits.quizzesPerMonth
        },
        lifetime: {
          totalVideosProcessed: user.totalVideosProcessed || 0,
          totalAiTokensUsed: user.totalAiTokensUsed || 0
        },
        periodEnd: usage.periodEnd
      }
    });
  } catch (error) {
    console.error('Admin User Usage Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user usage' });
  }
};

// @desc    Get video processing queue
// @route   GET /api/admin/processing-queue
// @access  Private/Admin
exports.getProcessingQueue = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // optional filter

    const query = {};
    if (status) query.processingStatus = status;

    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .select('title sourceType processingStatus duration createdAt uploadedBy')
      .populate('uploadedBy', 'username email avatar subscription')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        videos,
        pagination: { total, page, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Admin Processing Queue Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch processing queue' });
  }
};

// @desc    Manually update user subscription
// @route   PUT /api/admin/users/:id/subscription
// @access  Private/Admin
exports.updateUserSubscription = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'pro', 'unlimited'].includes(plan)) {
      return res.status(400).json({ status: 'error', message: 'Invalid plan' });
    }

    const updateData = {
      'subscription.plan': plan,
      'subscription.subscribedAt': plan === 'free' ? null : new Date(),
      'subscription.expiresAt': plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { user },
      message: `User subscription updated to ${PLANS[plan].name}`
    });
  } catch (error) {
    console.error('Admin Subscription Update Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update subscription' });
  }
};

// @desc    Revenue + Subscription dashboard data
// @route   GET /api/admin/revenue
// @access  Private/Admin
exports.getRevenue = async (req, res) => {
  try {
    const subStats = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);

    const distribution = { free: 0, pro: 0, unlimited: 0 };
    subStats.forEach(s => { distribution[s._id || 'free'] = s.count; });

    const totalUsers = distribution.free + distribution.pro + distribution.unlimited;
    const mrr = (distribution.pro * PLANS.pro.price) + (distribution.unlimited * PLANS.unlimited.price);
    const arr = mrr * 12;

    // Recent subscribers
    const recentSubs = await User.find({
      'subscription.plan': { $in: ['pro', 'unlimited'] },
      'subscription.subscribedAt': { $exists: true }
    })
      .select('username email avatar subscription')
      .sort({ 'subscription.subscribedAt': -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        mrr,
        arr,
        totalUsers,
        distribution,
        conversionRate: totalUsers > 0 ? (((distribution.pro + distribution.unlimited) / totalUsers) * 100).toFixed(1) : '0',
        recentSubscribers: recentSubs,
        plans: Object.entries(PLANS).map(([key, p]) => ({ id: key, name: p.name, price: p.price }))
      }
    });
  } catch (error) {
    console.error('Admin Revenue Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch revenue data' });
  }
};
