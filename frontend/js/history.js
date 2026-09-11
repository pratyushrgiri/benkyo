(async function initHistory() {
  if (!window.requireAuth) return;
  const user = await window.requireAuth();
  if (!user) return;

  const container = document.getElementById('history-list');
  const { sessions } = await window.api.request('/api/sessions');

  if (!sessions.length) {
    container.innerHTML = '<p>No completed sessions yet.</p>';
    return;
  }

  const grouped = sessions.reduce((acc, session) => {
    const day = session.completedAt.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(session);
    return acc;
  }, {});

  container.innerHTML = '';

  for (const day of Object.keys(grouped).sort((a, b) => b.localeCompare(a))) {
    const section = document.createElement('section');
    section.className = 'history-day';

    const heading = document.createElement('h2');
    heading.textContent = day;
    section.appendChild(heading);

    for (const session of grouped[day]) {
      const row = document.createElement('div');
      row.className = 'session-row';
      row.innerHTML = `<div><strong>${session.subjectName}</strong><small>${new Date(session.completedAt).toLocaleTimeString()}</small>${
        session.note ? `<small>${session.note}</small>` : ''
      }</div><div>${session.durationMinutes}m</div>`;
      section.appendChild(row);
    }

    container.appendChild(section);
  }
})();
