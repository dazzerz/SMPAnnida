import os
import re
import shutil

NEW_SIDEBAR = """  <!-- Unified Sidebar -->
  <aside class="sidebar" id="sidebar">
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

def process_html(source_path, dest_path, module_name):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remap old CSS links to the new modular CSS paths
    # 1. Find all link rel stylesheet tags
    def replace_css_link(match):
        full_tag = match.group(0)
        href = match.group(1)
        filename = os.path.basename(href)
        # Point to the specific modular css directory
        return f'<link rel="stylesheet" href="../../css/{module_name}/{filename}">'
    
    # Replace single or double quote hrefs
    content = re.sub(r'<link\s+rel="stylesheet"\s+href=["\']([^"\']+\.css)["\']\s*/?>', replace_css_link, content, flags=re.IGNORECASE)

    # 2. Add the overriding Glassmorphism style.css at the end of the <head>
    # Wait, only if it's not already there! Since we read from SOURCE, it won't be there.
    # But just in case:
    if 'href="../../css/style.css"' not in content:
        content = re.sub(r'(</head>)', r'  <link rel="stylesheet" href="../../css/style.css" />\n\1', content, flags=re.IGNORECASE)

    # 3. Replace sidebar
    content = re.sub(r'<nav class="sidebar".*?</nav>', NEW_SIDEBAR, content, flags=re.DOTALL)
    content = re.sub(r'<aside class="sidebar".*?</aside>', NEW_SIDEBAR, content, flags=re.DOTALL)

    # 4. Update JS imports
    content = re.sub(r"import\s+\{.*?\}\s+from\s+['\"].*?/auth\.js['\"];", "import { getOptionalUser, handleLogout } from '../../js/core/auth.js';", content)
    content = re.sub(r"import\s+\w+\s+from\s+['\"].*?/supabase(?:-config)?\.js['\"];", "import supabaseClient from '../../js/core/supabase.js';", content)
    content = re.sub(r"from\s+['\"]\.\./js/utils\.js['\"]", "from '../../js/core/utils.js'", content)
    # Catch any remaining module scripts
    content = re.sub(r"from\s+['\"]\.\./js/([^'\"]+\.js)['\"]", lambda m: f"from '../../js/{module_name}/{m.group(1)}'", content)

    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed ({module_name}): {dest_path}")

base_dir = r"C:\Users\daffaakhdaan\Annida2"

tasks = [
    (os.path.join(base_dir, "Annida2Finance", "pages"), os.path.join(base_dir, "SMPAnnida", "pages", "finance"), "finance"),
    (os.path.join(base_dir, "Annida2PPDB", "pages"), os.path.join(base_dir, "SMPAnnida", "pages", "ppdb"), "ppdb"),
]

for src_dir, dst_dir, module in tasks:
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.html'):
                src_file = os.path.join(root, file)
                rel_path = os.path.relpath(src_file, src_dir)
                dst_file = os.path.join(dst_dir, rel_path)
                process_html(src_file, dst_file, module)

isolated = [
    (os.path.join(base_dir, "Annida2PPDB", "index.html"), os.path.join(base_dir, "SMPAnnida", "pages", "ppdb", "index.html"), "ppdb"),
    (os.path.join(base_dir, "Annida2Academic", "index.html"), os.path.join(base_dir, "SMPAnnida", "pages", "academic", "dashboard.html"), "academic")
]

for src_file, dst_file, module in isolated:
    if os.path.exists(src_file):
        process_html(src_file, dst_file, module)
