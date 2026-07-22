import crypto from "crypto";

/**
 * Meta Conversions API: server-side Purchase reporting.
 *
 * Why server-side: payment completes on Stripe's hosted checkout, so the
 * browser pixel never sees the purchase. The only reliable "money confirmed"
 * moments are the Stripe webhook (advance bookings) and the accept path of a
 * same-day request-to-book. Both call sendMetaPurchase.
 *
 * The browser pixel lives in GTM (container GTM-T22FLRVR) and only handles
 * PageView + the _fbp cookie. Do NOT add a second pixel in layout.tsx.
 *
 * Everything here is best-effort: a Meta outage must never fail a booking.
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";
const DATASET_ID = process.env.META_DATASET_ID ?? "1821633055487489";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
/** Set temporarily (Events Manager → Test events) to validate without polluting live data. */
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

export interface MetaPurchaseInput {
  /** Stable dedup key. Generated at checkout so a webhook retry can't double-count. */
  eventId: string;
  /** Unix seconds. Defaults to now. */
  eventTime?: number;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  /** Meta browser cookies, captured at checkout and carried in Stripe metadata. */
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
  numItems?: number;
}

/**
 * Should a booking be reported to Meta at all?
 *
 * Live Stripe bookings always are. Test-mode bookings (dev branch) only when a
 * test event code is set, which routes them to the Test Events stream instead
 * of polluting the live optimization signal.
 *
 * FOOTGUN: META_TEST_EVENT_CODE must NEVER be set on production. Meta sends any
 * event carrying a test code to the test stream only, so a stale code in prod
 * silently stops real purchases from being recorded.
 */
export function shouldReportPurchase(livemode: boolean): boolean {
  return livemode || Boolean(TEST_EVENT_CODE);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Meta expects lowercase, trimmed, then SHA-256 hex. */
function hashNormalized(value?: string): string | undefined {
  const v = value?.trim().toLowerCase();
  return v ? sha256(v) : undefined;
}

/**
 * Meta expects digits only, country code included, no "+" and no separators.
 * A bare 10-digit NANP number (area code starts 2-9) gets a "1" prefix; other
 * shapes are passed through so international numbers aren't mangled.
 */
function hashPhone(phone?: string): string | undefined {
  const digits = phone?.replace(/\D/g, "");
  if (!digits) return undefined;
  const e164 = /^[2-9]\d{9}$/.test(digits) ? `1${digits}` : digits;
  return sha256(e164);
}

/**
 * Fire a Purchase event. Resolves to true when Meta accepted it. Never throws
 * and never rejects, because callers are payment paths that must not fail on
 * our analytics.
 */
export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    // Inert until the token is configured. Not an error.
    return false;
  }

  const userData: Record<string, string | string[]> = {};
  const em = hashNormalized(input.email);
  const ph = hashPhone(input.phone);
  const fn = hashNormalized(input.firstName);
  const ln = hashNormalized(input.lastName);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: (input.currency ?? "USD").toUpperCase(),
          value: Number(input.value.toFixed(2)),
          content_type: "product",
          content_ids: ["himalayan-450-rental"],
          num_items: input.numItems ?? 1,
        },
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${DATASET_ID}/events?access_token=${encodeURIComponent(
        ACCESS_TOKEN
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error("Meta CAPI rejected Purchase:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Meta CAPI Purchase failed:", err);
    return false;
  }
}

/** Stripe metadata keys carrying the browser-side Meta signals through checkout. */
export interface MetaCheckoutSignals {
  metaEventId: string;
  fbp: string;
  fbc: string;
  clientIp: string;
  clientUserAgent: string;
  eventSourceUrl: string;
}

/** Pull the signals back out of Stripe session metadata (all optional). */
export function readMetaSignals(
  meta: Record<string, string> | null | undefined
): Partial<MetaCheckoutSignals> {
  const m = meta ?? {};
  return {
    metaEventId: m.metaEventId || undefined,
    fbp: m.fbp || undefined,
    fbc: m.fbc || undefined,
    clientIp: m.clientIp || undefined,
    clientUserAgent: m.clientUserAgent || undefined,
    eventSourceUrl: m.eventSourceUrl || undefined,
  };
}
