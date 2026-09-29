import os

with open(".gitignore", "r", encoding="utf-8") as f:
    content = f.read()

if "!docs/**/*.md" not in content:
    content = content.replace("!PRD.md", "!PRD.md\n!docs/**/*.md\n!docs/*.md")

with open(".gitignore", "w", encoding="utf-8") as f:
    f.write(content)
