/**
 * layout.js – Unified Sidebar & Topbar injection
 * - Sidebar uses class "open" to show/hide
 * - Overlay closes sidebar when tapped
 * - Mobile hamburger button toggles sidebar
 * - X button inside sidebar also closes it
 */

export function injectSidebar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Inject Phosphor Icons if not present
    if (!document.getElementById('phosphor-icons')) {
        const script = document.createElement('script');
        script.id = 'phosphor-icons';
        script.src = 'https://unpkg.com/@phosphor-icons/web';
        document.head.appendChild(script);
    }

    const path = window.location.pathname;
    const basePath = path.includes('/pages/') ? '../../' : './';

    container.innerHTML = `
    <div class="sidebar-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div class="sidebar-logo-icon">🏫</div>
        <div class="sidebar-brand">SMPAnnida</div>
      </div>
      <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Tutup menu">✕</button>
    </div>

    <!-- Sidebar Search -->
    <div style="padding: 1rem 0.875rem 0 0.875rem;">
      <div class="sidebar-search-container" style="position:relative;">
        <i class="ph ph-magnifying-glass" style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
        <input type="text" id="sidebar-search" placeholder="Cari menu... (Ctrl+K)" class="form-input" style="padding-left:2.2rem; font-size:0.8rem; background:var(--glass-bg); border:1px solid var(--border-color); color:var(--text-primary);">
      </div>
    </div>

    <nav class="sidebar-nav">
      <!-- MAIN -->
      <div class="nav-group accordion-group" id="nav-group-main">
        <div class="nav-group-title accordion-toggle">
          <span>Main</span>
          <i class="ph ph-caret-down accordion-icon"></i>
        </div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}dashboard.html" class="nav-item">
              <i class="ph ph-squares-four nav-icon"></i> Super Dashboard
            </a>
          </div>
        </div>
      </div>

      <!-- AKADEMIK -->
      <div class="nav-group accordion-group" id="nav-group-academic">
        <div class="nav-group-title accordion-toggle">
          <span>Akademik & Kesiswaan</span>
          <i class="ph ph-caret-down accordion-icon"></i>
        </div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/academic/dashboard.html#dashboard" class="nav-item nav-link" data-target="dashboard">
              <i class="ph ph-chart-line-up nav-icon"></i> Dashboard
            </a>
            <a href="${basePath}pages/academic/dashboard.html#data-siswa" class="nav-item nav-link" data-target="data-siswa">
              <i class="ph ph-users nav-icon"></i> Data Siswa
            </a>
            <a href="${basePath}pages/academic/dashboard.html#jadwal" class="nav-item nav-link" data-target="jadwal">
              <i class="ph ph-calendar-blank nav-icon"></i> Jadwal
            </a>
            <a href="${basePath}pages/academic/dashboard.html#nilai" class="nav-item nav-link" data-target="nilai">
              <i class="ph ph-exam nav-icon"></i> Nilai
            </a>
            <a href="${basePath}pages/academic/dashboard.html#rapor" class="nav-item nav-link" data-target="rapor">
              <i class="ph ph-file-text nav-icon"></i> Rapor
            </a>
            <a href="${basePath}pages/academic/dashboard.html#absensi" class="nav-item nav-link" data-target="absensi">
              <i class="ph ph-clipboard-text nav-icon"></i> Absensi Siswa
            </a>
            <a href="${basePath}pages/academic/dashboard.html#jurnal-guru" class="nav-item nav-link" data-target="jurnal-guru">
              <i class="ph ph-notebook nav-icon"></i> Jurnal Guru
            </a>
            <a href="${basePath}pages/academic/dashboard.html#absensi-guru" class="nav-item nav-link" data-target="absensi-guru">
              <i class="ph ph-chalkboard-teacher nav-icon"></i> Absensi Guru
            </a>
            <a href="${basePath}pages/academic/dashboard.html#data-migration" class="nav-item nav-link" data-target="data-migration">
              <i class="ph ph-database nav-icon"></i> Data Migration
            </a>
          </div>
        </div>
      </div>

      <!-- KEUANGAN -->
      <div class="nav-group accordion-group" id="nav-group-finance">
        <div class="nav-group-title accordion-toggle">
          <span>Keuangan</span>
          <i class="ph ph-caret-down accordion-icon"></i>
        </div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/finance/dashboard.html#transactions" class="nav-item" data-target="transactions">
              <i class="ph ph-money nav-icon"></i> Transaksi Kas
            </a>
            <a href="${basePath}pages/finance/dashboard.html#budget" class="nav-item" data-target="budget">
              <i class="ph ph-target nav-icon"></i> Budget Bulanan
            </a>
            <a href="${basePath}pages/finance/dashboard.html#rab" class="nav-item" data-target="rab">
              <i class="ph ph-clipboard-list nav-icon"></i> RAB Kelas
            </a>
            <a href="${basePath}pages/finance/dashboard.html#reports" class="nav-item" data-target="reports">
              <i class="ph ph-chart-pie-slice nav-icon"></i> Laporan
            </a>
            <a href="${basePath}pages/finance/dashboard.html#syahriah" class="nav-item" data-target="syahriah">
              <i class="ph ph-wallet nav-icon"></i> Syahriah Guru
            </a>
          </div>
        </div>
      </div>

      <!-- PPDB -->
      <div class="nav-group accordion-group" id="nav-group-ppdb">
        <div class="nav-group-title accordion-toggle">
          <span>Penerimaan (PPDB)</span>
          <i class="ph ph-caret-down accordion-icon"></i>
        </div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/ppdb/index.html" class="nav-item">
              <i class="ph ph-user-plus nav-icon"></i> Pendaftar Baru
            </a>
          </div>
        </div>
      </div>

      <!-- SISTEM -->
      <div class="nav-group accordion-group" id="nav-group-system">
        <div class="nav-group-title accordion-toggle">
          <span>Sistem</span>
          <i class="ph ph-caret-down accordion-icon"></i>
        </div>
        <div class="nav-group-content">
          <div class="nav-group-inner">
            <a href="${basePath}pages/finance/dashboard.html#settings" class="nav-item" data-target="settings">
              <i class="ph ph-gear nav-icon"></i> Pengaturan
            </a>
          </div>
        </div>
      </div>
    </nav>

    <div style="margin-top:auto">
      <div class="user-widget">
        <div class="user-avatar" id="user-avatar">G</div>
        <div style="flex:1;overflow:hidden;">
          <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;" id="nav-user-name">Guest</div>
          <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;text-overflow:ellipsis;overflow:hidden;" id="nav-user-email">Belum Login</div>
        </div>
      </div>
      <button class="btn btn-outline" style="width:100%;margin-top:1rem;" id="logout-btn">Keluar</button>
    </div>
    `;

    // Active state logic
    function updateActiveSidebar() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash || '';
        
        container.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        container.querySelectorAll('.accordion-group').forEach(el => el.classList.remove('active'));

        let matchedItem = null;
        const navItems = container.querySelectorAll('.nav-item');
        
        for (const item of navItems) {
            const href = item.getAttribute('href');
            if (!href) continue;

            const a = document.createElement('a');
            a.href = href;

            if (a.pathname === currentPath) {
                if (a.hash && a.hash === currentHash) {
                    matchedItem = item;
                    break;
                } else if (!a.hash && (!currentHash || currentHash === '#dashboard')) {
                    matchedItem = item;
                }
            }
        }

        if (!matchedItem) {
            for (const item of navItems) {
                const href = item.getAttribute('href');
                if (!href) continue;
                const a = document.createElement('a');
                a.href = href;
                if (a.pathname === currentPath) {
                    matchedItem = item;
                    break;
                }
            }
        }

        if (matchedItem) {
            matchedItem.classList.add('active');
            const parentAccordion = matchedItem.closest('.accordion-group');
            if (parentAccordion) {
                parentAccordion.classList.add('active');
            }
        }
    }

    updateActiveSidebar();
    window.addEventListener('hashchange', updateActiveSidebar);

    // Create overlay if it doesn't exist
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Helper: open sidebar
    function openSidebar() {
        container.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Helper: close sidebar
    function closeSidebar() {
        container.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // X button inside sidebar
    const closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    // Overlay click closes sidebar
    overlay.addEventListener('click', closeSidebar);

    // Hamburger from topbar
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'mobile-menu-btn' || e.target.closest('#mobile-menu-btn'))) {
            if (container.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }
    });

    // Also bind old menu-toggle (for academic module)
    const oldToggle = document.getElementById('menu-toggle');
    if (oldToggle) {
        oldToggle.addEventListener('click', () => {
            if (container.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Accordion Logic
    const accordions = container.querySelectorAll('.accordion-group');
    accordions.forEach(acc => {
        const toggle = acc.querySelector('.accordion-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                // If it was already active, close it
                if (acc.classList.contains('active')) {
                    acc.classList.remove('active');
                } else {
                    // Close other accordions
                    accordions.forEach(a => a.classList.remove('active'));
                    // Open this one
                    acc.classList.add('active');
                }
            });
        }
        
        // Auto-open accordion if it contains an active link
        if (acc.querySelector('.nav-item.active')) {
            acc.classList.add('active');
        }
    });

    // Sidebar Search Logic
    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const navItems = container.querySelectorAll('.nav-item');
            
            navItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                const parentGroup = item.closest('.accordion-group');
                
                if (text.includes(query)) {
                    item.style.display = 'flex';
                    if (query && parentGroup) {
                        parentGroup.classList.add('active'); // auto open
                    }
                } else {
                    item.style.display = 'none';
                }
            });
        });

        // Ctrl+K shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (!container.classList.contains('open')) {
                    openSidebar();
                }
                searchInput.focus();
            }
        });
    }

    // Close sidebar on mobile when a nav item is clicked
    const navItems = container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Expose closeSidebar globally for other scripts
    window._closeSidebar = closeSidebar;
    window._openSidebar = openSidebar;
}

export function injectTopbar(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const greeting = options.greeting || '';
    const title = options.title || '';
    const rightHtml = options.rightHtml || '';

    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem;">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Buka menu">☰</button>
          <div class="topbar-left">
            ${greeting ? `<div class="topbar-greeting">${greeting}</div>` : ''}
            ${title ? `<div class="topbar-title">${title}</div>` : ''}
          </div>
        </div>
        <div class="topbar-right">
          ${rightHtml}
        </div>
    `;
}
