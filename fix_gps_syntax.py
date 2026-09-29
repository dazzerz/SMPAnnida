import os

with open("js/academic/teacher-attendance.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("},,", "},")

with open("js/academic/teacher-attendance.js", "w", encoding="utf-8") as f:
    f.write(content)
