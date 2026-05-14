const User = require('../models/User');
const Video = require('../models/Video');
const Notification = require('../models/Notification');

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('uploadedVideos', 'title duration views processingStatus createdAt');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Calculate quiz statistics
    const quizResults = user.quizResults || [];
    const totalQuizzesTaken = quizResults.length;
    
    let totalScore = 0;
    let totalPossibleScore = 0;
    
    quizResults.forEach(result => {
      totalScore += result.score;
      totalPossibleScore += result.totalQuestions;
    });

    const averageScore = totalPossibleScore > 0 
      ? Math.round((totalScore / totalPossibleScore) * 100) 
      : 0;

    const totalVideosUploaded = user.uploadedVideos.length;
    
    // Gamification: 100 pts per correct answer, 50 pts per uploaded video
    const pointsFromQuizzes = totalScore * 100;
    const pointsFromVideos = totalVideosUploaded * 50;
    const totalPoints = pointsFromQuizzes + pointsFromVideos;

    // Lazy migration: sync the dynamic totalPoints to the database points field
    if (user.points !== totalPoints) {
      user.points = totalPoints;
      await user.save();
    }

    let currentBadge = 'beginner'; // Beginner
    if (totalPoints >= 2000) currentBadge = 'genius'; // Genius
    else if (totalPoints >= 1000) currentBadge = 'scholar'; // Distinguished Scholar
    else if (totalPoints >= 500) currentBadge = 'diligent'; // Diligent Student
    else if (totalPoints >= 100) currentBadge = 'active'; // Active Learner

    // --- SMART REMINDER LOGIC ---
    const now = new Date();
    const lastLogin = user.lastLogin || user.createdAt;
    const daysSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);

    if (daysSinceLastLogin > 1) { // 1 day inactivity
      const recentReminder = await Notification.findOne({
        user: user._id, 
        type: 'reminder',
        createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) }
      });
      
      if (!recentReminder) {
        await Notification.create({
          user: user._id,
          title: 'مرحباً بعودتك! 👋',
          message: 'استكمل دراستك الآن لتحافظ على تقدمك في لوحة المتصدرين!',
          type: 'reminder',
          link: '/dashboard'
        });
      }
    }
    
    // Update lastLogin for tracking
    if (daysSinceLastLogin > 0.1) { // only update if > 2.4 hours to avoid constant db writes
       user.lastLogin = now;
       await user.save();
    }
    // -----------------------------

    // Build the dashboard data object
    const dashboardData = {
      stats: {
        totalVideosUploaded,
        totalQuizzesTaken,
        averageScore: `${averageScore}%`,
        totalScore,
        totalPoints,
        currentBadge
      },
      recentActivity: {
        lastLogin: user.lastLogin,
        recentQuizzes: quizResults.slice(-5).reverse(), // Get last 5 quizzes
      },
      uploadedVideos: user.uploadedVideos
    };

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public or Private
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ points: { $gt: 0 } })
      .select('username avatar points level streakDays badges unlockedSkills')
      .sort({ points: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: topUsers
      }
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard'
    });
  }
};

// @desc    Get AI-powered study recommendations based on quiz performance
// @route   GET /api/users/study-recommendations
// @access  Private
exports.getStudyRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'quizResults.video',
        select: 'title category tags summary keyPoints'
      });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const quizResults = user.quizResults || [];

    if (quizResults.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          recommendations: null,
          message: 'لا توجد نتائج اختبارات بعد. أكمل اختباراً واحداً على الأقل للحصول على توصيات دراسية ذكية.'
        }
      });
    }

    // Build performance profile
    const performanceByVideo = {};
    quizResults.forEach(quiz => {
      const videoId = quiz.video?._id?.toString() || 'unknown';
      const title = quiz.video?.title || 'Unknown Video';
      const category = quiz.video?.category || 'other';
      const keyPoints = quiz.video?.keyPoints || [];
      const accuracy = quiz.totalQuestions > 0 ? Math.round((quiz.score / quiz.totalQuestions) * 100) : 0;

      if (!performanceByVideo[videoId]) {
        performanceByVideo[videoId] = { title, category, keyPoints, scores: [], bestScore: 0 };
      }
      performanceByVideo[videoId].scores.push(accuracy);
      performanceByVideo[videoId].bestScore = Math.max(performanceByVideo[videoId].bestScore, accuracy);
    });

    // Identify weak and strong areas
    const weakAreas = [];
    const strongAreas = [];
    Object.values(performanceByVideo).forEach(v => {
      const avg = Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length);
      const entry = { title: v.title, category: v.category, keyConcepts: v.keyPoints.slice(0, 3).join(', '), avgScore: avg, attempts: v.scores.length, bestScore: v.bestScore };
      if (avg < 60) weakAreas.push(entry);
      else if (avg >= 80) strongAreas.push(entry);
    });

    // Overall stats
    const totalCorrect = quizResults.reduce((sum, q) => sum + q.score, 0);
    const totalQuestions = quizResults.reduce((sum, q) => sum + q.totalQuestions, 0);
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Build per-video performance list for AI
    const allVideoStats = Object.entries(performanceByVideo).map(([id, v]) => {
      const avg = Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length);
      return { id, title: v.title, category: v.category, keyConcepts: v.keyPoints.slice(0, 5).join(', '), avgScore: avg, attempts: v.scores.length, bestScore: v.bestScore };
    });

    // Build AI prompt
    const profileSummary = `
Student Performance Profile:
- Total quizzes taken: ${quizResults.length}
- Overall accuracy: ${overallAccuracy}%

Per-Video Breakdown:
${allVideoStats.map((v, i) => `${i + 1}. "${v.title}" — Accuracy: ${v.avgScore}%, Attempts: ${v.attempts}, Best: ${v.bestScore}%, Key Concepts: ${v.keyConcepts || 'N/A'}`).join('\n')}

IMPORTANT: Generate ONE study plan entry for EACH video listed above. The "topic" field MUST be the exact video title. Include specific advice referencing the key concepts.
    `.trim();

    // Detect language from video titles
    const allTitles = Object.values(performanceByVideo).map(v => v.title).join(' ');
    const arabicChars = (allTitles.match(/[\u0600-\u06FF]/g) || []).length;
    const isArabic = arabicChars > 5;

    const { groq, retryAsync, GENERAL_MODEL, LITE_MODEL } = require('../services/openaiService');

    const systemPrompt = isArabic
      ? `أنت خبير تعليمي أسطوري "Legendary Study Coach". بناءً على نتائج الطالب في الاختبارات، قدم خطة دراسية متكاملة وحقيقية وليست مجرد نصيحة عامة.
التزم بالقالب التالي بالضبط واستخدم مفاتيح JSON الإنجليزية ولكن اكتب المحتوى باللغة العربية:
{
  "overallGrade": "تقييم عام (مثلاً: بطل، محتاج مجهود، عبقري)",
  "learningStyle": "تحليل لأسلوب الطالب بناء على الإخفاقات (مثلاً: يفتقر للأساسيات في موضوع كذا ويتميز في كذا)",
  "motivationalMessage": "جملة حماسية جداً وغير مقلدة (سطرين كحد أقصى)",
  "studyPlan": [
    {
      "topic": "اسم الموضوع",
      "priority": "عالية/متوسطة/منخفضة",
      "timeToMaster": "مثلا: ساعتان, 3 أيام",
      "deepAdvice": "فقرة عميقة ومنطقية تشرح المشكلة وطريقة حلها باستراتيجية المذاكرة الفعالة",
      "actionableSteps": [
        "خطوة عملية 1 (مثلاً: قم بمراجعة الدقيقة 3 من فيديو كذا الخاص بالأساسيات)",
        "خطوة عملية 2"
      ]
    }
  ]
}`
      : `You are a "Legendary Study Coach". Based on the student's quiz results, provide a highly actionable, robust study plan. Don't be generic.
Use this exact JSON schema:
{
  "overallGrade": "Overall evaluation (e.g., Prodigy, Needs Work, Master)",
  "learningStyle": "Analysis of their learning pattern based on failures",
  "motivationalMessage": "A deeply inspiring, non-cliché motivational quote/message",
  "studyPlan": [
    {
      "topic": "Topic Name",
      "priority": "High/Medium/Low",
      "timeToMaster": "e.g., 2 Hours, 3 Days",
      "deepAdvice": "A deep tactical paragraph explaining what's wrong and how to fix it using effective studying frameworks",
      "actionableSteps": [
        "Actionable Step 1 (e.g., Review the foundations of XYZ)",
        "Actionable Step 2"
      ]
    }
  ]
}`;

    const callGroq = (model) => groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: profileSummary }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const response = await retryAsync(
      () => callGroq(GENERAL_MODEL),
      4,
      3000,
      () => callGroq(LITE_MODEL)
    );

    let recommendations;
    try {
      recommendations = JSON.parse(response.choices[0].message.content.trim());
    } catch (parseErr) {
      // Fallback: try to extract JSON
      const raw = response.choices[0].message.content.trim();
      const match = raw.match(/\{[\s\S]*\}/);
      recommendations = match ? JSON.parse(match[0]) : null;
    }

    res.status(200).json({
      status: 'success',
      data: {
        recommendations,
        performance: {
          overallAccuracy,
          totalQuizzes: quizResults.length,
          weakAreas,
          strongAreas
        },
        videoPerformance: allVideoStats
      }
    });

  } catch (error) {
    console.error('Study Recommendations Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate study recommendations'
    });
  }
};

// @desc    Unlock a skill tree node
// @route   POST /api/users/skills/unlock
// @access  Private
exports.unlockSkill = async (req, res) => {
  try {
    const { skillId, cost = 1 } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.unlockedSkills && user.unlockedSkills.includes(skillId)) {
      return res.status(400).json({ status: 'error', message: 'Skill already unlocked' });
    }

    if ((user.skillPoints || 0) < cost) {
      return res.status(400).json({ status: 'error', message: 'Not enough Skill Points' });
    }

    user.skillPoints -= cost;
    if (!user.unlockedSkills) user.unlockedSkills = [];
    user.unlockedSkills.push(skillId);
    
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        skillPoints: user.skillPoints,
        unlockedSkills: user.unlockedSkills
      }
    });
  } catch (error) {
    console.error('Unlock Skill Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unlock skill'
    });
  }
};
