import { injectSidebar, injectTopbar } from '../core/layout.js';
injectTopbar('topbar', {
  greeting: '',
  title: '',
  rightHtml: ``
});

injectSidebar('sidebar', 'academic');

// Modify the Academic nav-group to inject the sub-navigation menus
const academicNavGroup = document.querySelectorAll('.nav-group')[1];
if (academicNavGroup) {
    academicNavGroup.innerHTML = `
        <div class="nav-group-title">Akademik & Kesiswaan</div>
        <a href="#dashboard" class="nav-item nav-link" data-target="dashboard">📊 Dashboard</a>
        <a href="#data-siswa" class="nav-item nav-link" data-target="data-siswa">👨‍🎓 Data Siswa</a>
        <a href="#jadwal" class="nav-item nav-link" data-target="jadwal">📅 Jadwal</a>
        <a href="#nilai" class="nav-item nav-link" data-target="nilai">📝 Nilai</a>
        <a href="#rapor" class="nav-item nav-link" data-target="rapor">📄 Rapor</a>
        <a href="#absensi" class="nav-item nav-link" data-target="absensi">📋 Absensi Siswa</a>
        <a href="#jurnal-guru" class="nav-item nav-link" data-target="jurnal-guru">📓 Jurnal Guru</a>
        <a href="#absensi-guru" class="nav-item nav-link" data-target="absensi-guru">👨‍🏫 Absensi Guru</a>
        <a href="#data-migration" class="nav-item nav-link" data-target="data-migration">📥 Data Migration</a>
    `;
}

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

        // Only AFTER we know the session status do we decide on isGuest.
        if (user) {
            // Valid session — override any stale isGuest flag
            window.isGuest = false;
            localStorage.removeItem('isGuest');
        } else {
            // No valid session — check if user intentionally chose guest mode
            window.isGuest = localStorage.getItem('isGuest') === 'true';
        }

        if (error || (!user && !window.isGuest)) {
            window.location.href = '../../index.html';
            return;
        }

        // Update profil UI
        const profileName = document.querySelector('.user-profile span');
        if (profileName) {
            if (window.isGuest) {
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
                window.location.href = '../../index.html';
            });
        }

    } catch (err) {
        console.error("Auth check failed:", err);
        window.location.href = '../../index.html';
    }
}
// Jalankan cek auth
checkAuth();

// Dark mode initialization (sebelum DOM dimuat penuh agar tidak berkedip)
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

document.addEventListener('DOMContentLoaded', () => {
    // Navigasi SPA Berbasis Hash (Routing)
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
    
    // Update hash when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            window.location.hash = targetId;
        });
    });

    window.addEventListener('hashchange', handleHashChange);
    // Initial load
    handleHashChange();

    // Toggle Sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });



    // Toggle Dark Mode
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        // Set icon awal
        btnThemeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
        
        btnThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            btnThemeToggle.textContent = isDark ? '☀️' : '🌙';
        });
    }
});

// Legacy loadAbsensiClasses removed in favor of Master Kelas (kelas.js)
