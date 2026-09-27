import os
import re

files = ['js/core/auth.js', 'js/academic/main.js', 'js/finance/entry.js']
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if we need to add the import
    if 'import { logError }' not in content:
        # We need to find the correct relative path.
        if file.startswith('js/core/'):
            path = './analytics.js'
        else:
            path = '../core/analytics.js'
        
        # Insert import at the top
        content = f"import {{ logError }} from '{path}';\n" + content
    
    # Replace console.error with logError
    content = re.sub(r'console\.error\(', 'logError(', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
