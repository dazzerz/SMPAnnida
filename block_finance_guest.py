import os
import glob
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"
finance_pages = glob.glob(os.path.join(base_dir, 'pages', 'finance', '*.html'))
root_dash = os.path.join(base_dir, 'dashboard.html')

files_to_check = finance_pages + [root_dash]

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Fix incorrect login paths (../login.html or login.html) to root index.html
    # In pages/finance, root is ../../index.html
    # In root dashboard, root is index.html
    if 'dashboard.html' in os.path.basename(filepath) and filepath == root_dash:
        content = re.sub(r'window\.location\.href\s*=\s*[\'"](\.\/)?login\.html[\'"];?', r"window.location.href = 'index.html';", content)
    else:
        content = re.sub(r'window\.location\.href\s*=\s*[\'"](\.\./)*login\.html[\'"];?', r"window.location.href = '../../index.html';", content)
    
    # 2. Block guest mode unconditionally in Finance.
    # Replace the block:
    # if (!sessionStorage.getItem('guest_mode_active')) { window.location.href = ... }
    # With just window.location.href = ... (so it always redirects if user is null)
    # The code structure in finance pages is usually:
    # else {
    #    if (!sessionStorage.getItem('guest_mode_active')) { ... }
    
    # Let's replace the whole `else { ... }` block that handles guest mode in Finance with a simple redirect.
    # Wait, it's easier to replace `!sessionStorage.getItem('guest_mode_active')` with `true` to force the redirect.
    content = content.replace("!sessionStorage.getItem('guest_mode_active')", "true")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Finance pages locked down against guest access and broken login links fixed!")
