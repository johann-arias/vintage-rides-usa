// GA4 funnel instrumentation.
//
// Events are sent straight to `gtag`, which the GTM container defines on every
// page (config G-M87DWZQ2B4). Going through gtag rather than a dataLayer push
// means a new milestone ships with a deploy and needs no GTM change.
//
// Two rules, both deliberate:
//   1. No personal data ever leaves this module. Names, email, phone, licence
//      number and free-text requests stay out of every payload — only counts,
//      dates arithmetic, outcomes and prices.
//   2. Analytics never breaks the booking flow. Missing gtag, ad blocker,
//      throwing tag: all swallowed.
//
// Event params only show up in GA4 reports once registered as event-scoped
// custom dimensions (Admin -> Custom definitions): step, outcome, season,
// days, lead_time_days, bikes, missing_required, reason.

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    const payload = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    );
    window.gtag("event", name, payload);
  } catch {
    /* analytics must never break the booking flow */
  }
}

/** Whole days between two YYYY-MM-DD strings (noon anchor avoids DST slips). */
export function daysBetween(fromYmd: string, toYmd: string): number {
  const a = new Date(`${fromYmd}T12:00:00Z`).getTime();
  const b = new Date(`${toYmd}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}
