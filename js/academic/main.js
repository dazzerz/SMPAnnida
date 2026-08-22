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
import { authState } from './authState.js';
import { injectSidebar, injectTopbar } from '../core/layout.js';
injectTopbar('topbar', {
greeting: '',
title: '',
rightHtml: ``
});
injectSidebar('sidebar');
import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;
import { escapeHTML } from '../core/utils.js';
window.escapeHTML = escapeHTML;
async function checkAuth() {
try {
const { data: { user }, error } = await db.auth.getUser();
let _user = null;
let _teacher = null;
let _admin = false;
let _pembina = false;
let _guest = false;
if (user) {
_guest = false;
localStorage.removeItem('isGuest');
_user = user;
const { data: roleData } = await db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
_admin = (roleData && roleData.role === 'admin');
_pembina = (roleData && roleData.role === 'pembina');
if (!_admin && !_pembina) {
const { data: teacherData } = await db
.from('teachers')
.select('id, nama, email')
.ilike('email', user.email)
.maybeSingle();
_teacher = teacherData || null;
if (!teacherData) {
}
const restrictedGroups = ['nav-group-main', 'nav-group-finance', 'nav-group-ppdb', 'nav-group-system'];
restrictedGroups.forEach(id => {
const el = document.getElementById(id);
if (el) el.style.display = 'none';
});
} else {
_teacher = null;
if (_pembina) {
const style = document.createElement('style');
style.textContent = `
.action-cell, .action-buttons, .td-aksi, .th-aksi, [data-action="edit"], [data-action="delete"] { display: none !important; }
button[onclick*="add"], button[onclick*="edit"], button[onclick*="delete"],
button[onclick*="save"], button[type="submit"], #btn-tambah { display: none !important; }
`;
document.head.appendChild(style);
}
}
} else {
_guest = localStorage.getItem('isGuest') === 'true';
}
authState.setAuth(_user, _teacher, _admin, _guest, _pembina || false);
if (error || (!user && !_guest)) {
window.location.href = '../../index.html';
return;
}
const profileName = document.querySelector('.user-profile span');
if (profileName) {
if (authState.isGuest) {
profileName.textContent = 'Guest (View Only)';
document.body.classList.add('guest-mode');
} else {
profileName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guru Admin';
}
}
const navUserName = document.getElementById('nav-user-name');
const navUserEmail = document.getElementById('nav-user-email');
const userAvatar = document.getElementById('user-avatar');
if (user && navUserName) {
const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
navUserName.textContent = fullName;
if (navUserEmail) navUserEmail.textContent = user.email;
if (userAvatar) userAvatar.textContent = fullName.substring(0, 2).toUpperCase();
}
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
logoutBtn.addEventListener('click', async () => {
await db.auth.signOut();
localStorage.removeItem('isGuest');
sessionStorage.removeItem('guest_mode_active');
window.location.href = '../../index.html';
});
}
window.dispatchEvent(new CustomEvent('authLoaded'));
} catch (err) {
console.error("Auth check failed:", err);
window.location.href = '../../index.html';
}
}
checkAuth();
if (localStorage.getItem('theme') === 'dark') {
document.body.classList.add('dark-theme');
}
document.addEventListener('DOMContentLoaded', () => {
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.page-section');
function handleHashChange() {
let hash = window.location.hash.replace('#', '') || 'section-dashboard';
if (!document.getElementById(hash)) {
hash = 'section-dashboard';
}
navLinks.forEach(l => l.classList.remove('active'));
sections.forEach(s => s.style.display = 'none');
const activeLink = document.querySelector(`.nav-link[data-target="${hash}"]`) || document.querySelector(`.nav-link[href="#${hash}"]`);
if (activeLink) activeLink.classList.add('active');
const targetSection = document.getElementById(hash);
if (targetSection) targetSection.style.display = 'block';
if (window.innerWidth <= 768) {
document.getElementById('sidebar').classList.remove('open');
const overlay = document.querySelector('.overlay');
if(overlay) overlay.classList.remove('active');
}
}
navLinks.forEach(link => {
link.addEventListener('click', (e) => {
e.preventDefault();
const targetId = link.getAttribute('data-target');
window.location.hash = targetId;
});
});
window.addEventListener('hashchange', handleHashChange);
handleHashChange();
const menuToggle = document.getElementById('menu-toggle');
if(menuToggle) {
menuToggle.addEventListener('click', () => {
if (window._openSidebar && window._closeSidebar) {
const sidebar = document.getElementById('sidebar');
if (sidebar && sidebar.classList.contains('open')) {
window._closeSidebar();
} else {
window._openSidebar();
}
}
});
}
document.querySelectorAll('.nav-item.nav-link').forEach(link => {
link.addEventListener('click', () => {
if (window.innerWidth <= 768 && window._closeSidebar) {
window._closeSidebar();
}
});
});
const btnThemeToggle = document.getElementById('btn-theme-toggle');
if (btnThemeToggle) {
btnThemeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
btnThemeToggle.addEventListener('click', () => {
document.body.classList.toggle('dark-theme');
const isDark = document.body.classList.contains('dark-theme');
localStorage.setItem('theme', isDark ? 'dark' : 'light');
btnThemeToggle.textContent = isDark ? '☀️' : '🌙';
});
}
});