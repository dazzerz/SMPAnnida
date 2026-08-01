import re

file_path = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida\pages\finance\budget.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<aside class="sidebar" id="sidebar">.*?</aside>', content, re.DOTALL)
if match:
    old_aside = match.group(0)
    new_aside = '<aside class="sidebar" id="sidebar"></aside>\n<!-- [LEGACY] - Siap dihapus pada Sprint Cleanup.\n' + old_aside.replace('id="sidebar"', 'id="sidebar-legacy"') + '\n-->'
    content = content.replace(old_aside, new_aside)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('HTML replaced')
