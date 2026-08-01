import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

# 1. Update JS files in js/academic
academic_js_dir = os.path.join(base_dir, 'js', 'academic')
for js_file in os.listdir(academic_js_dir):
    if not js_file.endswith('.js'): continue
    
    filepath = os.path.join(academic_js_dir, js_file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "import supabaseClient from '../core/supabase.js';" not in content:
        import_statement = "import supabaseClient from '../core/supabase.js';\nconst db = supabaseClient;\nwindow.db = supabaseClient;\n\n"
        
        # If it's main.js, mark legacy
        if js_file == 'main.js':
            content = re.sub(r'(// Konfigurasi Supabase\nconst SUPABASE_URL .*?\nconst SUPABASE_ANON_KEY .*?\n\n// Inisialisasi Supabase client\nwindow\.db = supabase\.createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\);)', 
                             r'// [LEGACY] - Siap dihapus pada Sprint Cleanup.\n/*\n\1\n*/', content, flags=re.DOTALL)
        elif js_file == 'login.js':
            # Just in case login.js has it
            content = re.sub(r'(// Konfigurasi Supabase\nconst SUPABASE_URL .*?\nconst SUPABASE_ANON_KEY .*?\n\n// Inisialisasi Supabase client\nwindow\.db = supabase\.createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\);)', 
                             r'// [LEGACY] - Siap dihapus pada Sprint Cleanup.\n/*\n\1\n*/', content, flags=re.DOTALL)
        
        content = import_statement + content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 2. Remove CDN from dashboard.html
dashboard_html_path = os.path.join(base_dir, 'pages', 'academic', 'dashboard.html')
if os.path.exists(dashboard_html_path):
    with open(dashboard_html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'\s*<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"[^>]*></script>', '', content)
    
    with open(dashboard_html_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Academic Supabase Migration successful!")
