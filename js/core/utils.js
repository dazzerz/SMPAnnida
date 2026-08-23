(function(){
const allowed = ["dazzerz.github.io", "localhost", "127.0.0.1"];
const host = window.location.hostname;
if (!allowed.includes(host) && host !== "") {
document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;background-color:#0b1320;color:#ef4444;font-family:sans-serif;font-size:2rem;font-weight:bold;'>Unauthorized Domain Access Restricted</div>";
throw new Error("Access restricted");
}
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
if (e.key === 'F12' ||
(e.ctrlKey && e.shiftKey && e.key === 'I') ||
(e.ctrlKey && e.shiftKey && e.key === 'J') ||
(e.ctrlKey && e.key === 'U')) {
e.preventDefault();
}
});
})();
export function escapeHTML(str) {
if (!str) return '-';
const div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}
export function formatCurrency(amount) {
return new Intl.NumberFormat('id-ID', {
style: 'currency',
currency: 'IDR',
minimumFractionDigits: 0,
maximumFractionDigits: 0,
}).format(amount || 0);
}
export function formatDate(dateStr) {
if (!dateStr) return '-';
return new Date(dateStr).toLocaleDateString('id-ID', {
day: 'numeric',
month: 'short',
year: 'numeric',
});
}
export function getMonthYear() {
const now = new Date();
return { month: now.getMonth() + 1, year: now.getFullYear() };
}
export function showToast(message, type = 'info') {
let container = document.getElementById('toast-container');
if (!container) {
container = document.createElement('div');
container.id = 'toast-container';
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
toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
toast.innerHTML = `
<span class="toast-icon" style="font-size: 1.1rem; display: flex; align-items: center;">${icons[type] || 'ℹ️'}</span>
<span class="toast-message" style="line-height: 1.2;">${message}</span>
`;
container.appendChild(toast);
toast.offsetHeight;
toast.style.opacity = '1';
toast.style.transform = 'translateY(0)';
setTimeout(() => {
toast.style.opacity = '0';
toast.style.transform = 'translateY(-20px)';
setTimeout(() => toast.remove(), 300);
}, 3500);
}
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
export function applySavedTheme() {
const saved = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
updateThemeIcon(saved);
}