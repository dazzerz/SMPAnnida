import os

with open('js/academic/teacher-attendance.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'function formatTime(isoString) {' in line:
        lines.insert(i, '        }\n    }\n')
        print(f"Fixed missing bracket at line {i+1}")
        break

with open('js/academic/teacher-attendance.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
