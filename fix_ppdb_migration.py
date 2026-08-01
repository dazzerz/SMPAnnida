import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

# 1. Add type="module" to all PPDB script tags
ppdb_html_dir = os.path.join(base_dir, 'pages', 'ppdb')
for file in os.listdir(ppdb_html_dir):
    if file.endswith('.html'):
        filepath = os.path.join(ppdb_html_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace script tags that load PPDB JS
        content = re.sub(r'<script src="(\.\./)?js/(supabase-config|db|script|auth)\.js"( defer)?>', r'<script type="module" src="\1js/\2.js"\3>', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 2. Extract inline script from dashboard-admin.html
admin_html_path = os.path.join(ppdb_html_dir, 'dashboard-admin.html')
with open(admin_html_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

inline_script_match = re.search(r'<script>\s*// High fidelity interactive functions for admin dashboard mock(.*?)</script>', admin_content, re.DOTALL)
if inline_script_match:
    inline_script = inline_script_match.group(1)
    
    # Remove the inline script from HTML
    admin_content = admin_content[:inline_script_match.start()] + admin_content[inline_script_match.end():]
    with open(admin_html_path, 'w', encoding='utf-8') as f:
        f.write(admin_content)
    
    # Transform functions to window.X = function()
    inline_script = re.sub(r'function\s+(\w+)\s*\(', r'window.\1 = function(', inline_script)
    
    # Append to script.js
    script_js_path = os.path.join(base_dir, 'js', 'ppdb', 'script.js')
    with open(script_js_path, 'a', encoding='utf-8') as f:
        f.write("\n\n// --- Extracted from inline HTML ---\n" + inline_script)

# 3. Add LEGACY to supabase-config.js
config_path = os.path.join(base_dir, 'js', 'ppdb', 'supabase-config.js')
with open(config_path, 'r', encoding='utf-8') as f:
    config_content = f.read()

if "LEGACY" not in config_content:
    config_content = "// [LEGACY] - Akan diganti setelah seluruh PPDB selesai menggunakan ES Module.\n" + config_content
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(config_content)

print("PPDB Module System Migration successful!")
