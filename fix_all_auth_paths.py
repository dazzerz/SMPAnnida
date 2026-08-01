import os
import re
import glob

base_dir = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida"

def get_root_relative_path(filepath):
    rel_path = os.path.relpath(filepath, base_dir)
    depth = rel_path.count(os.sep)
    if depth == 0:
        return 'index.html'
    else:
        return '../' * depth + 'index.html'

html_files = glob.glob(os.path.join(base_dir, '**', '*.html'), recursive=True)
js_files = glob.glob(os.path.join(base_dir, '**', '*.js'), recursive=True)

for filepath in html_files + js_files:
    if 'node_modules' in filepath or '.git' in filepath:
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    root_index = get_root_relative_path(filepath)
    
    # Replace 'login.html', './login.html', '../login.html' with correct root_index
    # We must be careful not to replace it if it's already correct, but since we are looking for 'login.html' it's safe.
    
    # Pattern: match quotes followed by any number of ../ or ./ then login.html
    pattern = r'([\'"])((?:\.\./|\./)*)login\.html([\'"])'
    
    new_content = re.sub(pattern, rf'\1{root_index}\3', content)
    
    # For pages/ppdb/index.html, let's fix the login/logout button to behave correctly
    if 'pages\\ppdb\\index.html' in filepath or 'pages/ppdb/index.html' in filepath:
        # PPDB currently has `<a href="pages/login.html" class="btn btn-outline">Login</a>`
        # Let's replace it with a dynamic button that checks localStorage or just links to root index.
        new_content = re.sub(
            r'<a href=[\'"](?:pages/)?login\.html[\'"] class=[\'"]btn btn-outline[\'"]>Login</a>',
            f'<a href="{root_index}" class="btn btn-outline" id="ppdb-login-btn">Login / Logout</a>',
            new_content
        )
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

print("All broken login.html links fixed!")
