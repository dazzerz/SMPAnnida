export function injectSidebar(containerId, activeMenuId, basePath = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div class="sidebar-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div class="sidebar-logo-icon">🏫</div>
        <div class="sidebar-brand">SMPAnnida</div>
      </div>
      <button class="theme-toggle" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer;" aria-label="Toggle Theme">☀️</button>
    </div>

    <nav>
      <div class="nav-group">
        <div class="nav-group-title">Main</div>
        <a href="${basePath}dashboard.html" class="nav-item ${activeMenuId === 'dashboard' ? 'active' : ''}">📊 Super Dashboard</a>
      </div>

      <div class="nav-group">
        <div class="nav-group-title">Akademik & Kesiswaan</div>
        <a href="${basePath}pages/academic/dashboard.html" class="nav-item ${activeMenuId === 'academic' ? 'active' : ''}">👨‍🎓 Data Siswa</a>
      </div>

      <div class="nav-group">
        <div class="nav-group-title">Keuangan</div>
        <a href="${basePath}pages/finance/transactions.html" class="nav-item ${activeMenuId === 'transactions' ? 'active' : ''}">💸 Transaksi Kas</a>
        <a href="${basePath}pages/finance/budget.html" class="nav-item ${activeMenuId === 'budget' ? 'active' : ''}">🎯 Budget Bulanan</a>
        <a href="${basePath}pages/finance/rab.html" class="nav-item ${activeMenuId === 'rab' ? 'active' : ''}">📋 RAB Kelas</a>
      </div>

      <div class="nav-group">
        <div class="nav-group-title">Penerimaan (PPDB)</div>
        <a href="${basePath}pages/ppdb/index.html" class="nav-item ${activeMenuId === 'ppdb' ? 'active' : ''}">📝 Pendaftar Baru</a>
      </div>
    </nav>

    <div style="margin-top:auto">
      <div class="user-widget">
        <div class="user-avatar" id="user-avatar">G</div>
        <div style="flex:1;overflow:hidden;">
          <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;text-overflow:ellipsis;" id="nav-user-name">Guest</div>
          <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;text-overflow:ellipsis;" id="nav-user-email">Belum Login</div>
        </div>
      </div>
      <button class="btn btn-outline" style="width:100%;margin-top:1rem;" id="logout-btn">Keluar</button>
    </div>
    `;
}

export function injectTopbar(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const greeting = options.greeting || '';
    const title = options.title || '';
    const rightHtml = options.rightHtml || '';
    
    container.innerHTML = `
        <div class="flex items-center gap-md">
          <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
          <div class="topbar-left">
            <div class="topbar-greeting">${greeting}</div>
            <div class="topbar-title">${title}</div>
          </div>
        </div>
        <div class="topbar-right">
          <button class="theme-toggle" id="theme-toggle">☀️</button>
          ${rightHtml}
        </div>
    `;
}
