import os

with open('js/academic/authState.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('get isGuest() { return false; },', '')

with open('js/academic/authState.js', 'w', encoding='utf-8') as f:
    f.write(content)
