import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"
dashboard_html_path = os.path.join(base_dir, 'pages', 'academic', 'dashboard.html')

with open(dashboard_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace script tags that load academic JS files to use type="module"
content = re.sub(r'<script src="js/(main|dashboard|absensi|nilai|jadwal)\.js"( defer)?>', r'<script type="module" src="js/\1.js"\2>', content)

with open(dashboard_html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Academic Module System Migration successful!")
