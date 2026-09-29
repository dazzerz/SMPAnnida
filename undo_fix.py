import os

with open('js/academic/teacher-attendance.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'if (btnCamera) {' in line:
        continue
    new_lines.append(line)

with open('js/academic/teacher-attendance.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
