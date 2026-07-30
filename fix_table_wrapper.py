import re

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove overflow-x: auto from .main-content to stop it from expanding infinitely
content = re.sub(r'overflow-x:\s*auto;\s*/\*\s*Enable horizontal scroll for wide tables natively\s*\*/', '', content)

# 2. Add overflow-x: auto and width: 100% to table wrappers
content += """
/* Fix table expanding the main content */
.transactions-table-wrapper, .table-container, .table-responsive {
    width: 100% !important;
    overflow-x: auto !important;
    display: block !important;
}
.page-content {
    min-width: 0 !important;
    width: 100% !important;
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Table layout constraint fixed!")
