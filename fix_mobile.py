import re

with open('css/mobile.css', 'r', encoding='utf-8') as f:
    css = f.read()

# I will replace the .sidebar.collapsed reset block in mobile.css
old_block = '''  .sidebar.collapsed .sidebar-brand,
  .sidebar.collapsed .sidebar-search-wrapper,
  .sidebar.collapsed .accordion-toggle span,
  .sidebar.collapsed .accordion-icon,
  .sidebar.collapsed .nav-text,
  .sidebar.collapsed .user-info,
  .sidebar.collapsed .logout-text,
  .sidebar.collapsed .nav-group-title::before {
    opacity: 1 !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    pointer-events: auto !important;
  }'''

new_block = '''  /* Completely disable collapsed mode styling on mobile */
  .sidebar.collapsed {
    padding: 1.5rem 0.75rem !important;
  }
  .sidebar.collapsed .sidebar-brand,
  .sidebar.collapsed .sidebar-search-wrapper,
  .sidebar.collapsed .nav-text,
  .sidebar.collapsed .user-info,
  .sidebar.collapsed .logout-text,
  .sidebar.collapsed .nav-group-title::before {
    opacity: 1 !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    pointer-events: auto !important;
    display: flex !important;
  }
  
  .sidebar.collapsed .sidebar-search-wrapper,
  .sidebar.collapsed .user-info {
    display: block !important;
  }
  
  .sidebar.collapsed .accordion-toggle {
    display: flex !important;
  }
  .sidebar.collapsed .nav-group {
    margin-bottom: 0.75rem !important;
  }
  .sidebar.collapsed .nav-group-content {
    /* Reset to grid transition behavior */
    display: grid !important;
    overflow: hidden !important;
  }
  .sidebar.collapsed .sidebar-header {
    flex-direction: row !important;
    border-bottom: none !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
  .sidebar.collapsed .nav-item {
    justify-content: flex-start !important;
    padding: 0.65rem 1rem !important;
    border-radius: 8px !important;
  }
  .sidebar.collapsed .nav-icon {
    font-size: 1.2rem !important;
    margin-right: 0.75rem !important;
  }
  .sidebar.collapsed .sidebar-bottom-section {
    flex-direction: column !important;
    align-items: stretch !important;
    border-top: none !important;
    padding: 0 !important;
  }
  .sidebar.collapsed .user-widget {
    justify-content: flex-start !important;
  }
  .sidebar.collapsed .user-avatar {
    margin-right: 0.75rem !important;
  }
  .sidebar.collapsed .sidebar-logout-btn {
    justify-content: flex-start !important;
  }
  .sidebar.collapsed .sidebar-logout-btn i {
    margin-right: 0.5rem !important;
  }'''

css = css.replace(old_block, new_block)

with open('css/mobile.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated mobile reset")
