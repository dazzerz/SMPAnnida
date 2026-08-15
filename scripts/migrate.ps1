$newSidebar = @"
  <!-- Unified Sidebar -->
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
  </aside>
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $False

Get-ChildItem -Path "pages" -Filter "*.html" -Recurse | ForEach-Object {
    $content = [IO.File]::ReadAllText($_.FullName, $utf8NoBom)

    # Replace CSS Links
    $content = $content -replace '<link rel="stylesheet" href="\.\./css/global\.css".*?>', ''
    $content = $content -replace '<link rel="stylesheet" href="\.\./css/dashboard\.css".*?>', ''
    $content = $content -replace '<link rel="stylesheet" href="\.\./css/rab\.css".*?>', ''
    $content = $content -replace '<link rel="stylesheet" href="\.\./css/auth\.css".*?>', ''
    
    if (-not $content.Contains('style.css')) {
        $content = $content -replace '</title>', "</title>`n  <link rel=`"stylesheet`" href=`"../../css/style.css`" />"
    }

    # Replace sidebar
    $content = $content -replace '(?s)<nav class="sidebar" id="sidebar".*?</nav>', $newSidebar
    $content = $content -replace '(?s)<aside class="sidebar" id="sidebar".*?</aside>', $newSidebar

    # Update Auth JS import
    $content = $content -replace "import \{.*?\} from '\.\./js/auth\.js';", "import { getOptionalUser, handleLogout } from '../../js/core/auth.js';"
    $content = $content -replace "import \{.*?\} from '\.\./js/core/auth\.js';", "import { getOptionalUser, handleLogout } from '../../js/core/auth.js';"

    # Set content
    [IO.File]::WriteAllText($_.FullName, $content, $utf8NoBom)
    Write-Host "Fixed encoding and updated: $($_.FullName)"
}
