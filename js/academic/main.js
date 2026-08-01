import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;

// [LEGACY] - Siap dihapus pada Sprint Cleanup.
/*
// Konfigurasi Supabase
const SUPABASE_URL = 'https://vxrgezyfxzynpucuomci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgxNDEsImV4cCI6MjA5OTM1NDE0MX0.3Y9Mal4M76D8fJfcVXQLbPSpLL_m8H7zQ-oVQG6e5IA';

// Inisialisasi Supabase client
window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
*/

// Cek Sesi (Auth)
window.isGuest = localStorage.getItem('isGuest') === 'true';

// Escape HTML untuk mencegah XSS
window.escapeHTML = function(str) {
  if (!str) return '-';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

async function checkAuth() {
    try {
        const { data: { session }, error } = await db.auth.getSession();
        if (error || (!session && !window.isGuest)) {
            window.location.href = '../../index.html';
        }

        // Update profil UI
        const profileName = document.querySelector('.user-profile span');
        if (profileName) {
            if (window.isGuest) {
                profileName.textContent = 'Guest (View Only)';
                document.body.classList.add('guest-mode');
            } else {
                profileName.textContent = 'Guru Admin';
            }
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

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        btnLogout.addEventListener('click', async () => {
            localStorage.removeItem('isGuest');
            await db.auth.signOut();
            window.location.href = '../../index.html';
        });
    }

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

// Global function to load classes since multiple modules use it
window.loadAbsensiClasses = async function() {
    try {
        const { data, error } = await db.from('students').select('kelas');
        if (error) throw error;
        
        const uniqueClasses = [...new Set(data.map(s => s.kelas))].sort();
        
        const selectKelas = document.getElementById('select-kelas-absensi');
        const selectKelasNilai = document.getElementById('select-kelas-nilai');
        const filterKelasRekap = document.getElementById('filter-kelas-rekap');
        const filterKelasJadwal = document.getElementById('filter-kelas-jadwal');
        const filterKelasRekapAbsensi = document.getElementById('filter-kelas-rekap-absensi');

        let optionsHtml = '<option value="">-- Pilih Kelas --</option>';
        uniqueClasses.forEach(kelas => {
            optionsHtml += `<option value="${kelas}">${kelas}</option>`;
        });

        if(selectKelas) selectKelas.innerHTML = optionsHtml;
        if(selectKelasNilai) selectKelasNilai.innerHTML = optionsHtml;
        if(filterKelasRekap) filterKelasRekap.innerHTML = optionsHtml;
        if(filterKelasRekapAbsensi) filterKelasRekapAbsensi.innerHTML = optionsHtml;
        if(filterKelasJadwal) filterKelasJadwal.innerHTML = '<option value="">-- Semua Kelas --</option>' + optionsHtml.replace('<option value="">-- Pilih Kelas --</option>', '');

    } catch (err) {
        console.error("Gagal memuat kelas:", err);
    }
}
