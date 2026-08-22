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
let _currentUser = null;
let _currentTeacher = null;
let _isAdmin = false;
let _isPembina = false;
let _isGuest = false;
export const authState = {
get currentUser() { return _currentUser; },
get currentTeacher() { return _currentTeacher; },
get isAdmin() { return _isAdmin; },
get isPembina() { return _isPembina; },
get isGuest() { return _isGuest; },
setAuth(user, teacher, admin, guest, pembina = false) {
_currentUser = user;
_currentTeacher = teacher;
_isAdmin = admin;
_isGuest = guest;
_isPembina = pembina;
}
};