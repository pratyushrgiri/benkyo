function toDayKey(isoDate) {
  return new Date(isoDate).toISOString().slice(0, 10);
}

function calculateStreakInfo(sessions) {
  const uniqueDays = [
    ...new Set(sessions.map((session) => toDayKey(session.completedAt))),
  ].sort();

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longest = 1;
  let running = 1;

  for (let i = 1; i < uniqueDays.length; i += 1) {
    const previous = new Date(uniqueDays[i - 1]);
    const current = new Date(uniqueDays[i]);
    const diffDays = (current - previous) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  const daySet = new Set(uniqueDays);
  const today = new Date().toISOString().slice(0, 10);
  let cursor = new Date(today);
  let currentStreak = 0;

  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { currentStreak, longestStreak: longest };
}

module.exports = { calculateStreakInfo, toDayKey };
