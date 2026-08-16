import { authState } from './authState.js';
import { injectSidebar, injectTopbar } from '../core/layout.js';
injectTopbar('topbar', {
  greeting: '',
  title: '',
  rightHtml: ``
});

injectSidebar('sidebar', 'academic');

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
        let _guest = false;

        // Only AFTER we know the session status do we decide on isGuest.
        if (user) {
            // Valid session - override any stale isGuest flag
            _guest = false;
            localStorage.removeItem('isGuest');

            _user = user;

            // P0 Fix: Dynamic Admin Check via user_roles table
            const { data: roleData } = await db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
            _admin = (roleData && roleData.role === 'admin');
            const _pembina = (roleData && roleData.role === 'pembina');

            if (!_admin && !_pembina) {
                const { data: teacherData } = await db
                    .from('teachers')
                    .select('id, nama, email')
                    .ilike('email', user.email)
                    .maybeSingle();
                
                _teacher = teacherData || null;
                if (!teacherData) {
                    console.warn('Email ini tidak terdaftar sebagai guru:', user.email);
                }

                // Sembunyikan menu non-akademik untuk Guru
                const restrictedGroups = ['nav-group-main', 'nav-group-finance', 'nav-group-ppdb', 'nav-group-system'];
                restrictedGroups.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'none';
                });
            } else {
                _teacher = null;
                
                if (_pembina) {
                    // Inject CSS to hide all action buttons in Academic globally
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
            // No valid session - check if user intentionally chose guest mode
            _guest = localStorage.getItem('isGuest') === 'true';
        }

        // Commit to auth module
        authState.setAuth(_user, _teacher, _admin, _guest, _pembina || false);

        if (error || (!user && !_guest)) {
            window.location.href = '../../index.html';
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
                window.location.href = '../../index.html';
            });
        }

        // P1 Fix: Dispatch event so other modules don't need to poll with setTimeout
        window.dispatchEvent(new CustomEvent('authLoaded'));

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

    // Toggle Sidebar – delegates to layout.js helpers if available
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

    // Also close sidebar when nav link is clicked on mobile
    document.querySelectorAll('.nav-item.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && window._closeSidebar) {
                window._closeSidebar();
            }
        });
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
