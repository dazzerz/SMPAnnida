import re

js_path = 'js/core/layout.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Find the end of injectSidebar block
# Assuming the end of injectSidebar has:
#   // Focus shortcut
#   document.addEventListener(...)
# }

# Let's just find export function injectSidebar(containerId) { and inject logic right before the closing brace of the function, or better, immediately after container.innerHTML = ...
# Actually, the most robust way is to just find the end of the container.innerHTML = \...\; statement.

# The template literal ends with \;
# Then there is setupAccordion();, highlightActiveMenu();, etc.
# We can inject our role logic after container.innerHTML = ...; or at the very end of injectSidebar function.

end_of_inject_sidebar = '''// Check window size on load
    if (window.innerWidth < 769) {
        document.body.classList.remove('sidebar-mini');
    }
}'''

role_logic = '''
    // ============================================
    // RBAC: Dynamic Sidebar & Read-Only Constraints
    // ============================================
    const userRole = sessionStorage.getItem('user_role');
    
    // Hide modules based on role
    if (userRole === 'teacher') {
        const financeGroup = document.getElementById('nav-group-finance');
        if (financeGroup) financeGroup.style.display = 'none';
    } else if (userRole === 'finance') {
        const academicGroup = document.getElementById('nav-group-academic');
        if (academicGroup) academicGroup.style.display = 'none';
    } else if (userRole === 'calon_siswa') {
        const mainGroup = document.getElementById('nav-group-main');
        const academicGroup = document.getElementById('nav-group-academic');
        const financeGroup = document.getElementById('nav-group-finance');
        if (mainGroup) mainGroup.style.display = 'none';
        if (academicGroup) academicGroup.style.display = 'none';
        if (financeGroup) financeGroup.style.display = 'none';
    }

    // Apply Read-Only restrictions for Pembina
    if (userRole === 'pembina' && !document.getElementById('pembina-style')) {
        const style = document.createElement('style');
        style.id = 'pembina-style';
        style.innerHTML = 
            .role-pembina button:not(.sidebar-mini-toggle):not(.sidebar-close-btn):not(.sidebar-logout-btn):not(.accordion-toggle), 
            .role-pembina input[type="submit"], 
            .role-pembina .action-btn, 
            .role-pembina [class*="btn-add"], 
            .role-pembina [class*="btn-edit"], 
            .role-pembina [class*="btn-delete"] { display: none !important; }
            .role-pembina form input, .role-pembina form select, .role-pembina form textarea { pointer-events: none; opacity: 0.8; }
        ;
        document.head.appendChild(style);
        document.body.classList.add('role-pembina');
    }
}'''

js = js.replace(end_of_inject_sidebar, role_logic)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated layout.js")
