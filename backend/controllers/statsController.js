const { listUserSessions, buildActivity, buildStats } = require('../services/sessionService');
const { getSettings } = require('../services/settingsService');

function pickMessage(stats, goalMinutes) {
  const remaining = goalMinutes - stats.todayFocusMinutes;

  if (stats.completedSessions === 0) {
    return "One session. That's all you need to start.";
  }

  if (remaining <= 0) {
    return 'Daily goal complete. Nice work.';
  }

  if (remaining <= 20) {
    return `You're only ${remaining} minutes away.`;
  }

  if (stats.currentStreak > 0) {
    return "Don't break the chain.";
  }

  return "That's another one in the books.";
}

async function getStats(req, res) {
  const sessions = await listUserSessions(req.user.id);
  const stats = buildStats(sessions);
  const settings = await getSettings(req.user.id);

  return res.json({
    ...stats,
    dailyGoalMinutes: settings.dailyGoalMinutes,
    goalProgressPercent: Math.min(100, Math.round((stats.todayFocusMinutes / settings.dailyGoalMinutes) * 100)),
    motivationMessage: pickMessage(stats, settings.dailyGoalMinutes),
  });
}

async function getActivity(req, res) {
  const sessions = await listUserSessions(req.user.id);
  return res.json({ activity: buildActivity(sessions) });
}

async function getWeekly(req, res) {
  const sessions = await listUserSessions(req.user.id);
  const stats = buildStats(sessions);
  return res.json({ weekly: stats.weekly });
}

module.exports = {
  getStats,
  getActivity,
  getWeekly,
};
