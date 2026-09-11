const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/fileStore');
const { toPositiveInt } = require('../utils/validation');
const { calculateStreakInfo, toDayKey } = require('./streakService');

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || './data');
const sessionsPath = path.join(dataDir, 'sessions.json');

async function getSessions() {
  return readData(sessionsPath, []);
}

async function listUserSessions(userId) {
  const sessions = await getSessions();
  return sessions
    .filter((session) => session.userId === userId && session.type === 'focus' && session.status === 'completed')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

async function getUserSessionById(userId, sessionId) {
  const sessions = await listUserSessions(userId);
  return sessions.find((session) => session.id === sessionId);
}

async function createCompletedSession(userId, payload) {
  const durationMinutes = toPositiveInt(payload.durationMinutes, 0);
  if (!durationMinutes) {
    return { error: 'A valid duration is required.' };
  }

  if (payload.status && payload.status !== 'completed') {
    return { error: 'Only completed sessions can be stored.' };
  }

  const session = {
    id: `ses_${uuidv4()}`,
    userId,
    subjectId: payload.subjectId || null,
    subjectName: payload.subjectName || 'General Study',
    durationMinutes,
    note: typeof payload.note === 'string' ? payload.note.trim().slice(0, 280) : '',
    status: 'completed',
    type: 'focus',
    completedAt: payload.completedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const sessions = await getSessions();
  sessions.push(session);
  await writeData(sessionsPath, sessions);
  return { session };
}

function buildActivity(sessions) {
  const byDay = new Map();

  for (const session of sessions) {
    const day = toDayKey(session.completedAt);
    const current = byDay.get(day) || { date: day, minutes: 0, sessions: 0 };
    current.minutes += session.durationMinutes;
    current.sessions += 1;
    byDay.set(day, current);
  }

  return [...byDay.values()]
    .map((day) => ({
      ...day,
      level:
        day.minutes === 0
          ? 0
          : day.minutes < 30
            ? 1
            : day.minutes < 60
              ? 2
              : day.minutes < 120
                ? 3
                : 4,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getWeekRange() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

function buildStats(sessions) {
  const totalFocusMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const completedSessions = sessions.length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayFocusMinutes = sessions
    .filter((session) => toDayKey(session.completedAt) === todayKey)
    .reduce((sum, session) => sum + session.durationMinutes, 0);

  const { currentStreak, longestStreak } = calculateStreakInfo(sessions);

  const subjectTotals = new Map();
  for (const session of sessions) {
    const key = session.subjectName || 'General Study';
    subjectTotals.set(key, (subjectTotals.get(key) || 0) + session.durationMinutes);
  }

  let mostStudiedSubject = null;
  for (const [subject, minutes] of subjectTotals.entries()) {
    if (!mostStudiedSubject || minutes > mostStudiedSubject.minutes) {
      mostStudiedSubject = { subject, minutes };
    }
  }

  const { start, end } = getWeekRange();
  const weeklySessions = sessions.filter((session) => {
    const date = new Date(session.completedAt);
    return date >= start && date < end;
  });

  const weeklyMinutes = weeklySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const weeklyCount = weeklySessions.length;

  const byDay = buildActivity(sessions);
  const mostProductiveDay = byDay.reduce(
    (best, day) => (!best || day.minutes > best.minutes ? day : best),
    null,
  );

  const longestFocusSession = sessions.reduce(
    (best, session) => (session.durationMinutes > (best?.durationMinutes || 0) ? session : best),
    null,
  );

  const achievements = [
    {
      key: 'first_focus',
      name: 'First Focus',
      description: 'Complete your first focus session.',
      unlocked: completedSessions >= 1,
    },
    {
      key: 'week_warrior',
      name: 'Week Warrior',
      description: 'Reach a 7-day streak.',
      unlocked: longestStreak >= 7,
    },
    {
      key: 'dedicated',
      name: 'Dedicated',
      description: 'Complete 100 focus sessions.',
      unlocked: completedSessions >= 100,
    },
    {
      key: 'ten_hours',
      name: 'Ten Hours',
      description: 'Reach 10 total hours of focus.',
      unlocked: totalFocusMinutes >= 600,
    },
    {
      key: 'new_record',
      name: 'New Record',
      description: 'Beat your previous longest streak.',
      unlocked: currentStreak > 0 && currentStreak === longestStreak,
    },
  ];

  return {
    currentStreak,
    longestStreak,
    todayFocusMinutes,
    totalFocusMinutes,
    completedSessions,
    weekly: {
      focusMinutes: weeklyMinutes,
      sessions: weeklyCount,
      averageSessionMinutes: weeklyCount ? Math.round(weeklyMinutes / weeklyCount) : 0,
    },
    mostStudiedSubject,
    records: {
      longestStreak,
      longestFocusSessionMinutes: longestFocusSession?.durationMinutes || 0,
      totalFocusMinutes,
      mostStudiedSubject,
      mostProductiveDay,
    },
    achievements,
  };
}

module.exports = {
  listUserSessions,
  getUserSessionById,
  createCompletedSession,
  buildActivity,
  buildStats,
};
