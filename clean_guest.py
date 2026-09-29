import os
import re

files_to_clean = {
    'js/academic/authState.js': [
        (r'^\s*get isGuest\(\).*$', '')
    ],
    'js/academic/main.js': [
        (r'localStorage\.removeItem\(\'isGuest\'\);', ''),
        (r'sessionStorage\.removeItem\(\'guest_mode_active\'\);', '')
    ],
    'js/core/auth.js': [
        (r'localStorage\.removeItem\(\'isGuest\'\);', ''),
        (r'sessionStorage\.removeItem\(\'guest_mode_active\'\);', ''),
        (r'sessionStorage\.removeItem\(\'guest_stats\'\);', '')
    ],
    'js/academic/teacher-attendance.js': [
        (r'\} else if \(authState\.isGuest\) \{.*?\} else \{', '} else {', re.DOTALL),
        (r'if \(!authState\.isGuest\) \{', ''),
        (r'\}\s*// Not checked in', '// Not checked in', re.DOTALL), # Be careful with brace removal here
    ],
    'js/finance/app.js': [
        (r'localStorage\.removeItem\(\'isGuest\'\);', ''),
        (r'sessionStorage\.removeItem\(\'guest_mode_active\'\);', ''),
        (r'sessionStorage\.removeItem\(\'guest_stats\'\);', '')
    ]
}

for file_path, replacements in files_to_clean.items():
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pattern, repl, *flags in replacements:
        if flags:
            content = re.sub(pattern, repl, content, flags=flags[0])
        else:
            content = re.sub(pattern, repl, content, flags=re.MULTILINE)
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done cleaning guest remnants")
