import os
import re

with open("js/academic/teacher-attendance.js", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """
                        (error) => {
                            console.error("Gagal mendapat GPS:", error);
                            showToast("Gagal mendeteksi lokasi GPS. Absensi mungkin tidak valid.", "error");
                        },
"""
content = re.sub(r'\(error\)\s*=>\s*\{\s*\},', replacement.strip() + ',', content)

with open("js/academic/teacher-attendance.js", "w", encoding="utf-8") as f:
    f.write(content)
