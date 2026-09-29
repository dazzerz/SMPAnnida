import os

with open('js/academic/teacher-attendance.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '        }\n' == line and '    }\n' == lines[lines.index(line) + 1] if lines.index(line) + 1 < len(lines) else False:
        # Wait, it's safer to just remove the lines that I know I added.
        pass

# I'll just remove lines 108 and 109 which I added.
del lines[107:109]

with open('js/academic/teacher-attendance.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
