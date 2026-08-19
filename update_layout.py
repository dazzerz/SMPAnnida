import re

with open('js/core/layout.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add toggle button next to close button
content = content.replace(
    '<button class="sidebar-close-btn"',
    '<button class="sidebar-mini-toggle" id="sidebar-mini-toggle" aria-label="Toggle Sidebar"><i class="ph ph-caret-left"></i></button>\n      <button class="sidebar-close-btn"'
)

# 2. Wrap texts in nav-items with <span class="nav-text"> and add data-tooltip
content = re.sub(
    r'<a href="([^"]+)" class="([^"]+)"(?:\s+data-target="[^"]+")?\s*>.*?<i class="([^"]+)"><\/i>\s*([^<]+)\s*<\/a>',
    lambda m: f'<a href="{m.group(1)}" class="{m.group(2)}" ' + 
              (f'data-target="{re.search(r"data-target=\"([^\"]+)\"", m.group(0)).group(1)}" ' if 'data-target' in m.group(0) else '') +
              f'data-tooltip="{m.group(4).strip()}">\n              <i class="{m.group(3)}"></i> <span class="nav-text">{m.group(4).strip()}</span>\n            </a>',
    content,
    flags=re.DOTALL
)

# 3. Wrap logout text
content = content.replace(
    '<i class="ph ph-sign-out"></i> Keluar',
    '<i class="ph ph-sign-out"></i> <span class="logout-text">Keluar</span>'
)

# 4. Add initialization logic at the end of injectSidebar function
init_logic = '''
    // Mini Sidebar Toggle Logic
    const toggleBtn = document.getElementById('sidebar-mini-toggle');
    const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;
    
    function applySidebarState(isCollapsed) {
        if (window.innerWidth <= 768) return; // Ignore on mobile
        if (isCollapsed) {
            container.classList.add('collapsed');
            if (toggleIcon) {
                toggleIcon.classList.remove('ph-caret-left');
                toggleIcon.classList.add('ph-caret-right');
            }
        } else {
            container.classList.remove('collapsed');
            if (toggleIcon) {
                toggleIcon.classList.remove('ph-caret-right');
                toggleIcon.classList.add('ph-caret-left');
            }
        }
    }

    // Read initial state
    const savedState = localStorage.getItem('smpannida-sidebar-state');
    // Default to collapsed as requested
    const isInitiallyCollapsed = savedState === null ? true : savedState === 'collapsed';
    applySidebarState(isInitiallyCollapsed);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const willCollapse = !container.classList.contains('collapsed');
            localStorage.setItem('smpannida-sidebar-state', willCollapse ? 'collapsed' : 'expanded');
            applySidebarState(willCollapse);
        });
    }
'''

content = content.replace(
    'window._closeSidebar = closeSidebar;\n    window._openSidebar = openSidebar;\n}',
    'window._closeSidebar = closeSidebar;\n    window._openSidebar = openSidebar;\n' + init_logic + '\n}'
)

with open('js/core/layout.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated js/core/layout.js")
