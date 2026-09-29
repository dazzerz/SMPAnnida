import os
import re

with open("js/student/dashboard.js", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """
  if (!student) {
      document.getElementById('topbar-student-name').textContent = 'Akun Belum Dikonfigurasi';
      const classEl = document.getElementById('topbar-student-class');
      if (classEl) classEl.textContent = 'Hubungi Tata Usaha';
      
      const main = document.querySelector('main');
      if (main) {
          main.innerHTML = `
            <div style="padding: 2rem; max-width: 600px; margin: 2rem auto; background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; color: #991b1b; text-align: center;">
              <h2 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">Akun Belum Dikonfigurasi</h2>
              <p>Mohon maaf, akun email Anda belum terhubung dengan data profil Santri Aktif kami. Silakan hubungi bagian Administrasi atau Tata Usaha untuk melengkapi profil data Anda.</p>
            </div>
          `;
      }
      return;
  }
"""

content = re.sub(r'if \(\!student\) \{.*?// Fallback Mocking.*?\}\s*currentStudent = student;', replacement.strip() + '\n  currentStudent = student;', content, flags=re.DOTALL)

with open("js/student/dashboard.js", "w", encoding="utf-8") as f:
    f.write(content)
