import os

files = ['js/academic/main.js', 'js/core/auth.js', 'js/finance/app.js']
for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace("'isGuest'", "'is_Guest'").replace("'guest_mode_active'", "'guest_mode_inactive'").replace("'guest_stats'", "'guest_statistics'")
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
