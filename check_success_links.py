# -*- coding: utf-8 -*-
import os

project_dir = r"C:\Users\daffaakhdaan\Study Project"
success_path = os.path.join(project_dir, 'pages/ppdb/success.html')

with open(success_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
links = re.findall(r'href="([^"]+)"', content)
for l in links:
    print("Found link:", l)
