import os
import glob

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"
finance_pages = glob.glob(os.path.join(base_dir, 'pages', 'finance', '*.html'))

for filepath in finance_pages:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the syntax error: () => window.location.href = '../../index.html';);
    # into: () => { window.location.href = '../../index.html'; });
    content = content.replace(
        "() => window.location.href = '../../index.html';);",
        "() => { window.location.href = '../../index.html'; });"
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Syntax errors fixed!")
