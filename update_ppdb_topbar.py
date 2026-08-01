import os
import re

base_dir = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida'

files_html = ['pages/ppdb/dashboard-admin.html', 'pages/ppdb/dashboard-siswa.html']

for f_html in files_html:
    path = os.path.join(base_dir, f_html)
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    match = re.search(r'<header class="page-header">(.*?)</header>', html, re.DOTALL)
    if match:
        header_inner = match.group(1)
        full_match = match.group(0)
        new_header = f'<header class="topbar" id="topbar"></header>\n<!-- [LEGACY] - Siap dihapus pada Sprint Cleanup.\n<header class="page-header-legacy">\n{header_inner}\n</header>\n-->'
        new_html = html.replace(full_match, new_header)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print('Updated HTML:', f_html)
    else:
        print('Not found in:', f_html)

js_path = os.path.join(base_dir, 'js/ppdb/script.js')
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

if 'injectTopbar' not in js:
    js = js.replace("import { injectSidebar } from '../core/layout.js';", "import { injectSidebar, injectTopbar } from '../core/layout.js';")
    
    injection = """
const isSiswa = window.location.pathname.includes('siswa');
injectTopbar('topbar', {
    greeting: isSiswa ? 'Portal PPDB' : 'Gelombang 1 - SMP Sekolah Alam + Tahfidz 2026/2027',
    title: isSiswa ? 'Portal Calon Siswa' : 'Admin PPDB Panel'
});
"""
    js = js.replace("injectSidebar('sidebar', 'ppdb', '../');", "injectSidebar('sidebar', 'ppdb', '../');\n" + injection)
    
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print('Updated JS:', 'js/ppdb/script.js')
