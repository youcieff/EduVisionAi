const Usage = require('../models/Usage');
const User = require('../models/User');

// Plan definitions with limits
const PLANS = {
  free: {
    name: 'Free',
    nameAr: 'مجاني',
    price: 0,
    limits: {
      videosPerMonth: 3,
      chatMessagesPerDay: 20,
      quizzesPerMonth: 5
    },
    features: ['3 videos/month', 'AI Summaries', 'Flashcards', 'Mind Maps', '20 AI chats/day']
  },
  pro: {
    name: 'Pro',
    nameAr: 'احترافي',
    price: 9.99,
    limits: {
      videosPerMonth: 15,
      chatMessagesPerDay: 100,
      quizzesPerMonth: 30
    },
    features: ['15 videos/month', 'Everything in Free', '100 AI chats/day', 'Priority Processing', 'Advanced Analytics']
  },
  unlimited: {
    name: 'Unlimited',
    nameAr: 'غير محدود',
    price: 19.99,
    limits: {
      videosPerMonth: Infinity,
      chatMessagesPerDay: Infinity,
      quizzesPerMonth: Infinity
    },
    features: ['Unlimited videos', 'Everything in Pro', 'Unlimited AI chats', 'Fastest Processing', 'VIP Support']
  }
};

// @desc    Get available subscription plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const plans = Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
      limits: {
        ...plan.limits,
        videosPerMonth: plan.limits.videosPerMonth === Infinity ? 'unlimited' : plan.limits.videosPerMonth,
        chatMessagesPerDay: plan.limits.chatMessagesPerDay === Infinity ? 'unlimited' : plan.limits.chatMessagesPerDay,
        quizzesPerMonth: plan.limits.quizzesPerMonth === Infinity ? 'unlimited' : plan.limits.quizzesPerMonth
      }
    }));

    res.status(200).json({ status: 'success', data: { plans } });
  } catch (error) {
    console.error('Get Plans Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch plans' });
  }
};

// @desc    Get current user's usage vs limits
// @route   GET /api/subscription/my-usage
// @access  Private
exports.getMyUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const usage = await Usage.getCurrentUsage(req.user.id);
    const plan = user.subscription?.plan || 'free';
    const planConfig = PLANS[plan];

    res.status(200).json({
      status: 'success',
      data: {
        plan,
        planName: planConfig.name,
        usage: {
          videosProcessed: usage.videosProcessed,
          aiChatMessages: usage.aiChatMessages,
          dailyChatCount: usage.dailyChatCount,
          quizzesGenerated: usage.quizzesGenerated,
          flashcardsGenerated: usage.flashcardsGenerated,
          mindMapsGenerated: usage.mindMapsGenerated
        },
        limits: {
          videosPerMonth: planConfig.limits.videosPerMonth === Infinity ? 'unlimited' : planConfig.limits.videosPerMonth,
          chatMessagesPerDay: planConfig.limits.chatMessagesPerDay === Infinity ? 'unlimited' : planConfig.limits.chatMessagesPerDay,
          quizzesPerMonth: planConfig.limits.quizzesPerMonth === Infinity ? 'unlimited' : planConfig.limits.quizzesPerMonth
        },
        periodEnd: usage.periodEnd,
        expiresAt: user.subscription?.expiresAt
      }
    });
  } catch (error) {
    console.error('Get Usage Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch usage' });
  }
};

// @desc    Request plan upgrade (manual approval by admin)
// @route   POST /api/subscription/upgrade
// @access  Private
exports.requestUpgrade = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ status: 'error', message: 'Invalid plan selected' });
    }

    const user = await User.findById(req.user.id);
    if (user.subscription?.plan === plan) {
      return res.status(400).json({ status: 'error', message: 'You are already on this plan' });
    }

    // For now, upgrade immediately (in production, this would go through payment)
    user.subscription = {
      plan,
      subscribedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    await user.save();

    res.status(200).json({
      status: 'success',
      data: { subscription: user.subscription },
      message: `Upgraded to ${PLANS[plan].name} successfully!`
    });
  } catch (error) {
    console.error('Upgrade Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to upgrade plan' });
  }
};

// Helper: Check if user can perform an action (used by other controllers)
exports.checkQuota = async (userId, action) => {
  const user = await User.findById(userId);
  const usage = await Usage.getCurrentUsage(userId);
  const plan = user?.subscription?.plan || 'free';
  const planConfig = PLANS[plan];

  // Check if paid plan has expired
  if (plan !== 'free' && user.subscription?.expiresAt && new Date() > user.subscription.expiresAt) {
    // Plan expired, revert to free
    user.subscription.plan = 'free';
    await user.save();
    return exports.checkQuota(userId, action); // Re-check with free limits
  }

  let allowed = true;
  let current = 0;
  let limit = 0;

  switch (action) {
    case 'video':
      current = usage.videosProcessed;
      limit = planConfig.limits.videosPerMonth;
      allowed = current < limit;
      break;
    case 'chat':
      current = usage.dailyChatCount;
      limit = planConfig.limits.chatMessagesPerDay;
      allowed = current < limit;
      break;
    case 'quiz':
      current = usage.quizzesGenerated;
      limit = planConfig.limits.quizzesPerMonth;
      allowed = current < limit;
      break;
    default:
      allowed = true;
  }

  return {
    allowed,
    current,
    limit: limit === Infinity ? 'unlimited' : limit,
    plan,
    upgradeRequired: !allowed
  };
};

// Export PLANS for use in admin controller
exports.PLANS = PLANS;
