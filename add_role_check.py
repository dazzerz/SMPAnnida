import os
import re

with open("js/core/auth.js", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """  const allowedRoles = ['admin','teacher','pembina','finance','wali_murid','calon_siswa','siswa','student'];
  if (!allowedRoles.includes(r)) {
    showAuthMessage('Akses ditolak: role tidak dikenali', 'error');
    setLoading('login-btn', false);
    return;
  }

  // Simplified redirect
  setTimeout(() => {"""

content = content.replace("""  // Simplified redirect for teacher\u00e2\u20ac\u201a`only access
  setTimeout(() => {""", replacement)
content = content.replace("""  // Simplified redirect for teacher?`only access
  setTimeout(() => {""", replacement)

with open("js/core/auth.js", "w", encoding="utf-8") as f:
    f.write(content)
