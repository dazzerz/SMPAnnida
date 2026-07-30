import os

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"
with open(css_path, 'a', encoding='utf-8') as f:
    f.write("\n\n/* Permanently remove theme toggle button from UI */\n.theme-toggle, #theme-toggle, [aria-label='Toggle Theme'] {\n  display: none !important;\n}\n")

print("Theme toggle removed from UI via CSS!")
