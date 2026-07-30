import os
import re

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

def set_light(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    content = re.sub(r'<html([^>]*)data-theme="dark"([^>]*)>', r'<html\1data-theme="light"\2>', content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Set to light mode in {file_path}")

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            set_light(os.path.join(root, file))
