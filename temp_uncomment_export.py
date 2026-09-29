import os

with open('js/academic/teacher-attendance.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('// export '):
        lines[i] = line.replace('// ', '')

with open('js/academic/teacher-attendance.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
