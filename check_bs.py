import re

with open('C:/Users/daffaakhdaan/Annida2/SMPAnnida/js/academic/migration.js', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if '\\' in line and not '\\\\' in line and not '//' in line and not 'n' in line.split('\\')[-1]:
        print(f"Line {i+1}: {line}")
