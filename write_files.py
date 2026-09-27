import os

docs_layout = '''# Layout API

## Functions

### `injectSidebar()`
Injects the sidebar navigation into the DOM dynamically. It handles fetching the partials, rendering the navigation rail, and initializing mobile overlay components.

### `setSidebar(open)`
A centralized wrapper to open or close the mobile sidebar.
- `open` (boolean): `true` to open the sidebar, `false` to close it.

## Global Helpers
The layout module exposes some global functions on the `window` object for easier access from inline event handlers or decoupled scripts:
- `window._openSidebar()`: Directly opens the mobile drawer.
- `window._closeSidebar()`: Directly closes the mobile drawer.
- `window._setSidebar(open)`: Global alias for `setSidebar`.

## Event Listeners (Auto-Close)
The layout automatically cleans up and closes the drawer in several scenarios:
- **`visibilitychange`**: When the user switches tabs or backgrounds the app.
- **`resize`**: When the screen is resized (e.g., rotating the device).
- **`orientationchange`**: On device rotation.
- **`keydown` (Escape)**: When the ESC key is pressed.

## Example Usage
```js
// Open drawer from any module
window._setSidebar(true);

// Close drawer
window._setSidebar(false);
```
'''

test_layout = '''
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setSidebar, closeMobileSidebar, openMobileSidebar } from './layout.js';

describe('Sidebar Drawer API', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="sidebar" class="sidebar"></div>
            <div id="sidebar-overlay" class="sidebar-overlay"></div>
        `;
        window._closeSidebar = closeMobileSidebar;
        window._openSidebar = openMobileSidebar;
        window._setSidebar = setSidebar;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('setSidebar(true) opens the drawer and disables scrolling', () => {
        setSidebar(true);
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        expect(sidebar?.classList.contains('open')).toBe(true);
        expect(overlay?.classList.contains('show')).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('setSidebar(false) closes the drawer and restores scrolling', () => {
        setSidebar(true);
        setSidebar(false);
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        expect(sidebar?.classList.contains('open')).toBe(false);
        expect(overlay?.classList.contains('show')).toBe(false);
        expect(document.body.style.overflow).toBe('');
    });
});
'''

os.makedirs('docs', exist_ok=True)
with open('docs/layout.md', 'w') as f:
    f.write(docs_layout)

with open('js/core/layout.test.js', 'w') as f:
    f.write(test_layout)
