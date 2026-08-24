const fs = require('fs');
const path = require('path');

const newSidebar = `  <!-- Unified Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo-icon">🏫</div>
      <div class="sidebar-brand">SMPAnnida</div>
    </div>

    <nav>
      <div class="nav-group">
        <div class="nav-group-title">Main</div>
        <a href="../../index.html" class="nav-item">📊 Super Dashboard</a>
      </div>

      <div class="nav-group">
        <div class="nav-group-title">Akademik & Kesiswaan</div>
        <a href="../../pages/academic/dashboard.html" class="nav-item">👨‍🎓 Data Siswa</a>
      </div>

      <div class="nav-group">
        <div class="nav-group-title">Keuangan</div>
        <a href="../../pages/finance/transactions.html" class="nav-item">💸 Transaksi Kas</a>
        <a href="../../pages/finance/budget.html" class="nav-item">🎯 Budget Bulanan</a>
        <a href="../../pages/finance/rab.html" class="nav-item">📋 RAB Kelas</a>
      </div>

      <div class="nav-group">
        <div class="nav-group-title">Penerimaan (PPDB)</div>
        <a href="../../pages/ppdb/index.html" class="nav-item">📝 Pendaftar Baru</a>
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
  </aside>`;

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.html')) filelist.push(dirFile);
    }
  });
  return filelist;
}

const pagesDir = path.join(__dirname, 'pages');
const htmlFiles = walkSync(pagesDir);

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace CSS links
  content = content.replace(/<link rel="stylesheet" href="\.\.\/css\/.*?\.css" \/>/g, '');
  content = content.replace(/<link rel="stylesheet" href="\.\.\/css\/.*?" >/g, '');
  content = content.replace(/<link rel="stylesheet" href="\.\.\/css\/.*?"\/>/g, '');
  
  if (!content.includes('style.css')) {
     content = content.replace(/<\/title>/i, '</title>\n  <link rel="stylesheet" href="../../css/style.css" />');
  }

  // Replace sidebar (from <nav class="sidebar"... to </nav>)
  content = content.replace(/<nav class="sidebar" id="sidebar"[\s\S]*?<\/nav>/, newSidebar);
  // Alternative replacement if it was <aside class="sidebar"...
  content = content.replace(/<aside class="sidebar" id="sidebar"[\s\S]*?<\/aside>/, newSidebar);

  // Update Auth JS import
  content = content.replace(/import \{.*?\} from '\.\.\/js\/auth\.js';/g, "import { getOptionalUser, handleLogout } from '../../js/core/auth.js';");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated:', file);
});
