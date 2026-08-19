import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the emoji with img
html = html.replace('<div class="login-logo">🏫</div>', '<img src="1.png" alt="Logo Annida" class="login-logo">')

# Modify the .login-logo CSS
# The existing CSS probably has font-size: 3rem, etc.
# .login-logo { font-size: 3rem; margin-bottom: 0.5rem; }
# Let's use regex to replace it
html = re.sub(
    r'\.login-logo\s*\{[^\}]+\}',
    '.login-logo { height: 90px; width: auto; margin-bottom: 1rem; display: block; margin-left: auto; margin-right: auto; object-fit: contain; }',
    html
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update js/core/layout.js
with open('js/core/layout.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace(
    '<div class="sidebar-logo-icon"><i class="ph ph-graduation-cap"></i></div>',
    '<div class="sidebar-logo-icon"><img src="1.png" alt="Logo Annida"></div>'
)

with open('js/core/layout.js', 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Update css/style.css
with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

old_logo_css = '''
.sidebar-logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}'''

new_logo_css = '''
.sidebar-logo-icon {
  width: 32px;
  height: 32px;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.sidebar-logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}'''

# Since we might have different indentation or spacing, let's use regex to find and replace .sidebar-logo-icon block
def replace_sidebar_logo(m):
    return new_logo_css.strip()

css = re.sub(r'\.sidebar-logo-icon\s*\{[^}]+\}', replace_sidebar_logo, css, count=1)

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Logo updated successfully.")
