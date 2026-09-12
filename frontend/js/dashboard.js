(async function initDashboard() {
  if (!window.requireAuth) return;

  const user = await window.requireAuth();
  if (!user) return;

  const welcome = document.getElementById('welcome');
  welcome.textContent = `Good to see you, ${user.username}.`;

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
      li.className = item.unlocked ? 'unlocked' : 'locked';
      const mark = document.createElement('span');
      mark.className = 'mark';
      li.appendChild(mark);
      li.appendChild(document.createTextNode(item.name));
      list.appendChild(li);
    }
  }

  async function refreshAll() {
    const statsResponse = await window.api.request('/api/stats');
    const stats = statsResponse;

    const activityResponse = await window.api.request('/api/stats/activity');

    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('longest-streak').textContent = stats.longestStreak;
    document.getElementById('today-focus').textContent = formatMinutes(stats.todayFocusMinutes);
    document.getElementById('total-focus').textContent = formatMinutes(stats.totalFocusMinutes);
    document.getElementById('total-sessions').textContent = String(stats.completedSessions);
    document.getElementById('most-subject').textContent = stats.mostStudiedSubject?.subject || '-';

    renderActivity(activityResponse.activity);
    renderAchievements(stats.achievements);
  }

  await refreshAll();
})();
