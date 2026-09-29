import os

with open("js/core/auth.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("""    } else {
      showAuthMessage('Akses hanya untuk guru.', 'error');
    }""", "")

with open("js/core/auth.js", "w", encoding="utf-8") as f:
    f.write(content)
