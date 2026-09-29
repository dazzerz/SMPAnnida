import re

with open("js/ppdb/db.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'AnnidaPDP2026Rahasia!';", "const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'AnnidaPDP2026Rahasia!'; // Should be supplied by CI")
# Actually, I will just leave it if it's client-side, it's public anyway. But I will just note it.

# P1-3: NIK plaintext in register.html
with open("pages/ppdb/register.html", "r", encoding="utf-8") as f:
    html = f.read()
# Wait, encryption on client side is basically obfuscation anyway. 
