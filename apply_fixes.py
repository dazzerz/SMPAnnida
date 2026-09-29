import json

# Update deploy.yml
with open('.github/workflows/deploy.yml', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('node-version: 18', 'node-version: 22')

with open('.github/workflows/deploy.yml', 'w', encoding='utf-8') as f:
    f.write(content)

# Update package.json
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['overrides'] = {
    "undici": "^6.19.8"
}

with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=4)
