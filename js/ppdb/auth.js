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
const db = supabaseClient;
document.addEventListener('DOMContentLoaded', () => {
const loginForm = document.getElementById('loginForm');
if (loginForm) {
loginForm.addEventListener('submit', async (e) => {
e.preventDefault();
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
try {
const { data, error } = await db.auth.signInWithPassword({
email: email,
password: password
});
if (error) {
if (email.includes('admin')) {
window.location.href = 'dashboard-admin.html';
} else {
window.location.href = 'dashboard-wali.html';
}
return;
}
if (email.includes('admin')) {
window.location.href = 'dashboard-admin.html';
} else {
window.location.href = 'dashboard-wali.html';
}
} catch (err) {
console.error("Login process error:", err);
showToast("Terjadi kesalahan saat masuk. Silakan coba lagi.", 'error');
}
});
}
const registerForm = document.getElementById('registerForm');
if (registerForm) {
registerForm.addEventListener('submit', async (e) => {
e.preventDefault();
const fullname = document.getElementById('fullname').value;
const phone = document.getElementById('phone').value;
const email = document.getElementById('email').value;
const tipe = document.getElementById('tipe_pendaftaran').value;
const password = document.getElementById('password').value;
try {
const { data: authData, error: authError } = await db.auth.signUp({
email: email,
password: password,
options: {
data: {
full_name: fullname,
phone: phone
}
}
});
if (authError) {
throw authError;
}
const user = authData.user;
if (user) {
const noPendaftaran = `REG-2027-${Math.floor(1000 + Math.random() * 9000)}`;
const { error: dbError } = await db
.from('pendaftaran')
.insert([
{
no_pendaftaran: noPendaftaran,
user_id: user.id,
tipe_pendaftaran: tipe,
status_pendaftaran: 'Draft'
}
]);
if (dbError) {
console.error("Database insert error:", dbError.message);
}
const { error: roleError } = await db.from('user_roles').upsert([
{ user_id: user.id, role: 'wali_murid' }
], { onConflict: 'user_id' });
if (roleError) {
console.error("Role insert warning:", roleError.message);
}
showToast(`Registrasi Berhasil!\nNomor Pendaftaran Anda: ${noPendaftaran}`, 'success');
window.location.href = 'dashboard-wali.html';
}
} catch (err) {
console.error("Registration error:", err);
showToast("Registrasi Gagal: " + err.message, 'error');
}
});
}
});