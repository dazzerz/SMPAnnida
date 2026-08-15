/**
 * layout.js – Unified Sidebar & Topbar injection
 * - Sidebar uses class "open" to show/hide
 * - Overlay closes sidebar when tapped
 * - Mobile hamburger button toggles sidebar
 * - X button inside sidebar also closes it
 */

export function injectSidebar(containerId, activeMenuId) {
    const container = document.getElementById(containerId);
    if (!container) return;

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

    <nav>
      <div class="nav-group" id="nav-group-main">
        <div class="nav-group-title">Main</div>
        <a href="${basePath}dashboard.html" class="nav-item ${activeMenuId === 'dashboard' ? 'active' : ''}">📊 Super Dashboard</a>
      </div>

      <div class="nav-group" id="nav-group-academic">
        <div class="nav-group-title">Akademik & Kesiswaan</div>
        <a href="${basePath}pages/academic/dashboard.html#dashboard" class="nav-item nav-link" data-target="dashboard">📊 Dashboard</a>
        <a href="${basePath}pages/academic/dashboard.html#data-siswa" class="nav-item nav-link" data-target="data-siswa">👨‍🎓 Data Siswa</a>
        <a href="${basePath}pages/academic/dashboard.html#jadwal" class="nav-item nav-link" data-target="jadwal">📅 Jadwal</a>
        <a href="${basePath}pages/academic/dashboard.html#nilai" class="nav-item nav-link" data-target="nilai">📝 Nilai</a>
        <a href="${basePath}pages/academic/dashboard.html#rapor" class="nav-item nav-link" data-target="rapor">📄 Rapor</a>
        <a href="${basePath}pages/academic/dashboard.html#absensi" class="nav-item nav-link" data-target="absensi">📋 Absensi Siswa</a>
        <a href="${basePath}pages/academic/dashboard.html#jurnal-guru" class="nav-item nav-link" data-target="jurnal-guru">📓 Jurnal Guru</a>
        <a href="${basePath}pages/academic/dashboard.html#absensi-guru" class="nav-item nav-link" data-target="absensi-guru">👨‍🏫 Absensi Guru</a>
        <a href="${basePath}pages/academic/dashboard.html#data-migration" class="nav-item nav-link" data-target="data-migration">📥 Data Migration</a>
      </div>

      <div class="nav-group" id="nav-group-finance">
        <div class="nav-group-title">Keuangan</div>
        <a href="${basePath}pages/finance/dashboard.html#transactions" class="nav-item ${activeMenuId === 'transactions' ? 'active' : ''}">💸 Transaksi Kas</a>
        <a href="${basePath}pages/finance/dashboard.html#budget" class="nav-item ${activeMenuId === 'budget' ? 'active' : ''}">🎯 Budget Bulanan</a>
        <a href="${basePath}pages/finance/dashboard.html#rab" class="nav-item ${activeMenuId === 'rab' ? 'active' : ''}">📋 RAB Kelas</a>
      </div>

      <div class="nav-group" id="nav-group-ppdb">
        <div class="nav-group-title">Penerimaan (PPDB)</div>
        <a href="${basePath}pages/ppdb/index.html" class="nav-item ${activeMenuId === 'ppdb' ? 'active' : ''}">📝 Pendaftar Baru</a>
      </div>

      <div class="nav-group" id="nav-group-system">
        <div class="nav-group-title">Sistem</div>
        <a href="${basePath}pages/finance/dashboard.html#settings" class="nav-item ${activeMenuId === 'settings' ? 'active' : ''}">⚙️ Pengaturan</a>
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
