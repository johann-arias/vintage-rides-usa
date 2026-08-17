// Ad-click identifiers, the Google half of what `_fbc` already does for Meta.
//
// Why this exists: every completed booking carries `_fbp`/`_fbc` into Stripe
// metadata, which is the only reason a Meta-attributed rental can be audited
// one by one. Google had no equivalent, so a search ad could never be proved
// or cleared at the payment level — the 24 Jul–16 Aug review could only infer
// SEA bookings from GA4 session sources.
//
// Two sources, because neither covers the other:
//
//   1. The URL. Google auto-tagging appends `gclid` (Search/Shopping), or
//      `gbraid`/`wbraid` on iOS where the click id is app-scoped. Bing uses
//      `msclkid`. These land on whichever page the ad points at — usually a
//      destination page, not /book — so capture is site-wide and stashed for
//      the rest of the visit.
//   2. The `_gcl_*` cookies the Google tag writes from that same click id.
//      They survive a page the visitor reached without the query string, e.g.
//      after a bookmark or a reload that dropped the params.
//
// Nothing here is personal data: a click id identifies an ad interaction, not
// a person, and no name, email or phone passes through this module.

export type AdClick = {
  /** Google/Bing click identifier, whichever one the ad platform supplied. */
  clickId?: string;
  /** Which parameter it came from: gclid | gbraid | wbraid | msclkid | gcl_aw | gcl_dc. */
  clickIdSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/** sessionStorage key. Session-scoped on purpose: a click id belongs to a visit. */
export const AD_CLICK_KEY = "vr_ad_click";

/** Longest value we keep. Stripe caps metadata values at 500 chars. */
const MAX_LEN = 200;

/**
 * Click id parameters in priority order. `gclid` wins when several are present
 * because it is the one Google Ads reports against; the braid parameters are
 * its iOS stand-ins and only appear when it cannot be set.
 */
const CLICK_PARAMS = ["gclid", "gbraid", "wbraid", "msclkid"] as const;

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_LEN);
  return trimmed || undefined;
}

/**
 * Pull the ad-click identifiers out of a query string. Pure, so it can be
 * tested without a browser.
 *
 * Returns null when the URL carries nothing worth keeping, which is the case
 * for the overwhelming majority of page loads.
 */
export function parseAdClick(search: string): AdClick | null {
  const params = new URLSearchParams(search);
  const found: AdClick = {};

  for (const name of CLICK_PARAMS) {
    const value = clean(params.get(name));
    if (value) {
      found.clickId = value;
      found.clickIdSource = name;
      break;
    }
  }

  found.utmSource = clean(params.get("utm_source"));
  found.utmMedium = clean(params.get("utm_medium"));
  found.utmCampaign = clean(params.get("utm_campaign"));

  const hasSomething = Object.values(found).some(Boolean);
  return hasSomething ? found : null;
}

/**
 * Read a click id back out of a `_gcl_aw` / `_gcl_dc` cookie value, which the
 * Google tag writes as `GCL.<timestamp>.<click id>`. Anything that does not
 * match that shape is ignored rather than guessed at.
 */
export function parseGclCookie(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parts = value.split(".");
  // GCL . timestamp . id  — the id itself may contain dots, so re-join the tail.
  if (parts.length < 3) return undefined;
  return clean(parts.slice(2).join("."));
}

// ── Browser side ────────────────────────────────────────────────────────────

/**
 * Capture whatever the current URL carries and keep it for the rest of the
 * visit. Called on every page load, so a rider who lands on a destination page
 * from a search ad still arrives at /book with the click id attached.
 *
 * Last paid click wins: a URL with no click id never overwrites one already
 * stored, but a fresh click id does replace an older one. That mirrors how
 * `_fbc` behaves on the Meta side, so the two are read the same way.
 */
export function captureAdClick(): void {
  if (typeof window === "undefined") return;
  try {
    const incoming = parseAdClick(window.location.search);
    if (!incoming) return;
    const stored = loadAdClick();
    // A campaign-tagged link with no click id must not wipe a real click id.
    if (stored?.clickId && !incoming.clickId) {
      window.sessionStorage.setItem(
        AD_CLICK_KEY,
        JSON.stringify({ ...incoming, clickId: stored.clickId, clickIdSource: stored.clickIdSource })
      );
      return;
    }
    window.sessionStorage.setItem(AD_CLICK_KEY, JSON.stringify(incoming));
  } catch {
    // Private mode, quota, disabled storage: attribution is never worth an error.
  }
}

/** Read back what `captureAdClick` stored, if anything. */
export function loadAdClick(): AdClick | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AD_CLICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdClick;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
