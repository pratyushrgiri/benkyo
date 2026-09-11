const path = require('path');
const { readData, writeData } = require('../utils/fileStore');
const { toPositiveInt, toBoundedNumber } = require('../utils/validation');

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || './data');
const settingsPath = path.join(dataDir, 'settings.json');

function defaultSettings(userId) {
  return {
    userId,
    timer: {
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
    },
    dailyGoalMinutes: 120,
    sound: {
      timerCompletion: true,
      breakCompletion: true,
      buttonSounds: false,
      volume: 70,
    },
    appearance: {
      theme: 'system',
    },
    updatedAt: new Date().toISOString(),
  };
}

async function getSettingsList() {
  return readData(settingsPath, []);
}

async function getSettings(userId) {
  const all = await getSettingsList();
  const existing = all.find((item) => item.userId === userId);

  if (existing) {
    return existing;
  }

  const created = defaultSettings(userId);
  all.push(created);
  await writeData(settingsPath, all);
  return created;
}

async function updateSettings(userId, updates) {
  const all = await getSettingsList();
  const index = all.findIndex((item) => item.userId === userId);
  const current = index >= 0 ? all[index] : defaultSettings(userId);

  const next = {
    ...current,
    timer: {
      ...current.timer,
      ...(updates.timer || {}),
    },
    sound: {
      ...current.sound,
      ...(updates.sound || {}),
    },
    appearance: {
      ...current.appearance,
      ...(updates.appearance || {}),
    },
    dailyGoalMinutes:
      updates.dailyGoalMinutes !== undefined
        ? toPositiveInt(updates.dailyGoalMinutes, current.dailyGoalMinutes)
        : current.dailyGoalMinutes,
  };

  next.timer.focusMinutes = toPositiveInt(next.timer.focusMinutes, current.timer.focusMinutes);
  next.timer.shortBreakMinutes = toPositiveInt(next.timer.shortBreakMinutes, current.timer.shortBreakMinutes);
  next.timer.longBreakMinutes = toPositiveInt(next.timer.longBreakMinutes, current.timer.longBreakMinutes);
  next.timer.sessionsBeforeLongBreak = toPositiveInt(
    next.timer.sessionsBeforeLongBreak,
    current.timer.sessionsBeforeLongBreak,
  );

  next.sound.volume = toBoundedNumber(next.sound.volume, 0, 100, current.sound.volume);
  next.sound.timerCompletion = Boolean(next.sound.timerCompletion);
  next.sound.breakCompletion = Boolean(next.sound.breakCompletion);
  next.sound.buttonSounds = Boolean(next.sound.buttonSounds);

  if (!['light', 'dark', 'system'].includes(next.appearance.theme)) {
    next.appearance.theme = current.appearance.theme;
  }

  next.updatedAt = new Date().toISOString();

  if (index >= 0) {
    all[index] = next;
  } else {
    all.push(next);
  }

  await writeData(settingsPath, all);
  return next;
}

module.exports = {
  getSettings,
  updateSettings,
};
