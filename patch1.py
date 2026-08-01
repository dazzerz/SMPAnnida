import os
import re

path = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida\js\academic\main.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace checkAuth block and imports
pattern = r"window\.isGuest = localStorage\.getItem\('isGuest'\) === 'true';\s*import \{ escapeHTML \} from '../core/utils\.js';\s*window\.escapeHTML = escapeHTML;\s*async function checkAuth\(\) \{.*?\n\}\n// Jalankan cek auth\ncheckAuth\(\);"
replacement = """import { escapeHTML } from '../core/utils.js';
import { requireAuth } from '../core/auth.js';
window.escapeHTML = escapeHTML;

async function initAuth() {
    await requireAuth();
    const profileName = document.querySelector('.user-profile span');
    if (profileName) {
        profileName.textContent = 'Guru Admin';
    }
}
initAuth();"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Remove old logout block
logout_pattern = r"    // Logout\n    const btnLogout = document\.getElementById\('btn-logout'\);\n    if\(btnLogout\) \{\n        btnLogout\.addEventListener\('click', async \(\) => \{\n            localStorage\.removeItem\('isGuest'\);\n            await db\.auth\.signOut\(\);\n            window\.location\.href = '\.\./\.\./index\.html';\n        \}\);\n    \}"
content = re.sub(logout_pattern, "", content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated main.js")
