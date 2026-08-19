import re

with open('js/core/layout.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace(
    '<div class="sidebar-logo-icon"><img src="1.png" alt="Logo Annida"></div>',
    '<div class="sidebar-logo-icon"><img src="${basePath}1.png" alt="Logo Annida"></div>'
)

with open('js/core/layout.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Fixed layout.js")
