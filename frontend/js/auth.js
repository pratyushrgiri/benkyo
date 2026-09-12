(async function initAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const message = document.getElementById('auth-message');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(loginForm);

      try {
        const data = await window.api.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: form.get('identifier'),
            password: form.get('password'),
          }),
        });

        window.api.setToken(data.token);
        window.location.href = '/dashboard.html';
      } catch (error) {
        message.textContent = error.message;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(registerForm);

      try {
        await window.api.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username: form.get('username'),
            email: form.get('email'),
            password: form.get('password'),
          }),
        });

        message.textContent = 'Account created. Please log in.';
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 700);
      } catch (error) {
        message.textContent = error.message;
      }
    });
  }

  window.requireAuth = async function requireAuth() {
    const token = localStorage.getItem('benkyo_token');
    if (!token) {
      window.location.href = '/login.html';
      return null;
    }

    try {
      const data = await window.api.request('/api/auth/me');
      return data.user;
    } catch {
      window.api.clearToken();
      window.location.href = '/login.html';
      return null;
    }
  };
})();
