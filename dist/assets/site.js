(() => {
  const STORAGE_KEY = 'echemai-reading-width';
  const ALLOWED = new Set(['narrow', 'standard', 'wide']);
  const buttons = Array.from(document.querySelectorAll('[data-reading-width]'));

  if (!buttons.length) return;

  function applyWidth(value, persist = true) {
    const width = ALLOWED.has(value) ? value : 'standard';
    document.documentElement.dataset.readingWidth = width;
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.readingWidth === width));
    });
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, width); } catch (_) {}
    }
  }

  let initial = 'standard';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (ALLOWED.has(saved)) initial = saved;
  } catch (_) {}

  applyWidth(initial, false);
  buttons.forEach((button) => {
    button.addEventListener('click', () => applyWidth(button.dataset.readingWidth));
  });
})();
