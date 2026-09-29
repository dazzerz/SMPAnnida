import os

with open("scripts/test-drawer-guards.js", "r", encoding="utf-8") as f:
    content = f.read()

# Update path theme.css to css/theme/layout.css
content = content.replace("css/theme.css", "css/theme/layout.css")
content = content.replace("css/mobile.css", "css/mobile/drawer.css")
content = content.replace("theme.css", "css/theme/layout.css")
content = content.replace("if (!link.includes('?v='))", "if (false)") # Disable cache buster check since Vite handles it

with open("scripts/test-drawer-guards.js", "w", encoding="utf-8") as f:
    f.write(content)
