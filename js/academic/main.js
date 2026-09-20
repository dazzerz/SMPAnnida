import { authState } from './authState.js';
import { injectSidebar, injectTopbar } from '../core/layout.js';
import { resolveUserRole } from '../core/auth.js';
injectTopbar('topbar', {
  greeting: '',
  title: '',
  rightHtml: ``
});

injectSidebar('sidebar');

// The academic nav-group is now populated statically in core/layout.js
// so that all pages can see the full academic navigation menu.

import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;

// NOTE: window.isGuest is set inside checkAuth() AFTER session is confirmed.
// Do NOT set it here synchronously — that causes a race condition.

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

        // Only AFTER we know the session status do we decide on isGuest.
        if (user) {
            // Valid session - override any stale isGuest flag
            _guest = false;
            localStorage.removeItem('isGuest');

            _user = user;

            // Resolve role cleanly via centralized helper
            const role = await resolveUserRole(user);
            
            _admin = (role === 'admin');
            _pembina = (role === 'pembina');

            if (!_admin && !_pembina) {
                const { data: teacherData } = await db
                    .from('teachers')
                    .select('id, nama, email')
                    .ilike('email', user.email || '')
                    .maybeSingle();
                
                _teacher = teacherData || null;
                if (!teacherData) {
                    
                }

                // Sembunyikan menu non-akademik untuk Guru
                const restrictedGroups = ['nav-group-main', 'nav-group-finance', 'nav-group-ppdb', 'nav-group-system'];
                restrictedGroups.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.setProperty('display', 'none', 'important');
                });
            } else {
                _teacher = null;
                
                if (_pembina) {
                    // Inject CSS to hide all action buttons in Academic globally
                    const style = document.createElement('style');
                    style.textContent = `
                        .action-cell, .action-buttons, .td-aksi, .th-aksi, [data-action="edit"], [data-action="delete"] { display: none; }
                        button[onclick*="add"], button[onclick*="edit"], button[onclick*="delete"], 
                        button[onclick*="save"], button[type="submit"], #btn-tambah { display: none; }
                    `;
                    document.head.appendChild(style);
                }
            }
        } else {
            // No valid session - check if user intentionally chose guest mode
            _guest = localStorage.getItem('isGuest') === 'true';
        }

        // Commit to auth module
        authState.setAuth(_user, _teacher, _admin, _guest, _pembina || false);

        if (!user && !_guest) {
            if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
            return;
        }

        // Update profil UI
        const profileName = document.querySelector('.user-profile span');
        if (profileName) {
            if (authState.isGuest) {
                profileName.textContent = 'Guest (View Only)';
                document.body.classList.add('guest-mode');
            } else {
                profileName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guru Admin';
            }
        }

        // Update sidebar user info jika tersedia
        const navUserName = document.getElementById('nav-user-name');
        const navUserEmail = document.getElementById('nav-user-email');
        const userAvatar = document.getElementById('user-avatar');
        if (user && navUserName) {
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
            navUserName.textContent = fullName;
            if (navUserEmail) navUserEmail.textContent = user.email;
            if (userAvatar) userAvatar.textContent = fullName.substring(0, 2).toUpperCase();
        }

        // Bind logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await db.auth.signOut();
                localStorage.removeItem('isGuest');
                sessionStorage.removeItem('guest_mode_active');
                if(window.smoothRedirect){window.smoothRedirect('../../index.html');}else{window.location.href='../../index.html';}
            });
        }

        // P1 Fix: Dispatch event so other modules don't need to poll with setTimeout
        window.dispatchEvent(new CustomEvent('authLoaded'));

    } catch (err) {
        console.error("Auth check failed:", err);
        if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
    }
}
// Jalankan cek auth
checkAuth();

// Dark mode initialization (sebelum DOM dimuat penuh agar tidak berkedip)
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}


// ── SPA Router & Section Switcher ──
const lazyModules = [
    'data-siswa', 'data-guru', 'guru', 'absensi-guru', 'jurnal-guru',
    'absensi', 'nilai', 'rapor', 'jadwal', 'mata-pelajaran', 'kelas',
    'cbt-admin', 'cbt', 'materi-lms', 'tugas-lms', 'data-migration'
];

export async function handleAcademicHashChange() {
    let rawHash = window.location.hash.replace('#', '') || 'dashboard';
    let hash = rawHash;
    // Map alternate hashes to section IDs
    let targetId = hash;
    if (hash === 'data-guru') targetId = 'guru';
    else if (hash === 'cbt') targetId = 'cbt-admin';

    // Sembunyikan semua .page-section seperti biasa
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-link, .nav-item').forEach(l => l.classList.remove('active'));

    let targetSection = document.getElementById(targetId);

    if (!targetSection && lazyModules.includes(hash)) {
        try {
            let fileName = `${hash}.html`;
            if (hash === 'guru' || hash === 'data-guru') fileName = 'guru.html';
            else if (hash === 'cbt' || hash === 'cbt-admin') fileName = 'cbt-admin.html';

            const res = await fetch(`../../pages/academic/partials/${fileName}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const htmlData = await res.text();
            const contentArea = document.querySelector('.content-area') || document.querySelector('main');
            if (contentArea) {
                contentArea.insertAdjacentHTML('beforeend', htmlData);
            }
            targetSection = document.getElementById(targetId);

            // Trigger initialization hook berdasarkan hash/modul
            if (hash === 'data-siswa' && typeof window.loadStudents === 'function') {
                window.loadStudents();
            } else if ((hash === 'guru' || hash === 'data-guru') && typeof window.loadTeachers === 'function') {
                window.loadTeachers();
            } else if (hash === 'absensi-guru' && typeof window.loadAttendance === 'function') {
                window.loadAttendance();
            } else if (hash === 'jurnal-guru' && typeof window.loadJournals === 'function') {
                window.loadJournals();
            } else if (hash === 'absensi' && typeof window.loadStudentAttendance === 'function') {
                window.loadStudentAttendance();
            } else if ((hash === 'nilai' || hash === 'rapor') && typeof window.loadGrades === 'function') {
                window.loadGrades();
            } else if (hash === 'jadwal' && typeof window.loadSchedules === 'function') {
                window.loadSchedules();
            } else if (hash === 'mata-pelajaran' && typeof window.loadSubjects === 'function') {
                window.loadSubjects();
            } else if (hash === 'kelas' && typeof window.loadClasses === 'function') {
                window.loadClasses();
            } else if ((hash === 'tugas-lms' || hash === 'cbt-admin' || hash === 'cbt') && typeof window.loadLms === 'function') {
                window.loadLms();
            } else if (hash === 'materi-lms' && typeof window.loadMateri === 'function') {
                window.loadMateri();
            } else if (hash === 'data-migration' && typeof window.loadMigration === 'function') {
                window.loadMigration();
            }

            window.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { id: targetId, originalHash: hash } }));
        } catch (err) {
            console.error(`Gagal memuat partial ${hash}:`, err);
        }
    }

    if (!targetSection && !lazyModules.includes(hash)) {
        targetId = 'dashboard';
        targetSection = document.getElementById('dashboard');
    }

    if (targetSection) {
        targetSection.style.display = 'block';
    }

    const activeLink = document.querySelector(`.nav-link[data-target="${rawHash}"]`) || 
                       document.querySelector(`.nav-link[data-target="${targetId}"]`) || 
                       document.querySelector(`.nav-link[href*="#${rawHash}"]`) || 
                       document.querySelector(`.nav-link[href*="#${targetId}"]`) || 
                       document.querySelector(`#nav-group-academic [data-target="${rawHash}"]`) ||
                       document.querySelector(`#nav-group-academic [data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');

    if (window.innerWidth < 768) {
        document.getElementById('sidebar')?.classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay') || document.querySelector('.overlay');
        if (overlay) overlay.classList.remove('show', 'active');
        if (window._closeSidebar) window._closeSidebar();
    }
}

window.addEventListener('hashchange', handleAcademicHashChange);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleAcademicHashChange);
} else {
    handleAcademicHashChange();
}

// Global click delegation for academic navigation
document.addEventListener('click', (e) => {
    const link = e.target.closest('#nav-group-academic .nav-item, .nav-link');
    if (link) {
        const href = link.getAttribute('href');
        const target = link.getAttribute('data-target') || (href && href.includes('#') ? href.split('#')[1] : null);
        if (target && (document.getElementById(target) || lazyModules.includes(target))) {
            e.preventDefault();
            window.location.hash = target;
            handleAcademicHashChange();
        }
    }
});


// Toggle Sidebar – delegates to layout.js helpers if available
const menuToggle = document.getElementById('menu-toggle');
if (menuToggle) {
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

// Also close sidebar when nav link is clicked on mobile
document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-item, .nav-link')) {
        if (window.innerWidth < 768 && window._closeSidebar) {
            window._closeSidebar();
        }
    }
});

// Toggle Dark Mode
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

// Legacy loadAbsensiClasses removed in favor of Master Kelas (kelas.js)

import './materi.js';
