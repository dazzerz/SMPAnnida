/**
 * telemetry.js - Real User Monitoring (RUM) & Service Worker Registration
 */

// 1. Register Service Worker for PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        // SW registered successfully
      })
      .catch((err) => {
        // Silently handle registration error in unsupported environments
      });
  });
}


export function trackEvent(category, action, label) {
  // Simple event tracker hook for analytics / logs
  try {
    if (window.gtag) {
      window.gtag('event', action, { event_category: category, event_label: label });
    }
  } catch (e) {}
}
