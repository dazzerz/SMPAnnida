import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '.sidebar.collapsed {\n  width: 70px;\n}',
    '.sidebar.collapsed {\n  width: 70px !important;\n  min-width: 70px !important;\n  max-width: 70px !important;\n}'
)

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)

with open('css/mobile.css', 'r', encoding='utf-8') as f:
    mobile_content = f.read()

if '.sidebar-mini-toggle' not in mobile_content:
    mobile_css_add = '''
/* Override collapsible sidebar for mobile */
@media (max-width: 768px) {
  .sidebar-mini-toggle {
    display: none !important;
  }
  .sidebar.collapsed {
    width: 280px !important; /* Force back to overlay width */
    min-width: 0 !important;
    max-width: 100vw !important;
  }
  .sidebar.collapsed .sidebar-brand,
  .sidebar.collapsed .sidebar-search-wrapper,
  .sidebar.collapsed .accordion-toggle span,
  .sidebar.collapsed .accordion-icon,
  .sidebar.collapsed .nav-text,
  .sidebar.collapsed .user-info,
  .sidebar.collapsed .logout-text,
  .sidebar.collapsed .nav-group-title::before {
    opacity: 1 !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    pointer-events: auto !important;
  }
}
'''
    with open('css/mobile.css', 'w', encoding='utf-8') as f:
        f.write(mobile_content + "\n" + mobile_css_add)

print("Updated style.css and mobile.css")
