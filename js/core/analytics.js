export async function initAnalytics() {
  const provider = import.meta.env.VITE_ANALYTICS_PROVIDER;
  if (provider === 'sentry') {
    const Sentry = await import('@sentry/browser');
    Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
  } else if (provider === 'logrocket') {
    const LogRocket = await import('logrocket');
    LogRocket.init(import.meta.env.VITE_LOGROCKET_ID);
  }
}

export async function logError(error) {
  const provider = import.meta.env.VITE_ANALYTICS_PROVIDER;
  if (provider === 'sentry') {
    const Sentry = await import('@sentry/browser');
    Sentry.captureException(error);
  } else if (provider === 'logrocket') {
    const LogRocket = await import('logrocket');
    LogRocket.error(error);
  } else {
    console.error(error);
  }
}
