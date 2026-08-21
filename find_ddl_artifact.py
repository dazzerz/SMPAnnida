# -*- coding: utf-8 -*-
import os

artifact_dir = r"C:\Users\daffaakhdaan\.gemini\antigravity\brain\23349e50-d2bb-4ed7-abd9-50b43b594451"

for root, dirs, files in os.walk(artifact_dir):
    for file in files:
        if file.endswith('.py') or file.endswith('.sql') or file.endswith('.md'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if 'CREATE TABLE' in content and 'pendaftaran' in content:
                    print(f"Found in {path}")
                    lines = content.split('\n')
                    for idx, line in enumerate(lines):
                        if 'CREATE TABLE' in line and 'pendaftaran' in line:
                            for j in range(max(0, idx-2), min(len(lines), idx+30)):
                                print(f"  {j+1}: {lines[j]}")
                            break
            except:
                pass
