import os

with open('js/academic/teacher-attendance.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Ambil Foto (Check Out)' in line:
        if '}' in lines[i+1]:
            lines[i+1] = ''
    if 'Ambil Foto (Check In)' in line:
        if '}' in lines[i+1]:
            lines[i+1] = ''

with open('js/academic/teacher-attendance.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
