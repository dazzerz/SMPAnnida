import os
import re
import shutil

NEW_SIDEBAR = """  <!-- Unified Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo-icon">🏫</div>
      <div class="sidebar-brand">SMPAnnida</div>
    </div>

    <nav>
      <div class="nav-group">
        <div class="nav-group-title">Main</div>
        <a href="../../dashboard.html" class="nav-item">📊 Super Dashboard</a>
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
  </aside>"""

def process_html(source_path, dest_path):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove old CSS links
    content = re.sub(r'<link rel="stylesheet" href="\.\./css/global\.css"\s*/>', '', content)
    content = re.sub(r'<link rel="stylesheet" href="\.\./css/dashboard\.css"\s*/>', '', content)
    content = re.sub(r'<link rel="stylesheet" href="\.\./css/rab\.css"\s*/>', '', content)
    content = re.sub(r'<link rel="stylesheet" href="\.\./css/auth\.css"\s*/>', '', content)
    
    # Also handle PPDB/Academic css links which might be different, like "./assets/css/style.css" or similar
    content = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]*css[^"]*"\s*>', '', content)
    content = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]*css[^"]*"\s*/>', '', content)
    
    # 2. Add new CSS link
    if 'style.css' not in content:
        content = re.sub(r'(</title>)', r'\1\n  <link rel="stylesheet" href="../../css/style.css" />', content, flags=re.IGNORECASE)

    # 3. Replace sidebar
    content = re.sub(r'<nav class="sidebar".*?</nav>', NEW_SIDEBAR, content, flags=re.DOTALL)
    content = re.sub(r'<aside class="sidebar".*?</aside>', NEW_SIDEBAR, content, flags=re.DOTALL)

    # 4. Update JS imports (from relative to unified core)
    content = re.sub(r"import\s+\{.*?\}\s+from\s+['\"].*?/auth\.js['\"];", "import { getOptionalUser, handleLogout } from '../../js/core/auth.js';", content)

    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed: {dest_path}")

base_dir = r"C:\Users\daffaakhdaan\Annida2"

# Mappings of (Source Directory/File, Target Directory)
tasks = [
    (os.path.join(base_dir, "Annida2Finance", "pages"), os.path.join(base_dir, "SMPAnnida", "pages", "finance")),
    (os.path.join(base_dir, "Annida2PPDB", "pages"), os.path.join(base_dir, "SMPAnnida", "pages", "ppdb")),
]

# Handle directories
for src_dir, dst_dir in tasks:
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.html'):
                src_file = os.path.join(root, file)
                rel_path = os.path.relpath(src_file, src_dir)
                dst_file = os.path.join(dst_dir, rel_path)
                process_html(src_file, dst_file)

# Handle specific isolated files
isolated = [
    (os.path.join(base_dir, "Annida2PPDB", "index.html"), os.path.join(base_dir, "SMPAnnida", "pages", "ppdb", "index.html")),
    (os.path.join(base_dir, "Annida2Academic", "index.html"), os.path.join(base_dir, "SMPAnnida", "pages", "academic", "dashboard.html"))
]

for src_file, dst_file in isolated:
    if os.path.exists(src_file):
        process_html(src_file, dst_file)
