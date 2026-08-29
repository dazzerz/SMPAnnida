/**
 * theme.js – Standalone Dual-Theme Manager for SMP Annida
 * Handles: Zero-FOUC initialization, localStorage persistence, System theme matching, & Chart.js live updates.
 */

const THEME_STORAGE_KEY = 'smpannida_theme';

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'light'; // Default: Clean Emerald Light
}

export function applyTheme(theme) {
  const targetTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', targetTheme);
  localStorage.setItem(THEME_STORAGE_KEY, targetTheme);

  // Update Chart.js defaults if Chart library is available
  if (typeof window.Chart !== 'undefined') {
    const isDark = targetTheme === 'dark';
    window.Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
    window.Chart.defaults.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(203,213,225,0.4)';
  }

  // Update toggle button aria & titles if in DOM
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.setAttribute('aria-label', targetTheme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
    btn.setAttribute('title', targetTheme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
  }

  // Dispatch reactive custom event
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: targetTheme } }));
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getSavedTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function initTheme() {
  const theme = getSavedTheme();
  applyTheme(theme);

  // Listen to system preference changes if user hasn't explicitly set preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

export function bindThemeSwitcher(btnElementOrId = 'theme-toggle-btn') {
  const btn = typeof btnElementOrId === 'string' ? document.getElementById(btnElementOrId) : btnElementOrId;
  if (!btn) return;
  btn.onclick = (e) => {
    e.preventDefault();
    toggleTheme();
  };
}

// Global click delegation for all theme toggle buttons
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const toggleTarget = e.target.closest('#theme-toggle-btn, .theme-toggle-btn');
    if (toggleTarget) {
      e.preventDefault();
      toggleTheme();
    }
  });
}

// Auto-run early execution
initTheme();
