import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

def update_html_sidebar(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already processed
    if 'id="sidebar-legacy"' in content:
        return
        
    match = re.search(r'<aside class=\"sidebar\" id=\"sidebar\">(.*?)</aside>', content, re.DOTALL)
    if match:
        old_aside = match.group(0)
        new_aside = '<aside class=\"sidebar\" id=\"sidebar\"></aside>\n<!-- [LEGACY] - Siap dihapus pada Sprint Cleanup.\n' + old_aside.replace('id=\"sidebar\"', 'id=\"sidebar-legacy\"') + '\n-->'
        content = content.replace(old_aside, new_aside)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'HTML sidebar replaced in {os.path.basename(filepath)}')

def inject_js(filepath, active_menu, base_path):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "injectSidebar" in content:
        return
        
    import_stmt = f"import {{ injectSidebar }} from '{base_path}core/layout.js';\ninjectSidebar('sidebar', '{active_menu}', '{base_path.replace('core/', '')}');\n\n"
    
    # If the file starts with imports, put it with them. Otherwise at top.
    # Actually, putting it at the top is fine for modules.
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(import_stmt + content)
    print(f'Injected JS in {os.path.basename(filepath)}')

# 1. Root dashboard.html
root_html = os.path.join(base_dir, 'dashboard.html')
if os.path.exists(root_html):
    update_html_sidebar(root_html)
    with open(root_html, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'injectSidebar' not in c:
        c = c.replace('<script type="module">', '<script type="module">\n    import { injectSidebar } from \'./js/core/layout.js\';\n    injectSidebar(\'sidebar\', \'dashboard\', \'\');')
        with open(root_html, 'w', encoding='utf-8') as f:
            f.write(c)
        print("Injected JS into root dashboard.html")

# 2. Academic
acad_html = os.path.join(base_dir, 'pages', 'academic', 'dashboard.html')
if os.path.exists(acad_html):
    update_html_sidebar(acad_html)
    inject_js(os.path.join(base_dir, 'js', 'academic', 'main.js'), 'academic', '../')

# 3. Finance
finance_files = ['rab', 'reports', 'settings', 'transactions']
for f in finance_files:
    f_html = os.path.join(base_dir, 'pages', 'finance', f + '.html')
    if os.path.exists(f_html):
        update_html_sidebar(f_html)
        inject_js(os.path.join(base_dir, 'js', 'finance', f + '.js'), f, '../')

# 4. PPDB
ppdb_admin = os.path.join(base_dir, 'pages', 'ppdb', 'dashboard-admin.html')
ppdb_siswa = os.path.join(base_dir, 'pages', 'ppdb', 'dashboard-siswa.html')
if os.path.exists(ppdb_admin): update_html_sidebar(ppdb_admin)
if os.path.exists(ppdb_siswa): update_html_sidebar(ppdb_siswa)
inject_js(os.path.join(base_dir, 'js', 'ppdb', 'script.js'), 'ppdb', '../')

print("All sidebar migrations completed!")
