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
import supabaseClient from '../core/supabase.js';
import { requireAuth, handleLogout } from '../core/auth.js';
import { showToast, setupThemeToggle, applySavedTheme } from '../core/utils.js';
document.addEventListener('DOMContentLoaded', async () => {
applySavedTheme();
setupThemeToggle();
const user = await requireAuth();
if (!user) return;
const email = user.email || '';
document.getElementById('nav-user-email').textContent = email;
document.getElementById('nav-user-name').textContent = email.split('@')[0];
document.getElementById('user-avatar').textContent = email.charAt(0).toUpperCase();
document.getElementById('logout-btn').addEventListener('click', handleLogout);
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
mobileMenuBtn.addEventListener('click', () => {
sidebar.classList.add('open');
overlay.classList.add('show');
});
overlay.addEventListener('click', () => {
sidebar.classList.remove('open');
overlay.classList.remove('show');
});
const geminiInput = document.getElementById('gemini-key');
const whatsappInput = document.getElementById('whatsapp-number');
const savedKey = localStorage.getItem('gemini_api_key') || '';
geminiInput.value = savedKey;
try {
const { data: profile, error } = await supabaseClient
.from('profiles')
.select('whatsapp_number')
.eq('id', user.id)
.maybeSingle();
if (error) {
console.error('Error fetching profile:', error);
} else if (profile && profile.whatsapp_number) {
whatsappInput.value = profile.whatsapp_number;
}
} catch (err) {
console.error('Failed to load profile settings:', err);
}
document.getElementById('settings-form').addEventListener('submit', async (e) => {
e.preventDefault();
const keyVal = geminiInput.value.trim();
const whatsappVal = whatsappInput.value.trim();
const whatsappClean = whatsappVal.replace(/[^0-9]/g, '');
try {
localStorage.setItem('gemini_api_key', keyVal);
const { error } = await supabaseClient
.from('profiles')
.update({
whatsapp_number: whatsappClean || null,
updated_at: new Date().toISOString()
})
.eq('id', user.id);
if (error) {
if (error.code === '23505') {
showToast('Nomor WhatsApp sudah digunakan oleh akun lain!', 'error');
} else {
showToast('Gagal menyimpan nomor WhatsApp: ' + error.message, 'error');
}
} else {
showToast('Pengaturan berhasil disimpan!', 'success');
}
} catch (err) {
console.error('Error saving settings:', err);
showToast('Terjadi kesalahan saat menyimpan pengaturan.', 'error');
}
});
});