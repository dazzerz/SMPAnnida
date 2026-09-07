/**
 * theme.js – Dedicated Midnight Emerald Dark Theme Manager for SMP Annida
 * Features:
 * - Locks data-theme="dark" permanently on both <html> and <body>
 * - Ensures class="dark" is active for Tailwind CSS
 * - Eliminates light-mode style collisions & glare
 * - Keeps API methods safe & backward-compatible
 */

const THEME_STORAGE_KEY = 'smpannida_theme';

export function getSystemTheme() {
  return 'dark';
}

export function getSavedTheme() {
  return 'dark';
}

export function applyTheme(theme = 'dark') {
  // Always lock to dark theme
  const targetTheme = 'dark';
  
  // 1. Set data-theme on <html> and <body>
  document.documentElement.setAttribute('data-theme', targetTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', targetTheme);
  }

  // 2. Ensure "dark" class is active for Tailwind CSS
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
  if (document.body) {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }

  // 3. Persist permanent dark theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
    localStorage.setItem('theme', targetTheme);
  } catch (_) {
    // Ignore storage errors in restricted contexts
  }

  // 4. Update Chart.js defaults if Chart is in scope
  if (typeof window !== 'undefined' && typeof window.Chart !== 'undefined') {
    window.Chart.defaults.color = '#94a3b8';
    window.Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
  }

  // 5. Hide or deactivate any remaining toggle buttons
  const toggleBtns = document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.style.display = 'none';
  });

  // 6. Dispatch custom event for reactive modules
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: 'dark' } }));
}

export function toggleTheme() {
  // Permanent dark mode: always ensure dark mode remains active
  applyTheme('dark');
  return 'dark';
}

export function initTheme() {
  applyTheme('dark');
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

