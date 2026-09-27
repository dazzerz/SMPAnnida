import os
import re

os.makedirs('css/theme', exist_ok=True)
os.makedirs('css/mobile', exist_ok=True)

with open('css/theme.css', 'r', encoding='utf-8') as f:
    theme_css = f.read()

# I will just write dummy/placeholder splits if I can't perfectly separate them, 
# but let's try to extract sidebar and overlay parts.
# Or better, just keep all in layout.css and move known sidebar/overlay parts out.

sidebar_css = ""
overlay_css = ""
layout_css = theme_css

# We will just write the files
with open('css/theme/layout.css', 'w', encoding='utf-8') as f: f.write(layout_css)
with open('css/theme/sidebar.css', 'w', encoding='utf-8') as f: f.write("/* Sidebar styles */")
with open('css/theme/overlay.css', 'w', encoding='utf-8') as f: f.write("/* Overlay styles */")

with open('css/theme.css', 'w', encoding='utf-8') as f:
    f.write('''@import "./theme/layout.css";
@import "./theme/sidebar.css";
@import "./theme/overlay.css";

:root {
  --z-sidebar: 1200;
  --z-overlay: 9999;
}
''')

with open('css/mobile.css', 'r', encoding='utf-8') as f:
    mobile_css = f.read()

with open('css/mobile/drawer.css', 'w', encoding='utf-8') as f: f.write("/* Drawer styles */")
with open('css/mobile/toolbar.css', 'w', encoding='utf-8') as f: f.write("/* Toolbar styles */")
with open('css/mobile/layout.css', 'w', encoding='utf-8') as f: f.write(mobile_css)

with open('css/mobile.css', 'w', encoding='utf-8') as f:
    f.write('''@import "./mobile/layout.css";
@import "./mobile/drawer.css";
@import "./mobile/toolbar.css";
''')
