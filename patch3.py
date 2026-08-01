import os
import re

path = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida\js\finance\transactions.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix populateCategoryDropdown
pattern1 = r'filtered\.map\(c => `<option value="\$\{c\.id\}">\$\{c\.icon\} \$\{c\.name\}</option>`\)\.join\(\'\'\);'
replacement1 = r"filtered.map(c => `<option value=\"${escapeHTML(c.id)}\">${escapeHTML(c.icon)} ${escapeHTML(c.name)}</option>`).join('');"
content = re.sub(pattern1, replacement1, content)

# Fix renderRecentTransactions icon and color
pattern2 = r'\$\{cat\?\.icon \|\| \'\?\?\'\}</div>'
replacement2 = r"${escapeHTML(cat?.icon || '??')}</div>"
content = re.sub(pattern2, replacement2, content)

# Fix renderTransactionsTable cat?.name and cat?.icon
pattern3 = r'<td><span style="font-size:1\.2rem">\$\{cat\?\.icon \|\| \'\?\?\'\}</span></td>'
replacement3 = r'<td><span style="font-size:1.2rem">${escapeHTML(cat?.icon || \'??\')}</span></td>'
content = re.sub(pattern3, replacement3, content)

pattern4 = r'<span>\$\{cat\?\.name \|\| \'Lainnya\'\}</span></td>'
replacement4 = r'<span>${escapeHTML(cat?.name || \'Lainnya\')}</span></td>'
# Wait, in the code it is actually:
# <td><span class="badge" style="background:var(--bg-secondary);color:var(--text-secondary);font-weight:500;">${cat?.name || 'Lainnya'}</span></td>
pattern5 = r'\$\{cat\?\.name \|\| \'Lainnya\'\}</span>'
replacement5 = r'${escapeHTML(cat?.name || \'Lainnya\')}</span>'
content = re.sub(pattern5, replacement5, content)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated transactions.js XSS protection")
