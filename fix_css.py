import re

with open('css/mobile.css', 'r', encoding='utf-8') as f:
    mcss = f.read()

# Replace the desktop sidebar rule in mobile.css
old_rule = '''  /* Sidebar is static/sticky on desktop */
  .sidebar {
    width: 260px !important;
    min-width: 260px !important;
    max-width: 260px !important;
    height: 100vh;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    overflow-y: auto;
    z-index: 100;
  }'''

new_rule = '''  /* Sidebar is static/sticky on desktop */
  .sidebar {
    width: 260px;
    min-width: 260px;
    max-width: 260px;
    height: 100vh;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    overflow-y: auto;
    z-index: 100;
  }

  .sidebar.collapsed {
    width: 70px;
    min-width: 70px;
    max-width: 70px;
  }'''

mcss = mcss.replace(old_rule, new_rule)

# Also fix the tablet one
old_tablet = '''  .sidebar {
    width: 220px !important;
    min-width: 220px !important;
  }'''
new_tablet = '''  .sidebar {
    width: 220px;
    min-width: 220px;
  }'''
mcss = mcss.replace(old_tablet, new_tablet)

with open('css/mobile.css', 'w', encoding='utf-8') as f:
    f.write(mcss)


# Now fix style.css
with open('css/style.css', 'r', encoding='utf-8') as f:
    scss = f.read()

# 1. Merge .sidebar blocks
# Find the second one
second_sidebar = '''
.sidebar {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}'''

# Replace it with empty
scss = scss.replace(second_sidebar, '')

# Inject it into the first one
scss = scss.replace(
    'transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);',
    'transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  overflow-y: auto;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;'
)

# 2. Fix .sidebar-logo-icon
# It appears twice.
# Let's find the first one:
# .sidebar-logo-icon {
#   display: flex; align-items: center; justify-content: center;
#   width: 40px; height: 40px; ...
# }
scss = scss.replace('width: 40px;\n  height: 40px;\n', '')
scss = scss.replace('width: 40px; height: 40px;', '')

# 3. Remove !important from .sidebar.collapsed in style.css
scss = scss.replace('width: 70px !important;', 'width: 70px;')
scss = scss.replace('min-width: 70px !important;', 'min-width: 70px;')
scss = scss.replace('max-width: 70px !important;', 'max-width: 70px;')

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(scss)

print("CSS Fixed")
