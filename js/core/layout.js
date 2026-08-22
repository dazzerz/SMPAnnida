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
export function injectSidebar(containerId) {
const container = document.getElementById(containerId);
if (!container) return;
if (!document.getElementById('phosphor-icons')) {
const script = document.createElement('script');
script.id = 'phosphor-icons';
script.src = 'https://unpkg.com/@phosphor-icons/web';
document.head.appendChild(script);
}
const path = window.location.pathname;
const basePath = path.includes('/pages/') ? '../../' : './';
container.innerHTML = `
<div class="sidebar-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
<div style="display:flex; align-items:center; gap:0.75rem;">
<div class="sidebar-logo-icon"><img src="${basePath}1.png" alt="Logo Annida"></div>
<div class="sidebar-brand">SMPAnnida</div>
</div>
<button class="sidebar-mini-toggle" id="sidebar-mini-toggle" aria-label="Toggle Sidebar"><i class="ph ph-caret-left"></i></button>
<button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Tutup menu">✕</button>
</div>
<!-- Sidebar Search -->
<div class="sidebar-search-wrapper">
<div class="sidebar-search-container">
<i class="ph ph-magnifying-glass search-icon"></i>
<input type="text" id="sidebar-search" placeholder="Cari menu... (Ctrl+K)" class="form-input sidebar-search-input">
</div>
</div>
<nav class="sidebar-nav">
<!-- MAIN -->
<div class="nav-group accordion-group" id="nav-group-main">
<div class="nav-group-title accordion-toggle">
<span>Main</span>
<i class="ph ph-caret-down accordion-icon"></i>
</div>
<div class="nav-group-content">
<div class="nav-group-inner">
<a href="${basePath}dashboard.html" class="nav-item" data-tooltip="Super Dashboard">
<i class="ph ph-squares-four nav-icon"></i> <span class="nav-text">Super Dashboard</span>
</a>
</div>
</div>
</div>
<!-- AKADEMIK -->
<div class="nav-group accordion-group" id="nav-group-academic">
<div class="nav-group-title accordion-toggle">
<span>Akademik & Kesiswaan</span>
<i class="ph ph-caret-down accordion-icon"></i>
</div>
<div class="nav-group-content">
<div class="nav-group-inner">
<a href="${basePath}pages/academic/dashboard.html#dashboard" class="nav-item nav-link" data-target="dashboard" data-tooltip="Dashboard">
<i class="ph ph-chart-line-up nav-icon"></i> <span class="nav-text">Dashboard</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#data-siswa" class="nav-item nav-link" data-target="data-siswa" data-tooltip="Data Siswa">
<i class="ph ph-users nav-icon"></i> <span class="nav-text">Data Siswa</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#jadwal" class="nav-item nav-link" data-target="jadwal" data-tooltip="Jadwal">
<i class="ph ph-calendar-blank nav-icon"></i> <span class="nav-text">Jadwal</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#nilai" class="nav-item nav-link" data-target="nilai" data-tooltip="Nilai">
<i class="ph ph-exam nav-icon"></i> <span class="nav-text">Nilai</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#rapor" class="nav-item nav-link" data-target="rapor" data-tooltip="Rapor">
<i class="ph ph-file-text nav-icon"></i> <span class="nav-text">Rapor</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#absensi" class="nav-item nav-link" data-target="absensi" data-tooltip="Absensi Siswa">
<i class="ph ph-clipboard-text nav-icon"></i> <span class="nav-text">Absensi Siswa</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#jurnal-guru" class="nav-item nav-link" data-target="jurnal-guru" data-tooltip="Jurnal Guru">
<i class="ph ph-notebook nav-icon"></i> <span class="nav-text">Jurnal Guru</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#absensi-guru" class="nav-item nav-link" data-target="absensi-guru" data-tooltip="Absensi Guru">
<i class="ph ph-chalkboard-teacher nav-icon"></i> <span class="nav-text">Absensi Guru</span>
</a>
<a href="${basePath}pages/academic/dashboard.html#data-migration" class="nav-item nav-link" data-target="data-migration" data-tooltip="Data Migration">
<i class="ph ph-database nav-icon"></i> <span class="nav-text">Data Migration</span>
</a>
</div>
</div>
</div>
<!-- KEUANGAN -->
<div class="nav-group accordion-group" id="nav-group-finance">
<div class="nav-group-title accordion-toggle">
<span>Keuangan</span>
<i class="ph ph-caret-down accordion-icon"></i>
</div>
<div class="nav-group-content">
<div class="nav-group-inner">
<a href="${basePath}pages/finance/dashboard.html#transactions" class="nav-item" data-target="transactions" data-tooltip="Transaksi Kas">
<i class="ph ph-money nav-icon"></i> <span class="nav-text">Transaksi Kas</span>
</a>
<a href="${basePath}pages/finance/dashboard.html#budget" class="nav-item" data-target="budget" data-tooltip="Budget Bulanan">
<i class="ph ph-target nav-icon"></i> <span class="nav-text">Budget Bulanan</span>
</a>
<a href="${basePath}pages/finance/dashboard.html#rab" class="nav-item" data-target="rab" data-tooltip="RAB Kelas">
<i class="ph ph-clipboard-list nav-icon"></i> <span class="nav-text">RAB Kelas</span>
</a>
<a href="${basePath}pages/finance/dashboard.html#reports" class="nav-item" data-target="reports" data-tooltip="Laporan">
<i class="ph ph-chart-pie-slice nav-icon"></i> <span class="nav-text">Laporan</span>
</a>
<a href="${basePath}pages/finance/dashboard.html#syahriah" class="nav-item" data-target="syahriah" data-tooltip="Syahriah Guru">
<i class="ph ph-wallet nav-icon"></i> <span class="nav-text">Syahriah Guru</span>
</a>
</div>
</div>
</div>
<!-- PPDB -->
<div class="nav-group accordion-group" id="nav-group-ppdb">
<div class="nav-group-title accordion-toggle">
<span>Penerimaan (PPDB)</span>
<i class="ph ph-caret-down accordion-icon"></i>
</div>
<div class="nav-group-content">
<div class="nav-group-inner">
<a href="${basePath}pages/ppdb/dashboard-admin.html" class="nav-item" data-tooltip="Pendaftar Baru">
<i class="ph ph-user-plus nav-icon"></i> <span class="nav-text">Pendaftar Baru</span>
</a>
</div>
</div>
</div>
<!-- SISTEM -->
<div class="nav-group accordion-group" id="nav-group-system">
<div class="nav-group-title accordion-toggle">
<span>Sistem</span>
<i class="ph ph-caret-down accordion-icon"></i>
</div>
<div class="nav-group-content">
<div class="nav-group-inner">
<a href="${basePath}pages/finance/dashboard.html#settings" class="nav-item" data-target="settings" data-tooltip="Pengaturan">
<i class="ph ph-gear nav-icon"></i> <span class="nav-text">Pengaturan</span>
</a>
</div>
</div>
</div>
</nav>
<div class="sidebar-bottom-section">
<div class="user-widget">
<div class="user-avatar" id="user-avatar">G</div>
<div class="user-info">
<div class="user-name" id="nav-user-name">Guest</div>
<div class="user-email" id="nav-user-email">Belum Login</div>
</div>
</div>
<button class="sidebar-logout-btn" id="logout-btn">
<i class="ph ph-sign-out"></i> <span class="logout-text">Keluar</span>
</button>
</div>
`;
function updateActiveSidebar() {
const currentPath = window.location.pathname;
const currentHash = window.location.hash || '';
container.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
container.querySelectorAll('.accordion-group').forEach(el => el.classList.remove('active'));
let matchedItem = null;
const navItems = container.querySelectorAll('.nav-item');
for (const item of navItems) {
const href = item.getAttribute('href');
if (!href) continue;
const a = document.createElement('a');
a.href = href;
if (a.pathname === currentPath) {
if (a.hash && a.hash === currentHash) {
matchedItem = item;
break;
} else if (!a.hash && (!currentHash || currentHash === '#dashboard')) {
matchedItem = item;
}
}
}
if (!matchedItem) {
for (const item of navItems) {
const href = item.getAttribute('href');
if (!href) continue;
const a = document.createElement('a');
a.href = href;
if (a.pathname === currentPath) {
matchedItem = item;
break;
}
}
}
if (matchedItem) {
matchedItem.classList.add('active');
const parentAccordion = matchedItem.closest('.accordion-group');
if (parentAccordion) {
parentAccordion.classList.add('active');
}
}
}
updateActiveSidebar();
window.addEventListener('hashchange', updateActiveSidebar);
let overlay = document.getElementById('sidebar-overlay');
if (!overlay) {
overlay = document.createElement('div');
overlay.id = 'sidebar-overlay';
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);
}
function openSidebar() {
container.classList.add('open');
overlay.classList.add('show');
document.body.style.overflow = 'hidden';
}
function closeSidebar() {
container.classList.remove('open');
overlay.classList.remove('show');
document.body.style.overflow = '';
}
const closeBtn = document.getElementById('sidebar-close-btn');
if (closeBtn) {
closeBtn.addEventListener('click', closeSidebar);
}
overlay.addEventListener('click', closeSidebar);
document.addEventListener('click', function(e) {
if (e.target && (e.target.id === 'mobile-menu-btn' || e.target.closest('#mobile-menu-btn'))) {
if (container.classList.contains('open')) {
closeSidebar();
} else {
openSidebar();
}
}
});
const oldToggle = document.getElementById('menu-toggle');
if (oldToggle) {
oldToggle.addEventListener('click', () => {
if (container.classList.contains('open')) {
closeSidebar();
} else {
openSidebar();
}
});
}
const accordions = container.querySelectorAll('.accordion-group');
accordions.forEach(acc => {
const toggle = acc.querySelector('.accordion-toggle');
if (toggle) {
toggle.addEventListener('click', (e) => {
if (acc.classList.contains('active')) {
acc.classList.remove('active');
} else {
accordions.forEach(a => a.classList.remove('active'));
acc.classList.add('active');
}
});
}
if (acc.querySelector('.nav-item.active')) {
acc.classList.add('active');
}
});
const searchInput = document.getElementById('sidebar-search');
if (searchInput) {
searchInput.addEventListener('input', (e) => {
const query = e.target.value.toLowerCase();
const navItems = container.querySelectorAll('.nav-item');
navItems.forEach(item => {
const text = item.textContent.toLowerCase();
const parentGroup = item.closest('.accordion-group');
if (text.includes(query)) {
item.style.display = 'flex';
if (query && parentGroup) {
parentGroup.classList.add('active');
}
} else {
item.style.display = 'none';
}
});
});
document.addEventListener('keydown', (e) => {
if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
e.preventDefault();
if (!container.classList.contains('open')) {
openSidebar();
}
searchInput.focus();
}
});
}
const navItems = container.querySelectorAll('.nav-item');
navItems.forEach(item => {
item.addEventListener('click', () => {
if (window.innerWidth <= 768) {
closeSidebar();
}
});
});
window._closeSidebar = closeSidebar;
window._openSidebar = openSidebar;
const toggleBtn = document.getElementById('sidebar-mini-toggle');
const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;
function applySidebarState(isCollapsed) {
if (window.innerWidth <= 768) return;
if (isCollapsed) {
container.classList.add('collapsed');
if (toggleIcon) {
toggleIcon.classList.remove('ph-caret-left');
toggleIcon.classList.add('ph-caret-right');
}
} else {
container.classList.remove('collapsed');
if (toggleIcon) {
toggleIcon.classList.remove('ph-caret-right');
toggleIcon.classList.add('ph-caret-left');
}
}
}
const savedState = localStorage.getItem('smpannida-sidebar-state');
const isInitiallyCollapsed = savedState === null ? true : savedState === 'collapsed';
applySidebarState(isInitiallyCollapsed);
if (toggleBtn) {
toggleBtn.addEventListener('click', () => {
const willCollapse = !container.classList.contains('collapsed');
localStorage.setItem('smpannida-sidebar-state', willCollapse ? 'collapsed' : 'expanded');
applySidebarState(willCollapse);
});
}
}
export function injectTopbar(containerId, options = {}) {
const container = document.getElementById(containerId);
if (!container) return;
const greeting = options.greeting || '';
const title = options.title || '';
const rightHtml = options.rightHtml || '';
container.innerHTML = `
<div style="display:flex; align-items:center; gap:1rem;">
<button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Buka menu">☰</button>
<div class="topbar-left">
${greeting ? `<div class="topbar-greeting">${greeting}</div>` : ''}
${title ? `<div class="topbar-title">${title}</div>` : ''}
</div>
</div>
<div class="topbar-right">
${rightHtml}
</div>
`;
}