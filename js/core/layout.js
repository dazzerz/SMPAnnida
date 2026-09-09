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

    container.classList.add('split-rail-container', 'sidebar');

    const path = window.location.pathname;
    const basePath = path.includes('/pages/') ? '../../' : './';

    container.innerHTML = `
    <!-- LAPISAN 1: Rail Bar (52px Icon Rail) -->
    <div class="split-rail-bar">
      <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
        <a href="${basePath}dashboard.html" class="split-rail-logo" title="SMP Annida - Super Dashboard">
          <img src="${basePath}assets/logo/1.webp" alt="Logo SMP Annida" onerror="this.onerror=null; this.src='/logo_1x1.png';" style="width:100%; height:100%; object-fit:cover;">
        </a>

        <div class="split-rail-items">
          <button class="rail-btn" data-category="main" title="Super Dashboard" aria-label="Super Dashboard">
            <span class="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button class="rail-btn active" data-category="academic" title="Akademik & Kesiswaan" aria-label="Akademik & Kesiswaan">
            <span class="material-symbols-outlined text-lg">school</span>
          </button>
          <button class="rail-btn" data-category="finance" title="Keuangan" aria-label="Keuangan">
            <span class="material-symbols-outlined text-lg">payments</span>
          </button>
          <button class="rail-btn" data-category="ppdb" title="Penerimaan Siswa (PPDB)" aria-label="Penerimaan Siswa (PPDB)">
            <span class="material-symbols-outlined text-lg">person_add</span>
          </button>
          <button class="rail-btn" data-category="system" title="Sistem & Pengaturan" aria-label="Sistem & Pengaturan">
            <span class="material-symbols-outlined text-lg">settings</span>
          </button>
        </div>
      </div>

      <div class="split-rail-bottom">
        <button class="rail-btn" id="sidebar-panel-toggle" title="Sembunyikan / Tampilkan Panel (Buka/Tutup)" aria-label="Toggle Panel">
          <span class="material-symbols-outlined text-base">dock_to_left</span>
        </button>
        <button class="rail-btn" id="logout-btn" title="Keluar dari Akun" aria-label="Keluar">
          <span class="material-symbols-outlined text-base">logout</span>
        </button>
      </div>
    </div>

    <!-- LAPISAN 2: Context Submenu Panel (200px Panel) -->
    <div class="split-rail-panel">
      <!-- Header -->
      <div class="split-rail-panel-header">
        <span class="split-rail-panel-title" id="panel-category-title">Akademik</span>
        <button class="split-rail-panel-close sidebar-close-btn" id="sidebar-close-btn" title="Tutup Panel Submenu" aria-label="Tutup Panel">
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <!-- Search -->
      <div class="split-rail-panel-search">
        <div class="sidebar-search-container" style="position:relative; display:flex; align-items:center;">
          <span class="material-symbols-outlined search-icon" style="position:absolute; left:8px; font-size:16px; color:#94a3b8; pointer-events:none;">search</span>
          <input type="text" id="sidebar-search" placeholder="Cari menu... (Ctrl+K)" class="form-input sidebar-search-input" style="padding-left:30px; font-size:12px; height:32px; width:100%; border-radius:6px; background:#09151e; border:1px solid #1e293b; color:#fff;">
        </div>
      </div>

      <!-- Submenu Links Container -->
      <nav class="split-rail-panel-menu sidebar-nav">
        <!-- MAIN CATEGORY -->
        <div class="category-panel-content" id="nav-group-main" data-category="main" style="display:none;">
          <a href="${basePath}dashboard.html" class="nav-item nav-link" data-target="super-dashboard" data-tooltip="Super Dashboard">
            <span class="material-symbols-outlined nav-icon">grid_view</span>
            <span class="nav-text">Super Dashboard</span>
          </a>
        </div>

        <!-- ACADEMIC CATEGORY -->
        <div class="category-panel-content" id="nav-group-academic" data-category="academic">
          <a href="${basePath}pages/academic/dashboard.html#dashboard" class="nav-item nav-link" data-target="dashboard" data-tooltip="Dashboard">
            <span class="material-symbols-outlined nav-icon">insights</span>
            <span class="nav-text">Dashboard</span>
          </a>
          <a href="${basePath}pages/academic/dashboard.html#data-siswa" class="nav-item nav-link" data-target="data-siswa" data-tooltip="Data Siswa">
            <span class="material-symbols-outlined nav-icon">group</span>
            <span class="nav-text">Data Siswa</span>
          </a>
          <a href="${basePath}pages/academic/dashboard.html#guru" class="nav-item nav-link" data-target="guru" data-tooltip="Data Guru">
            <span class="material-symbols-outlined nav-icon">badge</span>
            <span class="nav-text">Data Guru</span>
          </a>
          <a href="${basePath}pages/academic/dashboard.html#kelas" class="nav-item nav-link" data-target="kelas" data-tooltip="Data Kelas">
            <span class="material-symbols-outlined nav-icon">meeting_room</span>
            <span class="nav-text">Data Kelas</span>
          </a>
          <a href="${basePath}pages/academic/dashboard.html#mata-pelajaran" class="nav-item nav-link" data-target="mata-pelajaran" data-tooltip="Mata Pelajaran">
            <span class="material-symbols-outlined nav-icon">menu_book</span>
            <span class="nav-text">Mata Pelajaran</span>
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
          <a href="${basePath}pages/academic/dashboard.html#cbt-admin" class="nav-item nav-link" data-target="cbt-admin" data-tooltip="Ujian CBT Online">
            <span class="material-symbols-outlined nav-icon">quiz</span>
            <span class="nav-text">Ujian CBT</span>
          </a>
          <a href="${basePath}pages/academic/dashboard.html#tugas-lms" class="nav-item nav-link" data-target="tugas-lms" data-tooltip="Tugas & LMS">
            <span class="material-symbols-outlined nav-icon">add_task</span>
            <span class="nav-text">Tugas & PR</span>
          </a>
          <a href="${basePath}pages/academic/dashboard.html#materi-lms" class="nav-item nav-link" data-target="materi-lms" data-tooltip="Materi Pembelajaran">
            <span class="material-symbols-outlined nav-icon">menu_book</span>
            <span class="nav-text">Materi</span>
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

        <!-- FINANCE CATEGORY -->
        <div class="category-panel-content" id="nav-group-finance" data-category="finance" style="display:none;">
          <a href="${basePath}pages/finance/dashboard.html#transactions" class="nav-item nav-link" data-target="transactions" data-tooltip="Transaksi Kas">
            <span class="material-symbols-outlined nav-icon">payments</span>
            <span class="nav-text">Transaksi Kas</span>
          </a>
          <a href="${basePath}pages/finance/dashboard.html#budget" class="nav-item nav-link" data-target="budget" data-tooltip="Budget Bulanan">
            <span class="material-symbols-outlined nav-icon">savings</span>
            <span class="nav-text">Budget Bulanan</span>
          </a>
          <a href="${basePath}pages/finance/dashboard.html#rab" class="nav-item nav-link" data-target="rab" data-tooltip="RAB Kelas">
            <span class="material-symbols-outlined nav-icon">table_chart</span>
            <span class="nav-text">RAB Kelas</span>
          </a>
          <a href="${basePath}pages/finance/dashboard.html#reports" class="nav-item nav-link" data-target="reports" data-tooltip="Laporan Keuangan">
            <span class="material-symbols-outlined nav-icon">analytics</span>
            <span class="nav-text">Laporan</span>
          </a>
          <a href="${basePath}pages/finance/dashboard.html#syahriah" class="nav-item nav-link" data-target="syahriah" data-tooltip="Syahriah Guru">
            <span class="material-symbols-outlined nav-icon">account_balance_wallet</span>
            <span class="nav-text">Syahriah Guru</span>
          </a>
        </div>

        <!-- PPDB CATEGORY -->
        <div class="category-panel-content" id="nav-group-ppdb" data-category="ppdb" style="display:none;">
          <a href="${basePath}pages/ppdb/dashboard-admin.html" class="nav-item nav-link" data-target="ppdb-admin" data-tooltip="Pendaftar Baru">
            <span class="material-symbols-outlined nav-icon">person_add</span>
            <span class="nav-text">Pendaftar Baru</span>
          </a>
        </div>

        <!-- SYSTEM CATEGORY -->
        <div class="category-panel-content" id="nav-group-system" data-category="system" style="display:none;">
          <a href="${basePath}pages/finance/dashboard.html#settings" class="nav-item nav-link" data-target="settings" data-tooltip="Pengaturan">
            <span class="material-symbols-outlined nav-icon">settings</span>
            <span class="nav-text">Pengaturan</span>
          </a>
        </div>
      </nav>

      <!-- Panel Footer / User Profile -->
      <div class="split-rail-panel-footer">
        <div class="user-widget" style="display:flex; align-items:center; gap:0.6rem;">
          <div class="user-avatar" id="user-avatar" style="width:32px; height:32px; border-radius:50%; background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4); color:#34d399; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0;">A</div>
          <div class="user-info" style="overflow:hidden; min-width:0;">
            <div class="user-name" id="nav-user-name" style="font-size:12px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Admin Annida</div>
            <div class="user-email" id="nav-user-email" style="font-size:10.5px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">admin@smpannida.sch.id</div>
          </div>
        </div>
      </div>
    </div>
    `;

    // Category State Management
    const categoryTitles = {
        main: 'Super Dashboard',
        academic: 'Akademik',
        finance: 'Keuangan',
        ppdb: 'Penerimaan PPDB',
        system: 'Pengaturan'
    };

    let activeCategory = 'academic';

    function setCategory(cat, autoOpen = true) {
        activeCategory = cat;
        // Highlight rail icon
        container.querySelectorAll('.rail-btn[data-category]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === cat);
        });
        // Switch visible panel items
        container.querySelectorAll('.category-panel-content').forEach(section => {
            section.style.display = section.getAttribute('data-category') === cat ? 'flex' : 'none';
        });
        // Update panel title
        const titleEl = container.querySelector('#panel-category-title');
        if (titleEl && categoryTitles[cat]) {
            titleEl.textContent = categoryTitles[cat];
        }
        if (autoOpen && container.classList.contains('panel-collapsed')) {
            togglePanel(false);
        }
    }

    // Toggle Panel Open / Collapsed
    function togglePanel(forceCollapse) {
        const isCollapsed = container.classList.contains('panel-collapsed');
        const willCollapse = forceCollapse !== undefined ? forceCollapse : !isCollapsed;

        if (willCollapse) {
            container.classList.add('panel-collapsed');
            localStorage.setItem('smpannida-panel-collapsed', 'true');
        } else {
            container.classList.remove('panel-collapsed');
            localStorage.setItem('smpannida-panel-collapsed', 'false');
        }
    }

    // Handle Rail Icon Click
    container.querySelectorAll('.rail-btn[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = btn.getAttribute('data-category');
            const isCollapsed = container.classList.contains('panel-collapsed');

            if (activeCategory === cat && !isCollapsed) {
                // Clicking the active category toggles the panel closed
                togglePanel(true);
            } else {
                // Switching category opens panel
                setCategory(cat, true);
            }
        });
    });

    // Close & Toggle Functions
    function closeSubmenuPanel() {
        if (window.innerWidth < 768) {
            if (window._closeSidebar) {
                window._closeSidebar();
            } else {
                container.classList.remove('open', 'active', 'show');
            }
        } else {
            togglePanel(true);
        }
    }

    const panelToggleBtn = container.querySelector('#sidebar-panel-toggle');
    if (panelToggleBtn) {
        panelToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            togglePanel();
        });
    }

    const closeBtns = container.querySelectorAll('#sidebar-close-btn, #panel-close-btn, .sidebar-close-btn, .split-rail-panel-close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSubmenuPanel();
        });
    });

    // Detect Initial Category from URL / Hash
    if (path.includes('/finance/')) {
        activeCategory = 'finance';
    } else if (path.includes('/ppdb/')) {
        activeCategory = 'ppdb';
    } else if (path.endsWith('dashboard.html') && !path.includes('/pages/')) {
        activeCategory = 'main';
    } else {
        activeCategory = 'academic';
    }
    setCategory(activeCategory, false);

    // Restore Saved Panel Preference
    const savedState = localStorage.getItem('smpannida-panel-collapsed');
    if (savedState === 'true') {
        container.classList.add('panel-collapsed');
    } else if (savedState === 'false') {
        container.classList.remove('panel-collapsed');
    }

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
            // Auto switch category to matched item if needed
            const parentCat = matched.closest('.category-panel-content');
            if (parentCat) {
                const cat = parentCat.getAttribute('data-category');
                if (cat && cat !== activeCategory) {
                    setCategory(cat, false);
                }
            }
        }
    }

    updateActiveSidebar();
    window.addEventListener('hashchange', updateActiveSidebar);

    // Overlay Drawer Management for Mobile
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    window._openSidebar = openMobileSidebar;
    window._closeSidebar = closeMobileSidebar;

    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSubmenuPanel();
        });
    }
    overlay.addEventListener('click', (e) => {
        e.preventDefault();
        closeSubmenuPanel();
    });



    // Close on click outside or click close button
    document.addEventListener('click', (e) => {
        const clickedClose = e.target.closest('#sidebar-close-btn, #panel-close-btn, .sidebar-close-btn, .split-rail-panel-close');
        if (clickedClose) {
            e.preventDefault();
            e.stopPropagation();
            closeSubmenuPanel();
            return;
        }

        if (!container.contains(e.target) && !e.target.closest('#mobile-menu-btn, .mobile-menu-btn')) {
            if (window.innerWidth < 768) {
                if (container.classList.contains('open')) closeSubmenuPanel();
            } else {
                if (!container.classList.contains('panel-collapsed')) togglePanel(true);
            }
        }
    });

    // Sidebar search filter (Ctrl+K)
    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const navItems = container.querySelectorAll('.nav-item');
            
            if (!query) {
                setCategory(activeCategory, false);
                navItems.forEach(item => item.style.display = '');
            } else {
                container.querySelectorAll('.category-panel-content').forEach(c => c.style.display = 'flex');
                navItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? 'flex' : 'none';
                });
            }
        });

        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
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
          ${rightHtml}
        </div>
    `;
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

/**
 * Automatically populates data-label attributes on table cells from thead th,
 * enabling full-width card-view rendering on mobile without horizontal scroll.
 */
export function enhanceTablesForMobile(root = document) {
  if (!root || !root.querySelectorAll) return;
  const tables = root.querySelectorAll('table');
  tables.forEach(table => {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    if (!headers.length) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) return;
      cells.forEach((td, idx) => {
        if (!td.hasAttribute('data-label') && headers[idx]) {
          td.setAttribute('data-label', headers[idx]);
        }
      });
    });
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.enhanceTablesForMobile = enhanceTablesForMobile;

  const setupTableObserver = () => {
    if (!document.body) return;
    enhanceTablesForMobile();
    const observer = new MutationObserver((mutations) => {
      let shouldRun = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1 && (node.tagName === 'TR' || node.tagName === 'TBODY' || node.querySelector?.('table, tbody, tr'))) {
              shouldRun = true;
              break;
            }
          }
        }
        if (shouldRun) break;
      }
      if (shouldRun) {
        enhanceTablesForMobile();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTableObserver);
  } else {
    setupTableObserver();
  }
}



// ── Robust Mobile Sidebar & Overlay Controller ───────────────────────────
export function closeMobileSidebar() {
    const sidebars = document.querySelectorAll('.sidebar, #sidebar, #student-sidebar, .split-rail-container');
    sidebars.forEach(sb => {
        sb.classList.remove('open', 'active', 'show');
    });
    const overlays = document.querySelectorAll('.sidebar-overlay, #sidebar-overlay');
    overlays.forEach(ov => {
        ov.classList.remove('show', 'active');
        ov.style.display = 'none';
        ov.style.pointerEvents = 'none';
        ov.style.opacity = '0';
    });
    document.body.style.overflow = '';
    document.body.classList.remove('sidebar-open');
}

export function openMobileSidebar() {
    const sidebars = document.querySelectorAll('.sidebar, #sidebar, #student-sidebar, .split-rail-container');
    sidebars.forEach(sb => {
        sb.classList.add('open', 'active', 'show');
    });
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.display = '';
    overlay.style.pointerEvents = '';
    overlay.style.opacity = '';
    overlay.classList.add('show', 'active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('sidebar-open');
}

// Bind globally immediately so any caller has access
if (typeof window !== 'undefined') {
    window._closeSidebar = closeMobileSidebar;
    window._openSidebar = openMobileSidebar;
}

// ── Tab Visibility & Window Focus Lifecycle Handlers ─────────────────────
// Automatically closes mobile sidebar and cleans up overlay when switching tabs
function handleTabVisibilityOrFocusChange() {
    const hasOpenSidebar = document.querySelector('.sidebar.open, #sidebar.open, .sidebar-overlay.show, .sidebar-overlay.active, .sidebar.show');
    if (hasOpenSidebar || (typeof document !== 'undefined' && document.body.classList.contains('sidebar-open'))) {
        closeMobileSidebar();
    }
}

if (typeof document !== 'undefined' && !window.__sidebar_lifecycle_bound) {
    window.__sidebar_lifecycle_bound = true;

    // 1. Visibility change (user switches tab, minimizes browser, locks screen)
    document.addEventListener('visibilitychange', () => {
        handleTabVisibilityOrFocusChange();
    });

    // 2. Window blur & focus (user clicks outside browser or switches application)
    window.addEventListener('blur', () => {
        handleTabVisibilityOrFocusChange();
    });
    window.addEventListener('focus', () => {
        handleTabVisibilityOrFocusChange();
    });

    // 3. Mobile tab sleep / freeze lifecycle
    window.addEventListener('pagehide', () => {
        handleTabVisibilityOrFocusChange();
    });
    window.addEventListener('pageshow', () => {
        handleTabVisibilityOrFocusChange();
    });

    // 4. Global capture-phase event delegation for closing overlay or outside clicks
    document.addEventListener('click', function(e) {
        // If clicked on overlay
        if (e.target.closest('.sidebar-overlay, #sidebar-overlay')) {
            e.preventDefault();
            e.stopPropagation();
            closeMobileSidebar();
            return;
        }

        // If clicked close button
        const closeBtn = e.target.closest('#sidebar-close-btn, #panel-close-btn, .sidebar-close-btn, .split-rail-panel-close');
        if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            closeMobileSidebar();
            return;
        }

        // If mobile sidebar is open and clicked anywhere outside sidebar and hamburger button
        if (window.innerWidth < 768) {
            const hasOpen = document.querySelector(
                '.sidebar.open, #sidebar.open, .sidebar-overlay.show, .sidebar-overlay.active, .split-rail-container.open'
            );
            if (hasOpen) {
                const insideSidebar = e.target.closest(
                    '.sidebar, #sidebar, #student-sidebar, .split-rail-container, .split-rail-panel, .split-rail-panel-menu'
                );
                const insideHamburger = e.target.closest('#mobile-menu-btn, .mobile-menu-btn, .menu-toggle, #menu-toggle');
                if (!insideSidebar && !insideHamburger) {
                    // Do NOT call preventDefault here — it would block href navigation on menu items
                    closeMobileSidebar();
                }
            }
        }
    }, true); // Capturing phase ensures overlay click is never swallowed

    // 5. Touch support on overlay for immediate mobile response
    document.addEventListener('touchend', function(e) {
        if (e.target.closest('.sidebar-overlay, #sidebar-overlay')) {
            e.preventDefault();
            closeMobileSidebar();
        }
    }, { passive: false });
}
