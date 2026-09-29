import os

with open("js/ppdb/db.js", "r", encoding="utf-8") as f:
    content = f.read()

# Fix swallowed error
content = content.replace('if (insErr) console.warn("Supabase students insert:", insErr.message);', 'if (insErr) throw new Error("Gagal menyimpan ke tabel siswa: " + insErr.message);')

with open("js/ppdb/db.js", "w", encoding="utf-8") as f:
    f.write(content)
