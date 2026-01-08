type AnyWindow = typeof window & {
  plausible?: (event: string, options?: Record<string, any>) => void;
  gtag?: (...args: any[]) => void;
};

const analyticsScriptUrl = import.meta.env.VITE_ANALYTICS_SCRIPT_URL as string | undefined;
const analyticsDomain = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined;
const errorReportEndpoint = import.meta.env.VITE_ERROR_REPORT_ENDPOINT as string | undefined;

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function sendErrorPayload(payload: Record<string, any>) {
  if (!errorReportEndpoint) return;

  const body = safeStringify(payload);
  if (!body) return;

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(errorReportEndpoint, blob);
      return;
    }
  } catch {
    // ignore
  }

  try {
    fetch(errorReportEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function initTelemetry() {
  initAnalytics();
  initErrorReporting();
}

export function initAnalytics() {
  if (!analyticsScriptUrl) return;
  if (typeof document === 'undefined') return;

  const existing = document.querySelector('script[data-streame-analytics="true"]');
  if (existing) return;

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = analyticsScriptUrl;
  script.dataset.streameAnalytics = 'true';

  if (analyticsDomain) {
    script.setAttribute('data-domain', analyticsDomain);
  }

  document.head.appendChild(script);
}

export function trackPageView(pathname: string) {
  const w = window as AnyWindow;
  const url = `${window.location.origin}${pathname}`;

  if (typeof w.plausible === 'function') {
    w.plausible('pageview', { u: url });
    return;
  }

  if (typeof w.gtag === 'function') {
    w.gtag('event', 'page_view', { page_location: url, page_path: pathname });
  }
}

export function reportError(error: unknown, context?: Record<string, any>) {
  const payload = {
    type: 'client_error',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    context: context ?? undefined,
    ts: new Date().toISOString(),
  };

  sendErrorPayload(payload);
}

function initErrorReporting() {
  if (!errorReportEndpoint) return;
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const err = (event as any)?.error;
    reportError(err ?? event.message, {
      source: 'window.error',
      filename: (event as any)?.filename,
      lineno: (event as any)?.lineno,
      colno: (event as any)?.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError((event as any)?.reason ?? 'Unhandled promise rejection', {
      source: 'window.unhandledrejection',
    });
  });
}
