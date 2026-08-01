import re
import os

base_dir = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida'

# 1. Update layout.js
layout_path = os.path.join(base_dir, 'js', 'core', 'layout.js')
with open(layout_path, 'r', encoding='utf-8') as f:
    layout_content = f.read()

if 'injectTopbar' not in layout_content:
    topbar_func = """
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
"""
    with open(layout_path, 'a', encoding='utf-8') as f:
        f.write(topbar_func)
    print("layout.js updated")

# 2. Update budget.html
budget_html_path = os.path.join(base_dir, 'pages', 'finance', 'budget.html')
with open(budget_html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

match = re.search(r'<header class="topbar">.*?</header>', html_content, re.DOTALL)
if match and 'id="topbar"' not in html_content:
    old_topbar = match.group(0)
    new_topbar = '<header class="topbar" id="topbar"></header>\n<!-- [LEGACY] - Siap dihapus pada Sprint Cleanup.\n' + old_topbar.replace('class="topbar"', 'class="topbar-legacy"') + '\n-->'
    html_content = html_content.replace(old_topbar, new_topbar)
    with open(budget_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print("budget.html updated")

# 3. Update budget.js
budget_js_path = os.path.join(base_dir, 'js', 'finance', 'budget.js')
with open(budget_js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

if 'injectTopbar' not in js_content:
    js_content = js_content.replace(
        "import { injectSidebar } from '../core/layout.js';",
        "import { injectSidebar, injectTopbar } from '../core/layout.js';"
    )
    js_inject = """injectTopbar('topbar', {
  greeting: 'Kelola',
  title: 'Budget Bulanan',
  rightHtml: '<button class="btn btn-primary btn-sm" id="add-budget-btn">＋ Tambah Budget</button>'
});
"""
    js_content = js_content.replace(
        "injectSidebar('sidebar', 'budget', '../../');\n",
        "injectSidebar('sidebar', 'budget', '../../');\n" + js_inject
    )
    with open(budget_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("budget.js updated")
