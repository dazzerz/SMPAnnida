import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

# 1. Update JS files in js/finance
for filename in ['app.js', 'rab.js', 'settings.js']:
    filepath = os.path.join(base_dir, 'js', 'finance', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace import from './auth.js' to '../core/auth.js'
    content = content.replace("from './auth.js'", "from '../core/auth.js'")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Update HTML files in pages/finance/rab.html
filepath = os.path.join(base_dir, 'pages', 'finance', 'rab.html')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('src="../js/supabase.js', 'src="../../js/core/supabase.js')
content = content.replace('src="../js/utils.js', 'src="../../js/core/utils.js')
content = content.replace('src="../js/auth.js', 'src="../../js/core/auth.js')
content = content.replace('src="../js/rab.js', 'src="../../js/finance/rab.js')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# 3. Add LEGACY comment to js/finance/auth.js
filepath = os.path.join(base_dir, 'js', 'finance', 'auth.js')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "LEGACY" not in content:
    content = "// [LEGACY] File ini sudah didepresiasi dan tidak lagi digunakan. Gunakan js/core/auth.js sebagai Single Source of Truth.\n" + content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Auth migration successful!")
