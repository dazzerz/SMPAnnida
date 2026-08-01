import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

# 1. Update Finance files
finance_js_dir = os.path.join(base_dir, 'js', 'finance')
for js_file in os.listdir(finance_js_dir):
    if not js_file.endswith('.js'): continue
    filepath = os.path.join(finance_js_dir, js_file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace from './utils.js' to '../core/utils.js'
    new_content = content.replace("from './utils.js'", "from '../core/utils.js'")
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

# 2. Add LEGACY to js/finance/utils.js
utils_path = os.path.join(finance_js_dir, 'utils.js')
if os.path.exists(utils_path):
    with open(utils_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if "LEGACY" not in content:
        content = "// [LEGACY] - Siap dihapus pada Sprint Cleanup.\n" + content
        with open(utils_path, 'w', encoding='utf-8') as f:
            f.write(content)

# 3. Update Academic main.js
academic_main_path = os.path.join(base_dir, 'js', 'academic', 'main.js')
if os.path.exists(academic_main_path):
    with open(academic_main_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace inline escapeHTML with import
    # Find the escapeHTML block
    content = re.sub(r'// Escape HTML untuk mencegah XSS\nwindow\.escapeHTML = function\(str\) \{[\s\S]*?return div\.innerHTML;\n\};', 
                     r'import { escapeHTML } from \'../core/utils.js\';\nwindow.escapeHTML = escapeHTML;', content)
    
    with open(academic_main_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Shared Utilities Consolidation successful!")
