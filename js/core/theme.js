/**
 * theme.js – Robust Standalone Dual-Theme Manager for SMP Annida
 * Features:
 * - Syncs data-theme="light" | "dark" on both <html> and <body>
 * - Syncs class="dark" for Tailwind CSS darkMode: "class"
 * - Global event delegation for #theme-toggle-btn and .theme-toggle-btn
 * - window.toggleTheme global exposure
 * - Zero-FOUC & localStorage persistence
 */

const THEME_STORAGE_KEY = 'smpannida_theme';

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('theme') || 'light';
}

export function applyTheme(theme) {
  const targetTheme = (theme === 'dark') ? 'dark' : 'light';
  
  // 1. Set data-theme on <html> and <body>
  document.documentElement.setAttribute('data-theme', targetTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', targetTheme);
  }

  // 2. Set/remove "dark" class for Tailwind CSS compatibility
  if (targetTheme === 'dark') {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
  }

  // 3. Persist in localStorage
  localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
  localStorage.setItem('theme', targetTheme);

  // 4. Update Chart.js defaults if Chart is in scope
  if (typeof window.Chart !== 'undefined') {
    const isDark = targetTheme === 'dark';
    window.Chart.defaults.color = isDark ? '#94a3b8' : '#334155';
    window.Chart.defaults.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(203,213,225,0.4)';
  }

  // 5. Update aria-labels on all toggle buttons
  const toggleBtns = document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.setAttribute('aria-label', targetTheme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
    btn.setAttribute('title', targetTheme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
  });

  // 6. Dispatch custom event for reactive modules
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: targetTheme } }));
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getSavedTheme();
  const next = (current === 'dark') ? 'light' : 'dark';
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
    e.stopPropagation();
    toggleTheme();
  };
}

// Attach to window for global access (inline onclick or legacy scripts)
if (typeof window !== 'undefined') {
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
  window.initTheme = initTheme;
  window.bindThemeSwitcher = bindThemeSwitcher;
}

// Global click event delegation (supports dynamic topbar, inline buttons, icon SVGs)
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const toggleTarget = e.target.closest('#theme-toggle-btn, .theme-toggle-btn');
    if (toggleTarget) {
      e.preventDefault();
      e.stopPropagation();
      toggleTheme();
    }
  }, true); // Capture phase to intercept clicks reliably
}

// Immediate initial execution
initTheme();
