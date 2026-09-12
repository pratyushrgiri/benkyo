(function initApi() {
  const API_BASE = "https://benkyo-hx9n.onrender.com";

  function token() {
    return localStorage.getItem('benkyo_token');
  }

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token()) {
      headers.Authorization = 'Bearer ' + token();
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  window.api = {
    request,
    setToken(value) {
      localStorage.setItem('benkyo_token', value);
    },
    clearToken() {
      localStorage.removeItem('benkyo_token');
    },
  };
})();
