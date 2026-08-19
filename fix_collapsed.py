import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace the entire COLLAPSIBLE MINI SIDEBAR section
start_marker = "/* =========================================================================\n   COLLAPSIBLE MINI SIDEBAR\n========================================================================= */"
end_marker = "/* Invisible pointer bridge for tooltip */"

start_idx = css.find(start_marker)

if start_idx != -1:
    old_section = css[start_idx:]
    
    new_section = '''/* =========================================================================
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
  min-width: 70px;
  max-width: 70px;
  padding: 1.5rem 0; /* Remove horizontal padding so items can be 100% wide */
}

/* Hide Elements when Collapsed */
.sidebar.collapsed .sidebar-brand,
.sidebar.collapsed .sidebar-search-wrapper,
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
  display: none !important;
}

/* 1. Accordion Toggle Completely Removed */
.sidebar.collapsed .accordion-toggle {
  display: none !important;
}
.sidebar.collapsed .nav-group {
  margin-bottom: 0 !important;
}
.sidebar.collapsed .nav-group-content {
  display: block !important;
  height: auto !important;
  grid-template-rows: auto !important;
  overflow: visible !important;
}
.sidebar.collapsed .nav-group-inner {
  display: block !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 2. Header and Dividers */
.sidebar.collapsed .sidebar-header {
  flex-direction: column !important;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 1rem;
}
.sidebar.collapsed .sidebar-logo-icon {
  margin: 0 !important;
}

/* 3. Icon Centering & Spacing */
.sidebar.collapsed .nav-item {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  padding: 0.75rem 0 !important;
  margin-bottom: 0.2rem !important;
  border-radius: 0 !important;
  border-left: none !important; /* Optionally move border to left edge of sidebar */
}
.sidebar.collapsed .nav-item.active {
  border-left: 3px solid var(--primary) !important;
}
.sidebar.collapsed .nav-icon {
  font-size: 1.25rem !important;
  margin: 0 !important;
}

/* 4. User Widget & Logout */
.sidebar.collapsed .sidebar-bottom-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0 !important;
  border-top: 1px solid rgba(255,255,255,0.05);
  margin-top: auto;
  gap: 1rem;
}
.sidebar.collapsed .user-widget {
  padding: 0 !important;
  justify-content: center !important;
  margin: 0 !important;
}
.sidebar.collapsed .user-avatar {
  margin: 0 !important;
}
.sidebar.collapsed .sidebar-logout-btn {
  padding: 0.5rem 0 !important;
  justify-content: center !important;
  width: 100% !important;
}
.sidebar.collapsed .sidebar-logout-btn i {
  margin: 0 !important;
  font-size: 1.25rem;
}

/* CSS Tooltip for Nav Items in Collapsed State */
.sidebar.collapsed .nav-item {
  position: relative;
}
.sidebar.collapsed .nav-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(100% + 5px);
  top: 50%;
  transform: translateY(-50%);
  background: rgba(17, 24, 39, 0.95);
  color: #fff;
  padding: 0.5rem 0.75rem;
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
    css = css[:start_idx] + new_section
    
    with open('css/style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Done")
else:
    print("Marker not found")
