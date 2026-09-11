(async function initDashboard() {
  if (!window.requireAuth) return;

  const user = await window.requireAuth();
  if (!user) return;

  const welcome = document.getElementById('welcome');
  welcome.textContent = `Good to see you, ${user.username}.`;

  const timerDisplay = document.getElementById('timer-display');
  const timerMode = document.getElementById('timer-mode');
  const subjectSelect = document.getElementById('subject-select');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const stopBtn = document.getElementById('stop-btn');
  const startBreakBtn = document.getElementById('start-break-btn');
  const skipBreakBtn = document.getElementById('skip-break-btn');

  let settings = null;
  let stats = null;
  let focusCompletedSinceLongBreak = 0;
  let currentMode = 'focus';

  const beep = () => {
    if (!settings) return;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = (settings.sound.volume || 70) / 1000;
    oscillator.frequency.value = 740;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  };

  const timer = window.createAccurateTimer({
    onTick(ms) {
      timerDisplay.textContent = timer.formatMs(ms);
    },
    async onComplete() {
      if (currentMode === 'focus') {
        if (settings.sound.timerCompletion) beep();

        const note = window.prompt('Session complete. What did you study? (optional)') || '';
        const selected = subjectSelect.selectedOptions[0];

        await window.api.request('/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            subjectId: selected?.value || null,
            subjectName: selected?.textContent || 'General Study',
            durationMinutes: settings.timer.focusMinutes,
            note,
            status: 'completed',
          }),
        });

        focusCompletedSinceLongBreak += 1;
        startBreakBtn.disabled = false;
        skipBreakBtn.disabled = false;
        timerMode.textContent = 'Session complete ✓';
        await refreshAll();
      } else {
        if (settings.sound.breakCompletion) beep();
        timerMode.textContent = 'Break complete';
        setFocusIdle();
      }

      startBtn.disabled = false;
      pauseBtn.disabled = true;
      resumeBtn.disabled = true;
      stopBtn.disabled = true;
    },
  });

  function setFocusIdle() {
    currentMode = 'focus';
    timerDisplay.textContent = timer.formatMs(settings.timer.focusMinutes * 60 * 1000);
    timerMode.textContent = 'Focus';
  }

  function setButtonStateRunning() {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    stopBtn.disabled = false;
    startBreakBtn.disabled = true;
    skipBreakBtn.disabled = true;
  }

  startBtn.addEventListener('click', () => {
    currentMode = 'focus';
    timerMode.textContent = 'Focus';
    timer.start(settings.timer.focusMinutes);
    setButtonStateRunning();
  });

  pauseBtn.addEventListener('click', () => {
    timer.pause();
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
  });

  resumeBtn.addEventListener('click', () => {
    timer.resume();
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  });

  stopBtn.addEventListener('click', () => {
    const shouldStop = window.confirm(
      'End session?\n\nYour current session will not be added to your focus history.',
    );

    if (!shouldStop) return;

    timer.stop();
    setFocusIdle();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
  });

  startBreakBtn.addEventListener('click', () => {
    currentMode = 'break';
    const isLongBreak = focusCompletedSinceLongBreak >= settings.timer.sessionsBeforeLongBreak;
    const breakMinutes = isLongBreak ? settings.timer.longBreakMinutes : settings.timer.shortBreakMinutes;

    if (isLongBreak) {
      focusCompletedSinceLongBreak = 0;
      timerMode.textContent = 'Long break';
    } else {
      timerMode.textContent = 'Short break';
    }

    timer.start(breakMinutes);
    setButtonStateRunning();
  });

  skipBreakBtn.addEventListener('click', () => {
    startBreakBtn.disabled = true;
    skipBreakBtn.disabled = true;
    setFocusIdle();
  });

  function formatMinutes(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m}m`;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  function renderActivity(activity) {
    const graph = document.getElementById('activity-graph');
    graph.innerHTML = '';

    const last90 = activity.slice(-90);
    for (const day of last90) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `day-cell level-${day.level}`;
      cell.title = `${day.date}\nFocus time: ${formatMinutes(day.minutes)}\nSessions: ${day.sessions}`;
      graph.appendChild(cell);
    }
  }

  function renderAchievements(achievements) {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';

    for (const item of achievements) {
      const li = document.createElement('li');
      li.textContent = `${item.unlocked ? '✅' : '⬜'} ${item.name}`;
      list.appendChild(li);
    }
  }

  async function loadSubjects() {
    const { subjects } = await window.api.request('/api/subjects');
    subjectSelect.innerHTML = '';

    if (!subjects.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'General Study';
      subjectSelect.appendChild(option);
    }

    for (const subject of subjects) {
      const option = document.createElement('option');
      option.value = subject.id;
      option.textContent = subject.name;
      subjectSelect.appendChild(option);
    }
  }

  async function refreshAll() {
    const settingsResponse = await window.api.request('/api/settings');
    settings = settingsResponse.settings;

    window.applyTheme(settings.appearance.theme);

    const statsResponse = await window.api.request('/api/stats');
    stats = statsResponse;

    const activityResponse = await window.api.request('/api/stats/activity');

    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('longest-streak').textContent = stats.longestStreak;
    document.getElementById('today-focus').textContent = formatMinutes(stats.todayFocusMinutes);
    document.getElementById('total-focus').textContent = formatMinutes(stats.totalFocusMinutes);
    document.getElementById('total-sessions').textContent = String(stats.completedSessions);
    document.getElementById('goal-text').textContent = `${formatMinutes(stats.todayFocusMinutes)} / ${formatMinutes(stats.dailyGoalMinutes)}`;
    document.getElementById('goal-progress').style.width = `${stats.goalProgressPercent}%`;
    document.getElementById('motivation').textContent = stats.motivationMessage;
    document.getElementById('most-subject').textContent = stats.mostStudiedSubject?.subject || '-';

    renderActivity(activityResponse.activity);
    renderAchievements(stats.achievements);

    setFocusIdle();
  }

  await loadSubjects();
  await refreshAll();
})();
