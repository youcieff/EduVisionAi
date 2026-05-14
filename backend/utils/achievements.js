const HIDDEN_ACHIEVEMENTS = [
  { id: 'first_upload', name: 'First Steps', icon: '🚀', description: 'Upload your first video', condition: (user) => (user.uploadedVideos?.length || 0) >= 1 },
  { id: 'five_uploads', name: 'Content Creator', icon: '🎬', description: 'Upload 5 videos', condition: (user) => (user.uploadedVideos?.length || 0) >= 5 },
  { id: 'ten_uploads', name: 'Knowledge Machine', icon: '🏭', description: 'Upload 10 videos', condition: (user) => (user.uploadedVideos?.length || 0) >= 10 },
  { id: 'first_quiz', name: 'Quiz Taker', icon: '📝', description: 'Complete your first quiz', condition: (user) => (user.quizResults?.length || 0) >= 1 },
  { id: 'ten_quizzes', name: 'Quiz Master', icon: '🧠', description: 'Complete 10 quizzes', condition: (user) => (user.quizResults?.length || 0) >= 10 },
  { id: 'perfect_score', name: 'Perfectionist', icon: '💎', description: 'Score 100% on a quiz', condition: (user) => user.quizResults?.some(q => q.score === q.totalQuestions) },
  { id: 'streak_3', name: 'On Fire', icon: '🔥', description: 'Maintain a 3-day streak', condition: (user) => (user.streakDays || 0) >= 3 },
  { id: 'streak_7', name: 'Unstoppable', icon: '⚡', description: 'Maintain a 7-day streak', condition: (user) => (user.streakDays || 0) >= 7 },
  { id: 'streak_30', name: 'Legend', icon: '👑', description: 'Maintain a 30-day streak', condition: (user) => (user.streakDays || 0) >= 30 },
  { id: 'level_5', name: 'Rising Star', icon: '⭐', description: 'Reach Level 5', condition: (user) => (user.level || 1) >= 5 },
  { id: 'level_10', name: 'Scholar', icon: '🎓', description: 'Reach Level 10', condition: (user) => (user.level || 1) >= 10 },
  { id: 'points_1000', name: 'Point Hoarder', icon: '💰', description: 'Accumulate 1,000 points', condition: (user) => (user.points || 0) >= 1000 },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Study after midnight', condition: () => { const h = new Date().getHours(); return h >= 0 && h < 5; } },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'Study before 7 AM', condition: () => { const h = new Date().getHours(); return h >= 5 && h < 7; } },
];

function checkAchievements(user) {
  const existingIds = (user.badges || []).map(b => b.id);
  const newlyUnlocked = [];

  for (const achievement of HIDDEN_ACHIEVEMENTS) {
    if (!existingIds.includes(achievement.id)) {
      try {
        if (achievement.condition(user)) {
          newlyUnlocked.push({
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
            earnedAt: new Date(),
          });
        }
      } catch {}
    }
  }

  return newlyUnlocked;
}

module.exports = { HIDDEN_ACHIEVEMENTS, checkAchievements };
