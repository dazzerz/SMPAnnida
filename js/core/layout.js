/**
 * layout.js – Unified, Robust Sidebar & Topbar Injection
 * - All menu sections are permanently open & visible (no hidden accordion traps)
 * - Uses reliable Google Material Symbols Outlined
 * - Instant SPA and multi-page routing
 * - Auto-closes drawer on mobile upon link tap
 */
import { bindThemeSwitcher } from './theme.js';
import { handleLogout } from './auth.js';

export function injectSidebar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const path = window.location.pathname;
    const basePath = path.includes('/pages/') ? '../../' : './';

    container.innerHTML = `
    <div class="sidebar-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <a href="${basePath}dashboard.html" style="display:flex; align-items:center; gap:0.75rem; text-decoration:none; color:inherit;">
        <div class="sidebar-logo-icon">
          <img src="${basePath}assets/logo/1.png" alt="Logo SMP Annida" onerror="this.onerror=null; this.src='/assets/logo/1.png';">
        </div>
        <div class="sidebar-brand">SMPAnnida</div>
      </a>
      <button class="sidebar-mini-toggle" id="sidebar-mini-toggle" aria-label="Toggle Sidebar" title="Sembunyikan / Lebarkan Sidebar">
        <span class="material-symbols-outlined text-base">chevron_left</span>
      </button>
      <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Tutup menu">✕</button>
    </div>

    <!-- Sidebar Search -->
    <div class="sidebar-search-wrapper">
      <div class="sidebar-search-container">
        <span class="material-symbols-outlined search-icon">search</span>
        <input type="text" id="sidebar-search" placeholder="Cari menu... (Ctrl+K)" class="form-input sidebar-search-input">
      </div>
    </div>

    <nav class="sidebar-nav">
      <!-- MAIN -->
      <div class="nav-group" id="nav-group-main">
        <div class="nav-group-title">Main</div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}dashboard.html" class="nav-item" data-target="super-dashboard" data-tooltip="Super Dashboard">
              <span class="material-symbols-outlined nav-icon">grid_view</span>
              <span class="nav-text">Super Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      <!-- AKADEMIK & KESISWAAN -->
      <div class="nav-group" id="nav-group-academic">
        <div class="nav-group-title">Akademik & Kesiswaan</div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/academic/dashboard.html#dashboard" class="nav-item nav-link" data-target="dashboard" data-tooltip="Dashboard">
              <span class="material-symbols-outlined nav-icon">insights</span>
              <span class="nav-text">Dashboard</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#data-siswa" class="nav-item nav-link" data-target="data-siswa" data-tooltip="Data Siswa">
              <span class="material-symbols-outlined nav-icon">group</span>
              <span class="nav-text">Data Siswa</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#jadwal" class="nav-item nav-link" data-target="jadwal" data-tooltip="Jadwal Pelajaran">
              <span class="material-symbols-outlined nav-icon">calendar_month</span>
              <span class="nav-text">Jadwal</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#nilai" class="nav-item nav-link" data-target="nilai" data-tooltip="Nilai Siswa">
              <span class="material-symbols-outlined nav-icon">assignment</span>
              <span class="nav-text">Nilai</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#rapor" class="nav-item nav-link" data-target="rapor" data-tooltip="Rapor Siswa">
              <span class="material-symbols-outlined nav-icon">description</span>
              <span class="nav-text">Rapor</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#absensi" class="nav-item nav-link" data-target="absensi" data-tooltip="Absensi Siswa">
              <span class="material-symbols-outlined nav-icon">fact_check</span>
              <span class="nav-text">Absensi Siswa</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#tugas-lms" class="nav-item nav-link" data-target="tugas-lms" data-tooltip="Tugas & LMS">
              <span class="material-symbols-outlined nav-icon">add_task</span>
              <span class="nav-text">Tugas & LMS</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#jurnal-guru" class="nav-item nav-link" data-target="jurnal-guru" data-tooltip="Jurnal Guru">
              <span class="material-symbols-outlined nav-icon">menu_book</span>
              <span class="nav-text">Jurnal Guru</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#absensi-guru" class="nav-item nav-link" data-target="absensi-guru" data-tooltip="Absensi Guru">
              <span class="material-symbols-outlined nav-icon">badge</span>
              <span class="nav-text">Absensi Guru</span>
            </a>
            <a href="${basePath}pages/academic/dashboard.html#data-migration" class="nav-item nav-link" data-target="data-migration" data-tooltip="Data Migration">
              <span class="material-symbols-outlined nav-icon">database</span>
              <span class="nav-text">Data Migration</span>
            </a>
          </div>
        </div>
      </div>

      <!-- KEUANGAN -->
      <div class="nav-group" id="nav-group-finance">
        <div class="nav-group-title">Keuangan</div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/finance/dashboard.html#transactions" class="nav-item" data-target="transactions" data-tooltip="Transaksi Kas">
              <span class="material-symbols-outlined nav-icon">payments</span>
              <span class="nav-text">Transaksi Kas</span>
            </a>
            <a href="${basePath}pages/finance/dashboard.html#budget" class="nav-item" data-target="budget" data-tooltip="Budget Bulanan">
              <span class="material-symbols-outlined nav-icon">savings</span>
              <span class="nav-text">Budget Bulanan</span>
            </a>
            <a href="${basePath}pages/finance/dashboard.html#rab" class="nav-item" data-target="rab" data-tooltip="RAB Kelas">
              <span class="material-symbols-outlined nav-icon">table_chart</span>
              <span class="nav-text">RAB Kelas</span>
            </a>
            <a href="${basePath}pages/finance/dashboard.html#reports" class="nav-item" data-target="reports" data-tooltip="Laporan Keuangan">
              <span class="material-symbols-outlined nav-icon">analytics</span>
              <span class="nav-text">Laporan</span>
            </a>
            <a href="${basePath}pages/finance/dashboard.html#syahriah" class="nav-item" data-target="syahriah" data-tooltip="Syahriah Guru">
              <span class="material-symbols-outlined nav-icon">account_balance_wallet</span>
              <span class="nav-text">Syahriah Guru</span>
            </a>
          </div>
        </div>
      </div>

      <!-- PPDB -->
      <div class="nav-group" id="nav-group-ppdb">
        <div class="nav-group-title">Penerimaan (PPDB)</div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/ppdb/dashboard-admin.html" class="nav-item" data-tooltip="Pendaftar Baru">
              <span class="material-symbols-outlined nav-icon">person_add</span>
              <span class="nav-text">Pendaftar Baru</span>
            </a>
          </div>
        </div>
      </div>

      <!-- SISTEM -->
      <div class="nav-group" id="nav-group-system">
        <div class="nav-group-title">Sistem</div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/finance/dashboard.html#settings" class="nav-item" data-target="settings" data-tooltip="Pengaturan">
              <span class="material-symbols-outlined nav-icon">settings</span>
              <span class="nav-text">Pengaturan</span>
            </a>
          </div>
        </div>
      </div>
    </nav>

    <div class="sidebar-bottom-section">
      <div class="user-widget">
        <div class="user-avatar" id="user-avatar">A</div>
        <div class="user-info">
          <div class="user-name" id="nav-user-name">Admin Annida</div>
          <div class="user-email" id="nav-user-email">admin@smpannida.sch.id</div>
        </div>
      </div>
      <button class="sidebar-logout-btn" id="logout-btn" title="Keluar dari Akun">
        <span class="material-symbols-outlined text-base">logout</span>
        <span class="logout-text">Keluar</span>
      </button>
    </div>
    `;

    // Active link highlighting
    function updateActiveSidebar() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash ? window.location.hash.replace('#', '') : '';
        
        container.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        const navItems = Array.from(container.querySelectorAll('.nav-item'));
        let matched = null;

        if (currentHash) {
            matched = navItems.find(item => item.getAttribute('data-target') === currentHash);
        }

        if (!matched) {
            matched = navItems.find(item => {
                const href = item.getAttribute('href');
                if (!href) return false;
                const a = document.createElement('a');
                a.href = href;
                return a.pathname === currentPath;
            });
        }

        if (matched) {
            matched.classList.add('active');
        }
    }

    updateActiveSidebar();
    window.addEventListener('hashchange', updateActiveSidebar);

    // Overlay Drawer Management
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    window._openSidebar = function() {
        container.classList.add('open', 'active', 'show');
        overlay.classList.add('show', 'active');
        document.body.style.overflow = 'hidden';
    };

    window._closeSidebar = function() {
        container.classList.remove('open', 'active', 'show');
        overlay.classList.remove('show', 'active');
        document.body.style.overflow = '';
    };

    const closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', window._closeSidebar);
    overlay.addEventListener('click', window._closeSidebar);

    // Auto-close on link tap (mobile)
    container.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                window._closeSidebar();
            }
        });
    });

    // Sidebar search filter (Ctrl+K)
    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const navItems = container.querySelectorAll('.nav-item');
            
            navItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (!query || text.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // Mini sidebar collapse on desktop
    const toggleBtn = document.getElementById('sidebar-mini-toggle');
    function applySidebarState(isCollapsed) {
        if (isCollapsed) {
            container.classList.add('collapsed');
        } else {
            container.classList.remove('collapsed');
        }
    }

    const savedState = localStorage.getItem('smpannida-sidebar-state');
    applySidebarState(savedState === 'collapsed');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const willCollapse = !container.classList.contains('collapsed');
            localStorage.setItem('smpannida-sidebar-state', willCollapse ? 'collapsed' : 'expanded');
            applySidebarState(willCollapse);
        });
    }
}

// Global Event Delegation for all Logout buttons across all pages
if (typeof document !== 'undefined' && !window.__logout_listener_bound) {
  window.__logout_listener_bound = true;
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#logout-btn, .sidebar-logout-btn, [data-action="logout"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      handleLogout();
    }
  });
}

export function injectTopbar(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const greeting = options.greeting || '';
    const title = options.title || '';
    const rightHtml = options.rightHtml || '';

    const themeToggleHtml = `
      <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Ganti Mode Tema" title="Ganti Mode Terang / Gelap">
        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
        </svg>
        <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      </button>
    `;

    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem;">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Buka menu">
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div class="topbar-left">
            ${greeting ? `<div class="topbar-greeting">${greeting}</div>` : ''}
            ${title ? `<div class="topbar-title">${title}</div>` : ''}
          </div>
        </div>
        <div class="topbar-right" style="display:flex; align-items:center; gap:0.75rem;">
          ${themeToggleHtml}
          ${rightHtml}
        </div>
    `;

    bindThemeSwitcher('theme-toggle-btn');
}

// Global click handler for mobile hamburger menu
if (typeof document !== 'undefined' && !window.__mobile_toggle_bound) {
  window.__mobile_toggle_bound = true;
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#mobile-menu-btn, .mobile-menu-btn, .menu-toggle, #menu-toggle');
    if (btn) {
      e.preventDefault();
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        if (window._closeSidebar) window._closeSidebar();
      } else {
        if (window._openSidebar) window._openSidebar();
      }
    }
  });
}
