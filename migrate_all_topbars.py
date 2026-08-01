import os
import re

base_dir = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida'

files_to_update = [
    {'html': 'dashboard.html', 'js': 'dashboard.html'},
    {'html': 'pages/academic/dashboard.html', 'js': 'js/academic/main.js'},
    {'html': 'pages/finance/rab.html', 'js': 'js/finance/rab.js'},
    {'html': 'pages/finance/reports.html', 'js': 'js/finance/reports.js'},
    {'html': 'pages/finance/settings.html', 'js': 'js/finance/settings.js'},
    {'html': 'pages/finance/transactions.html', 'js': 'js/finance/transactions.js'},
    {'html': 'pages/ppdb/dashboard-admin.html', 'js': 'js/ppdb/script.js'},
    {'html': 'pages/ppdb/dashboard-siswa.html', 'js': 'js/ppdb/script.js'}
]

for item in files_to_update:
    html_path = os.path.join(base_dir, item['html'])
    js_path = os.path.join(base_dir, item['js'])
    
    if not os.path.exists(html_path):
        continue
        
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    if 'id="topbar-legacy"' in html_content:
        continue
        
    match = re.search(r'<header class="topbar">(.*?)</header>', html_content, re.DOTALL)
    if not match:
        continue
        
    old_topbar = match.group(0)
    topbar_inner = match.group(1)
    
    # Extract greeting, title, rightHtml
    greeting_match = re.search(r'<div class="topbar-greeting">(.*?)</div>', topbar_inner)
    greeting = greeting_match.group(1).strip() if greeting_match else ''
    
    title_match = re.search(r'<div class="topbar-title">(.*?)</div>', topbar_inner)
    title = title_match.group(1).strip() if title_match else ''
    
    right_match = re.search(r'<div class="topbar-right">(.*?)</div>', topbar_inner, re.DOTALL)
    right_html = ''
    if right_match:
        right_inner = right_match.group(1)
        # Remove theme-toggle since it's hardcoded in layout.js
        right_inner = re.sub(r'<button class="theme-toggle".*?</button>', '', right_inner).strip()
        # Escape single quotes and newlines for JS template literal
        right_html = right_inner.replace("`", "\\`").replace("\n", " ").strip()
        # Reduce multiple spaces
        right_html = re.sub(r'\s+', ' ', right_html)

    # Replace HTML
    new_topbar = '<header class="topbar" id="topbar"></header>\n<!-- [LEGACY] - Siap dihapus pada Sprint Cleanup.\n' + old_topbar.replace('class="topbar"', 'class="topbar-legacy"') + '\n-->'
    html_content = html_content.replace(old_topbar, new_topbar)
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Updated HTML: {item['html']}")
    
    # Inject JS
    with open(js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()
        
    js_inject = f"""injectTopbar('topbar', {{
  greeting: '{greeting}',
  title: '{title}',
  rightHtml: `{right_html}`
}});
"""
    if item['html'] == 'dashboard.html': # inline script
        if 'injectTopbar' not in js_content:
            js_content = js_content.replace(
                "import { injectSidebar } from './js/core/layout.js';",
                "import { injectSidebar, injectTopbar } from './js/core/layout.js';"
            )
            js_content = js_content.replace(
                "injectSidebar('sidebar', 'dashboard', '');\n",
                "injectSidebar('sidebar', 'dashboard', '');\n    " + js_inject
            )
    else:
        if 'injectTopbar' not in js_content:
            js_content = js_content.replace(
                "import { injectSidebar }",
                "import { injectSidebar, injectTopbar }"
            )
            js_content = js_content.replace(
                "injectSidebar('sidebar',",
                js_inject + "\ninjectSidebar('sidebar',"
            )
            
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Updated JS: {item['js']}")
