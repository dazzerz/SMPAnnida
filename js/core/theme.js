/**
 * theme.js – Dedicated Light Mode Theme Manager for SMP Annida (per DESIGN.md)
 * Features:
 * - Locks data-theme="light" permanently on both <html> and <body>
 * - Removes class="dark" for Tailwind CSS
 * - Sets light-mode Chart.js defaults
 * - Keeps API methods safe & backward-compatible
 */

const THEME_STORAGE_KEY = 'smpannida_theme';

export function getSystemTheme() {
  return 'light';
}

export function getSavedTheme() {
  return 'light';
}

export function applyTheme(theme = 'light') {
  // Always lock to light theme per DESIGN.md
  const targetTheme = 'light';
  
  // 1. Set data-theme on <html> and <body>
  document.documentElement.setAttribute('data-theme', targetTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', targetTheme);
  }

  // 2. Ensure "dark" class is removed and "light" is active for Tailwind CSS
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  if (document.body) {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  }

  // 3. Persist permanent light theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
    localStorage.setItem('theme', targetTheme);
  } catch (_) {
    // Ignore storage errors in restricted contexts
  }

  // 4. Update Chart.js defaults if Chart is in scope (High contrast on light)
  if (typeof window !== 'undefined' && typeof window.Chart !== 'undefined') {
    window.Chart.defaults.color = '#475569';
    window.Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.08)';
  }

  // 5. Hide or deactivate any remaining toggle buttons
  const toggleBtns = document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.style.display = 'none';
  });

  // 6. Dispatch custom event for reactive modules
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: 'light' } }));
}

export function toggleTheme() {
  // Permanent light mode: always ensure light mode remains active
  applyTheme('light');
  return 'light';
}

export function initTheme() {
  applyTheme('light');
}

export function bindThemeSwitcher(btnElementOrId = 'theme-toggle-btn') {
  const btn = typeof btnElementOrId === 'string' ? document.getElementById(btnElementOrId) : btnElementOrId;
  if (!btn) return;
  // Hide toggle button gracefully
  btn.style.display = 'none';
}

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
  window.initTheme = initTheme;
  window.bindThemeSwitcher = bindThemeSwitcher;
}

// Immediate execution
initTheme();

