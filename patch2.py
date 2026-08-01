import os
import re

path = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida\js\ppdb\db.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"    const isAdminDashboard = document\.getElementById\('table-pendaftar-body'\);\n    if \(isAdminDashboard\) \{\n        console\.log\(\"Memuat data pendaftar untuk Admin\.\.\.\"\);\n        loadAdminData\(\);\n    \}"

replacement = """    const isAdminDashboard = document.getElementById('table-pendaftar-body');
    if (isAdminDashboard) {
        if (!sessionUser || !sessionUser.email || !sessionUser.email.includes('admin')) {
            alert("Akses Ditolak: Anda tidak memiliki izin untuk mengakses halaman Admin.");
            window.location.href = '../../index.html';
            return;
        }
        console.log("Memuat data pendaftar untuk Admin...");
        loadAdminData();
    }"""

content = re.sub(pattern, replacement, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated db.js authorization")
