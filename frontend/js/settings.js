(async function initSettings() {
  if (!window.requireAuth) return;
  const user = await window.requireAuth();
  if (!user) return;

  const form = document.getElementById('settings-form');
  const message = document.getElementById('settings-message');
  const logoutBtn = document.getElementById('logout-btn');
  const addSubjectBtn = document.getElementById('add-subject-btn');
  const subjectList = document.getElementById('subject-list');

  async function renderSubjects() {
    const { subjects } = await window.api.request('/api/subjects');
    subjectList.innerHTML = '';

    for (const subject of subjects) {
      const li = document.createElement('li');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'icon-btn icon-only';
      removeBtn.setAttribute('aria-label', `Delete ${subject.name}`);
      removeBtn.title = 'Delete';
      removeBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M7 7l1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"/></svg>';
      removeBtn.addEventListener('click', async () => {
        await window.api.request(`/api/subjects/${subject.id}`, { method: 'DELETE' });
        await renderSubjects();
      });

      const name = document.createElement('span');
      name.textContent = subject.name;

      li.appendChild(name);
      li.appendChild(removeBtn);
      subjectList.appendChild(li);
    }
  }

  async function load() {
    const { settings } = await window.api.request('/api/settings');

    form.focusMinutes.value = settings.timer.focusMinutes;
    form.shortBreakMinutes.value = settings.timer.shortBreakMinutes;
    form.longBreakMinutes.value = settings.timer.longBreakMinutes;
    form.sessionsBeforeLongBreak.value = settings.timer.sessionsBeforeLongBreak;
    form.dailyGoalMinutes.value = settings.dailyGoalMinutes;
    form.timerCompletion.checked = settings.sound.timerCompletion;
    form.breakCompletion.checked = settings.sound.breakCompletion;
    form.buttonSounds.checked = settings.sound.buttonSounds;
    form.volume.value = settings.sound.volume;

    form.username.value = user.username;
    form.email.value = user.email;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      await window.api.request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          timer: {
            focusMinutes: Number(form.focusMinutes.value),
            shortBreakMinutes: Number(form.shortBreakMinutes.value),
            longBreakMinutes: Number(form.longBreakMinutes.value),
            sessionsBeforeLongBreak: Number(form.sessionsBeforeLongBreak.value),
          },
          dailyGoalMinutes: Number(form.dailyGoalMinutes.value),
          sound: {
            timerCompletion: form.timerCompletion.checked,
            breakCompletion: form.breakCompletion.checked,
            buttonSounds: form.buttonSounds.checked,
            volume: Number(form.volume.value),
          },
          appearance: {
            theme: 'light',
          },
        }),
      });

      addSubjectBtn.addEventListener('click', async () => {
        const name = form.newSubject.value.trim();
        if (!name) return;

        try {
          await window.api.request('/api/subjects', {
            method: 'POST',
            body: JSON.stringify({ name }),
          });
          form.newSubject.value = '';
          await renderSubjects();
        } catch (error) {
          message.textContent = error.message;
        }
      });

      await window.api.request('/api/user', {
        method: 'PUT',
        body: JSON.stringify({
          username: form.username.value,
          email: form.email.value,
        }),
      });

      message.textContent = 'Settings saved.';
    } catch (error) {
      message.textContent = error.message;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await window.api.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout error and clear local token anyway
    }

    window.api.clearToken();
    window.location.href = '/login.html';
  });

  await load();
  await renderSubjects();
})();
