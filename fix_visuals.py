import re

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Body Gradients so Glassmorphism is visible
if "--body-bg-gradient" in content:
    content = re.sub(
        r'--body-bg-gradient:.*?;',
        r'--body-bg-gradient: radial-gradient(circle at 15% 50%, rgba(16, 185, 129, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(52, 211, 153, 0.15), transparent 25%);',
        content
    )

# Add sidebar to the glassmorphism list
content = content.replace(
    ".card, .auth-card, .metric-card, .dashboard-card, .glass-panel, .table-container, .modal, .modal-content, .rab-card, .transactions-table-wrapper {",
    ".card, .auth-card, .metric-card, .dashboard-card, .glass-panel, .table-container, .modal, .modal-content, .rab-card, .transactions-table-wrapper, .sidebar, .budget-card {"
)

# Update sidebar width to be responsive instead of locked
content = re.sub(
    r'\.sidebar\s*\{[\s\S]*?width:\s*280px;',
    lambda m: m.group(0).replace('width: 280px;', 'width: 22vw; min-width: 220px; max-width: 280px;'),
    content
)

# In case the sidebar width replacement failed, let's just append it to the glass block
content += """
/* Responsive Sidebar */
.sidebar {
  width: 22vw !important;
  min-width: 220px !important;
  max-width: 280px !important;
  border-right: 1px solid var(--glass-border) !important;
}
/* Colorful Background for Glassmorphism to work */
body {
  background-image: 
    radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(52, 211, 153, 0.15) 0%, transparent 40%) !important;
  background-attachment: fixed !important;
}
[data-theme="dark"] body {
  background-image: 
    radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(5, 150, 105, 0.2) 0%, transparent 40%) !important;
}
/* Force budget grid to have at least 2 columns on decent sized screens */
.budget-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Visuals fixed!")
