import { logError } from '../core/analytics.js';
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

// Sesi di-resolve di checkAuth() di bawah — jangan set state di sini.

import { escapeHTML } from '../core/utils.js';
window.escapeHTML = escapeHTML;

async function checkAuth() {
    try {
        const { data: { user }, error } = await db.auth.getUser();

        let _user = null;
        let _teacher = null;
        let _admin = false;
        let _pembina = false;

        if (user) {
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
        }

        // Commit to auth module
        authState.setAuth(_user, _teacher, _admin, _pembina || false);

        if (!user) {
            if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
            return;
        }

        // Update profil UI
        const profileName = document.querySelector('.user-profile span');
        if (profileName) {
            profileName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guru Admin';
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
        logError("Auth check failed:", err);
        if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
    }
}
// Jalankan cek auth
checkAuth();

// Dark mode initialization (sebelum DOM dimuat penuh agar tidak berkedip)
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}


const lazyModules = [
    'data-siswa', 'data-guru', 'guru', 'absensi-guru', 'jurnal-guru',
    'absensi', 'nilai', 'rapor', 'jadwal', 'mata-pelajaran', 'kelas',
    'data-migration'
];

export async function handleAcademicHashChange() {
    let rawHash = window.location.hash.replace('#', '') || 'dashboard';
    let hash = rawHash;
    // Map alternate hashes to section IDs
    let targetId = hash;
    if (hash === 'data-guru') targetId = 'guru';

    // Sembunyikan semua .page-section seperti biasa
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-link, .nav-item').forEach(l => l.classList.remove('active'));

    let targetSection = document.getElementById(targetId);

    if (!targetSection && lazyModules.includes(hash)) {
        try {
            let fileName = `${hash}.html`;
            if (hash === 'guru' || hash === 'data-guru') fileName = 'guru.html';

            const res = await fetch(`../../pages/academic/partials/${fileName}?v=20260927`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const htmlData = await res.text();
            const contentArea = document.querySelector('.content-area') || document.querySelector('main');
            if (contentArea) {
                contentArea.insertAdjacentHTML('beforeend', htmlData);
            }
            targetSection = document.getElementById(targetId);

            // Trigger initialization hook berdasarkan hash/modul
            // Trigger initialization hook berdasarkan hash/modul
            if (hash === 'data-siswa') {
                import('./siswa.js').then(m => m.initStudentSection?.() || (typeof window.loadStudents === 'function' && window.loadStudents()));
            } else if (hash === 'guru' || hash === 'data-guru') {
                import('./guru.js').then(m => m.initGuruSection?.() || (typeof window.loadTeachers === 'function' && window.loadTeachers()));
            } else if (hash === 'absensi-guru') {
                import('./teacher-attendance.js').then(m => m.initTeacherAttendance?.() || (typeof window.loadAttendance === 'function' && window.loadAttendance()));
            } else if (hash === 'jurnal-guru') {
                import('./jurnal.js').then(m => m.initJurnalSection?.() || (typeof window.loadJournals === 'function' && window.loadJournals()));
            } else if (hash === 'absensi') {
                import('./attendance.js').then(m => m.initAttendanceSection?.() || (typeof window.loadStudentAttendance === 'function' && window.loadStudentAttendance()));
            } else if (hash === 'nilai') {
                import('./nilai.js').then(m => m.initNilaiSection?.() || (typeof window.loadNilai === 'function' && window.loadNilai()));
            } else if (hash === 'rapor') {
                import('./dashboard.js').then(m => m.initRaporSection?.() || (typeof window.loadRapor === 'function' && window.loadRapor()));
            } else if (hash === 'jadwal') {
                import('./jadwal.js').then(m => m.initJadwalSection?.() || (typeof window.loadJadwal === 'function' && window.loadJadwal()));
            } else if (hash === 'mata-pelajaran') {
                import('./mapel.js').then(m => m.initMapelSection?.() || (typeof window.loadMapel === 'function' && window.loadMapel()));
            } else if (hash === 'kelas') {
                import('./kelas.js').then(m => m.initKelasSection?.() || (typeof window.loadKelas === 'function' && window.loadKelas()));
            } else if (hash === 'data-migration') {
                import('./migration.js').then(m => m.initMigrationSection?.() || (typeof window.loadMigration === 'function' && window.loadMigration()));
            }

            window.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { id: targetId, originalHash: hash } }));
        } catch (err) {
            logError(`Gagal memuat partial ${hash}:`, err);
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

    if (window.innerWidth <= 1024) {
        // Satu jalur penutup: setSidebar(false) lewat window._closeSidebar().
        setTimeout(() => {
            if (typeof window._closeSidebar === 'function') window._closeSidebar();
        }, 50); // beri waktu partial selesai disisipkan
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

// Penutupan drawer saat item menu diklik kini ditangani satu listener delegasi
// di js/core/layout.js (setSidebar) — tidak ada lagi jalur penutup kedua di sini.

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

