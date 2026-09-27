# Layout API

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
