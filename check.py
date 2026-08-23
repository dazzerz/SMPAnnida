content = open(r'C:\Users\daffaakhdaan\Study Project\pages\ppdb\dashboard-wali.html', encoding='utf-8').read()
import re
lines = content.split('\n')
div_depth = 0
for i, line in enumerate(lines):
    line = re.sub(r'<!--.*?-->', '', line)
    opens = len(re.findall(r'<div\b', line, re.IGNORECASE))
    closes = len(re.findall(r'</div\b', line, re.IGNORECASE))
    div_depth += opens
    div_depth -= closes

print(f'Final depth at end of file: {div_depth}')
