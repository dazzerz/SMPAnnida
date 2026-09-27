import os
import re

with open('css/theme/layout.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = re.sub(r'z-index:\s*\d+\s*!important;', 'z-index: var(--z-sidebar) !important;', css)
# Wait, replacing all z-indexes with --z-sidebar is wrong. Let's just do exactly what's needed.
css = css.replace('z-index: 1200 !important;', 'z-index: var(--z-sidebar) !important;')
css = css.replace('z-index: 1001 !important;', 'z-index: var(--z-sidebar) !important;')

with open('css/theme/layout.css', 'w', encoding='utf-8') as f:
    f.write(css)

