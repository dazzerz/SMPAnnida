import os

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

# 1. Update JS files in js/finance
files_to_update = [
    'app.js', 'auth.js', 'budget.js', 
    'import.js', 'rab.js', 'settings.js', 'transactions.js'
]

for filename in files_to_update:
    filepath = os.path.join(base_dir, 'js', 'finance', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace import from './supabase.js' to '../core/supabase.js'
    content = content.replace("from './supabase.js'", "from '../core/supabase.js'")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Add LEGACY comment to js/finance/supabase.js
filepath = os.path.join(base_dir, 'js', 'finance', 'supabase.js')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "LEGACY" not in content:
    content = "// [LEGACY] - Tidak lagi digunakan. Siap dihapus pada sprint cleanup. Menggunakan js/core/supabase.js\n" + content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Supabase migration successful for Finance!")
