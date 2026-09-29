import os

with open('js/academic/teacher-attendance.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '// Checked in, not checked out' in line:
        if 'if (btnCamera)' not in lines[i+1]:
            lines.insert(i+1, '                    if (btnCamera) {\n')
            print(f"Fixed at line {i+1}")
            
    if '// Not checked in' in line:
        if 'if (btnCamera)' not in lines[i+1]:
            lines.insert(i+1, '                if (btnCamera) {\n')
            print(f"Fixed at line {i+1}")

with open('js/academic/teacher-attendance.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
