import os
import re

with open("js/core/auth.js", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """
    if (r === 'teacher' || r === 'admin' || r === 'pembina') {
      window.location.href = './pages/academic/dashboard.html';
    } else if (r === 'finance') {
      window.location.href = './pages/finance/dashboard.html';
    } else if (r === 'panitia_ppdb') {
      window.location.href = './pages/ppdb/dashboard-admin.html';
    } else if (r === 'wali_murid' || r === 'calon_siswa') {
      window.location.href = './pages/ppdb/dashboard-wali.html';
    } else if (r === 'siswa') {
      window.location.href = './pages/student/dashboard.html';
    } else {
      window.location.href = './dashboard.html';
    }
"""

content = re.sub(r"if \(r === 'teacher' \|\| r === 'admin' \|\| r === 'pembina'\) \{.*?\} else \{.*?\}", replacement.strip(), content, flags=re.DOTALL)

with open("js/core/auth.js", "w", encoding="utf-8") as f:
    f.write(content)
