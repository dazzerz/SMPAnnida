import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Modify .sidebar
content = re.sub(
    r'\.sidebar\s*\{[^}]*\}',
    lambda m: m.group(0).replace('width: 20%;', 'width: 260px;').replace('min-width: 250px;', 'min-width: auto;').replace('z-index: 100;', 'z-index: 100;\n  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);'),
    content,
    count=1
)

# Append collapsed styles
collapsed_css = '''
/* =========================================================================
   COLLAPSIBLE MINI SIDEBAR
========================================================================= */

/* Toggle Button Styling */
.sidebar-mini-toggle {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.sidebar-mini-toggle:hover {
  color: var(--primary);
  background: rgba(255, 255, 255, 0.05);
}

/* Collapsed State Width */
.sidebar.collapsed {
  width: 70px;
}

/* Hide Elements when Collapsed */
.sidebar.collapsed .sidebar-brand,
.sidebar.collapsed .sidebar-search-wrapper,
.sidebar.collapsed .accordion-toggle span,
.sidebar.collapsed .accordion-icon,
.sidebar.collapsed .nav-text,
.sidebar.collapsed .user-info,
.sidebar.collapsed .logout-text,
.sidebar.collapsed .nav-group-title::before {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
  padding: 0;
  margin: 0;
  border: none;
}

/* Specific overrides for flex/grid containers to prevent layout breaking when items are hidden */
.sidebar.collapsed .sidebar-header {
  justify-content: center !important;
}
.sidebar.collapsed .accordion-toggle {
  padding: 0;
  justify-content: center;
  margin: 0.5rem 0;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding-left: 0 !important;
}
.sidebar.collapsed .sidebar-bottom-section {
  align-items: center;
}
.sidebar.collapsed .user-widget {
  justify-content: center;
}
.sidebar.collapsed .sidebar-logout-btn {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}
.sidebar.collapsed .sidebar-logo-icon {
  margin: 0;
}

/* Smooth Transitions for Elements */
.sidebar-brand,
.sidebar-search-wrapper,
.accordion-toggle span,
.accordion-icon,
.nav-text,
.user-info,
.logout-text {
  transition: opacity 0.2s ease, width 0.3s ease;
}

/* Active State Dot Indicator when Collapsed */
.sidebar.collapsed .accordion-group.active .accordion-toggle::before {
  content: "";
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 50%;
  opacity: 1;
}
.sidebar.collapsed .accordion-toggle {
  position: relative;
  min-height: 20px;
}

/* CSS Tooltip for Nav Items in Collapsed State */
.sidebar.collapsed .nav-item {
  position: relative;
}
.sidebar.collapsed .nav-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(10px);
  background: rgba(17, 24, 39, 0.9);
  color: #fff;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 1;
  z-index: 9999;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

/* Invisible pointer bridge for tooltip */
.sidebar.collapsed .nav-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 100%;
  width: 10px;
  height: 100%;
  background: transparent;
}
'''

content += "\n" + collapsed_css

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated css/style.css")
