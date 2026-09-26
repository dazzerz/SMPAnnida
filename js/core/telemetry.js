/**
 * telemetry.js - Real User Monitoring (RUM) & Service Worker Registration
 */

export function trackEvent(category, action, label) {
  // Simple event tracker hook for analytics / logs
  try {
    if (window.gtag) {
      window.gtag('event', action, { event_category: category, event_label: label });
    }
  } catch (e) {}
}
