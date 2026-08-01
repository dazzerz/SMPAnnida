import os
import re

path = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida\js\ppdb\db.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Import escapeHTML
if "import { escapeHTML }" not in content:
    content = content.replace("import supabaseClient from '../core/supabase.js';", "import supabaseClient from '../core/supabase.js';\nimport { escapeHTML } from '../core/utils.js';")

# Replace nama mapping
pattern = r"const nama = p\.biodata_siswa \? p\.biodata_siswa\.nama_lengkap : 'Calon Siswa Baru';"
replacement = "const nama = escapeHTML(p.biodata_siswa ? p.biodata_siswa.nama_lengkap : 'Calon Siswa Baru');"
content = content.replace(pattern, replacement)

# Replace table HTML
pattern_table = r"""                tr\.innerHTML = `
                    <td><strong>\$\{p\.no_pendaftaran\}</strong></td>
                    <td>\$\{nama\}</td>
                    <td>Reguler</td>
                    <td>\$\{p\.tipe_pendaftaran === 'pondok' \? 'Sekolah \+ Pondok' : 'Sekolah Saja'\}</td>
                    <td><span class="status-badge status-\$\{statusClass\}">\$\{p\.status_pendaftaran\}</span></td>"""

replacement_table = """                tr.innerHTML = `
                    <td><strong>${escapeHTML(p.no_pendaftaran)}</strong></td>
                    <td>${nama}</td>
                    <td>Reguler</td>
                    <td>${escapeHTML(p.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok' : 'Sekolah Saja')}</td>
                    <td><span class="status-badge status-${escapeHTML(statusClass)}">${escapeHTML(p.status_pendaftaran)}</span></td>"""

content = re.sub(pattern_table, replacement_table, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated db.js XSS protection")
