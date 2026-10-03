import os

with open("README.md", "r", encoding="utf-8") as f:
    content = f.read()

install_instructions = """## Installation & Setup
1. Clone repositori ini.
2. Salin `.env.example` ke `.env` dan **Set `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` di `.env`**.
3. Jalankan `npm install`.
4. Jalankan `npm run dev` untuk development.
"""

content = content.replace("## Folder Structure", install_instructions + "\n## Folder Structure")

with open("README.md", "w", encoding="utf-8") as f:
    f.write(content)
