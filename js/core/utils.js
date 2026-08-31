// =====================================================
// ANNIDA2FINANCE - Utility Functions (shared)
// =====================================================

// Escape HTML untuk mencegah XSS
export function escapeHTML(str) {
  if (!str) return '-';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Format currency IDR
export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Format date to Indonesian locale
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Get current month and year
export function getMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Show toast notification (Dynamic & Glassmorphism styled)
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    // Dynamic styles for the container
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const colors = {
    success: 'rgba(34, 197, 94, 0.2)',
    error: 'rgba(239, 68, 68, 0.2)',
    warning: 'rgba(245, 158, 11, 0.2)',
    info: 'rgba(59, 130, 246, 0.2)'
  };
  const borders = {
    success: 'rgba(34, 197, 94, 0.4)',
    error: 'rgba(239, 68, 68, 0.4)',
    warning: 'rgba(245, 158, 11, 0.4)',
    info: 'rgba(59, 130, 246, 0.4)'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Custom toast styling (frosted glass)
  toast.style.background = colors[type] || 'rgba(255, 255, 255, 0.08)';
  toast.style.backdropFilter = 'blur(16px)';
  toast.style.webkitBackdropFilter = 'blur(16px)';
  toast.style.border = `1px solid ${borders[type] || 'rgba(255, 255, 255, 0.2)'}`;
  toast.style.borderRadius = '12px';
  toast.style.padding = '14px 24px';
  toast.style.color = '#ffffff';
  toast.style.fontSize = '0.95rem';
  toast.style.fontWeight = '500';
  toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.25)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-20px)';
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.style.cssText = 'font-size: 1.1rem; display: flex; align-items: center;';
  iconSpan.textContent = icons[type] || 'ℹ️';

  const msgSpan = document.createElement('span');
  msgSpan.className = 'toast-message';
  msgSpan.style.cssText = 'line-height: 1.2; word-break: break-word;';
  msgSpan.textContent = message;

  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  container.appendChild(toast);
  
  // Trigger transition
  toast.offsetHeight; // Force reflow
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Setup dark/light theme toggle
export function setupThemeToggle(btnId = 'theme-toggle') {
  const btns = document.querySelectorAll('.theme-toggle, #' + btnId);
  if (!btns.length) return;
  
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon(next);
    });
  });
}

export function updateThemeIcon(theme) {
  const btns = document.querySelectorAll('.theme-toggle, #theme-toggle');
  btns.forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

// Apply saved theme (call on every page load)
export function applySavedTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
