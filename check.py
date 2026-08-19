import re

with open('css/mobile.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove desktop overrides of sidebar width in mobile.css so style.css can handle it!
# Wait, let's just make the .sidebar.collapsed rules in style.css use !important
pass
