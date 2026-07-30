import re

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Free the Sidebar from min/max locks
content = re.sub(
    r'/\*\s*Responsive Sidebar\s*\*/[\s\S]*?border-right:.*?$',
    r'''/* Truly Fluid Sidebar (No Locks) */
.sidebar {
  width: 20% !important;
  flex: 0 0 20% !important;
  border-right: 1px solid var(--glass-border) !important;
}''',
    content,
    flags=re.MULTILINE | re.IGNORECASE
)

# Also remove any other min-width/max-width from older sidebar rules
content = re.sub(r'width:\s*22vw;\s*min-width:\s*220px;\s*max-width:\s*280px;', 'width: 20%;', content)

# 2. Free the Budget Grid to always be exactly 2 columns on desktop (as requested)
content = re.sub(
    r'/\*\s*Force budget grid to have at least 2 columns.*?\*/[\s\S]*?\.budget-grid\s*\{[\s\S]*?\}',
    r'''/* Always 2 columns for budget grid to perfectly match 75% zoom look at 100% zoom */
.budget-grid {
  grid-template-columns: 1fr 1fr !important;
}
@media (max-width: 768px) {
  .budget-grid {
    grid-template-columns: 1fr !important;
  }
}''',
    content
)

# 3. Clean up the table wrapper so it's not locked by display: block
content = re.sub(
    r'/\*\s*Fix table expanding the main content\s*\*/[\s\S]*?\.page-content.*?\}',
    r'''/* Fluid Table Wrapper (No Lock) */
.transactions-table-wrapper, .table-container, .table-responsive {
    max-width: 100% !important;
    overflow-x: auto !important;
}
.main-content {
    flex: 1 !important;
    max-width: 80% !important; /* remaining width after sidebar */
}''',
    content,
    flags=re.MULTILINE
)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("All pixel locks removed, layout is now purely fluid and fluidly proportional!")
