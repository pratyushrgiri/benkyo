(function initTheme() {
  const saved = localStorage.getItem('benkyo_theme') || 'system';
  document.documentElement.dataset.theme = saved;

  window.applyTheme = function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('benkyo_theme', theme);
  };
})();
