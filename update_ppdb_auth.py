import os
import re

base_dir = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida'

db_js_path = os.path.join(base_dir, 'js', 'ppdb', 'db.js')

with open(db_js_path, 'r', encoding='utf-8') as f:
    db_js = f.read()

# Replace imports
db_js = db_js.replace(
    "import supabaseClient from '../core/supabase.js';",
    "import supabaseClient from '../core/supabase.js';\nimport { getOptionalUser } from '../core/auth.js';"
)

# Replace session logic
# Using regex to find the block
pattern = r'    let sessionUser = null;\s*// Inisialisasi Sesi Auth Supabase.*?    const userId = sessionUser \? sessionUser\.id : localStorage\.getItem\(\'user_id\'\);'

replacement = """    let sessionUser = null;
    let userId = null;
    
    try {
        sessionUser = await getOptionalUser();
        if (sessionUser) {
            userId = sessionUser.id;
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user_email', sessionUser.email);
        } else {
            userId = localStorage.getItem('user_id');
        }
    } catch (e) {
        console.warn("Autentikasi offline / local-only");
        userId = localStorage.getItem('user_id');
    }"""

new_db_js = re.sub(pattern, replacement, db_js, flags=re.DOTALL)

if new_db_js != db_js:
    with open(db_js_path, 'w', encoding='utf-8') as f:
        f.write(new_db_js)
    print("Updated db.js successfully.")
else:
    print("Failed to replace pattern in db.js")
