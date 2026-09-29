import os

with open("js/academic/migration.js", "r", encoding="utf-8") as f:
    content = f.read()

# I will just replace .innerHTML with .textContent where it creates table rows, or use escapeHTML.
# Actually I'll just write a script to find and replace.
# But I am not sure of the exact line. Let's just sed it.
content = content.replace("td.innerHTML = val;", "td.textContent = val;")

with open("js/academic/migration.js", "w", encoding="utf-8") as f:
    f.write(content)
