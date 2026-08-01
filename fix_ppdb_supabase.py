import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

# 1. Remove CDN and supabase-config.js from HTML files
ppdb_html_dir = os.path.join(base_dir, 'pages', 'ppdb')
for file in os.listdir(ppdb_html_dir):
    if file.endswith('.html'):
        filepath = os.path.join(ppdb_html_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove CDN
        content = re.sub(r'\s*<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"[^>]*></script>', '', content)
        # Remove supabase-config.js
        content = re.sub(r'\s*<script type="module" src="\.\./js/supabase-config\.js"[^>]*></script>', '', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 2. Add import to db.js and auth.js
for js_file in ['db.js', 'auth.js']:
    filepath = os.path.join(base_dir, 'js', 'ppdb', js_file)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "import supabaseClient from '../core/supabase.js';" not in content:
            import_statement = "import supabaseClient from '../core/supabase.js';\nconst db = supabaseClient;\n"
            # Find the best place to insert, right after the initial comments if possible
            if content.startswith("//"):
                parts = content.split('\n\n', 1)
                if len(parts) == 2:
                    content = parts[0] + '\n\n' + import_statement + parts[1]
                else:
                    content = import_statement + content
            else:
                content = import_statement + content
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

# 3. Update LEGACY comment in supabase-config.js
config_path = os.path.join(base_dir, 'js', 'ppdb', 'supabase-config.js')
if os.path.exists(config_path):
    with open(config_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace old legacy comment if exists
    content = re.sub(r'// \[LEGACY\].*?\n', '', content)
    content = "// [LEGACY] - Siap dihapus pada Sprint Cleanup.\n" + content
    
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("PPDB Supabase Migration successful!")
