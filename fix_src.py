import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\pages"

def fix_src(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # For finance:
    if "finance" in file_path:
        content = re.sub(r'<script.*src="(\.\./)+js/settings\.js.*".*</script>', r'<script type="module" src="../../js/finance/settings.js?v=6"></script>', content)
        
    # For PPDB:
    if "ppdb" in file_path:
        # PPDB had its own supabase-config.js and db.js in js/ppdb/
        content = re.sub(r'src="\.\./js/supabase-config\.js"', r'src="../../js/ppdb/supabase-config.js"', content)
        content = re.sub(r'src="\.\./js/db\.js"', r'src="../../js/ppdb/db.js"', content)
        content = re.sub(r'src="\.\./js/script\.js"', r'src="../../js/ppdb/script.js"', content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed script src in {file_path}")

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            fix_src(os.path.join(root, file))
