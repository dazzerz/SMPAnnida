# -*- coding: utf-8 -*-
import os

project_dir = r"C:\Users\daffaakhdaan\Study Project"

for root, dirs, files in os.walk(project_dir):
    # skip node_modules and .git
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.sql') or file.endswith('.py') or file.endswith('.js'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if 'CREATE TABLE public.pendaftaran' in content or 'CREATE TABLE pendaftaran' in content:
                    print(f"Found in {path}")
                    # print first 50 lines containing this
                    lines = content.split('\n')
                    for idx, line in enumerate(lines):
                        if 'CREATE TABLE' in line and 'pendaftaran' in line:
                            for j in range(max(0, idx-2), min(len(lines), idx+20)):
                                print(f"  {j+1}: {lines[j]}")
                            break
            except:
                pass
