import crypto from "crypto";

/**
 * Meta Conversions API: server-side conversion reporting.
 *
 * Two events are sent from the server:
 *
 *  - Purchase, when money actually moves. Payment completes on Stripe's hosted
 *    checkout, so the browser pixel never sees it. The reliable "money
 *    confirmed" moments are the Stripe webhook (advance bookings) and the
 *    accept path of a same-day request-to-book.
 *  - InitiateCheckout, when a Stripe session is created, i.e. the visitor
 *    really is leaving /book to pay.
 *
 * Note that InitiateCheckout is ALSO fired by the browser one step earlier, on
 * the Continue click in /book. That overlap is deliberate and load-bearing:
 * the live ad sets optimise on INITIATED_CHECKOUT, and the browser click is
 * the only thing that actually produces it. This server-side one has never
 * fired for a real visitor (Stripe: zero checkout sessions from the campaign),
 * so in practice the two never collide today. The browser also fires AddToCart
 * with the same payload, which is the name that tells the truth about that
 * step; once the ad sets optimise on it, the browser InitiateCheckout goes away
 * and this becomes the only source of the event.
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

/**
 * Same gate for events fired before Stripe knows anything, where there is no
 * event.livemode to read. The Stripe key tells us which world we are in: the
 * dev branch runs on sk_test, production on sk_live.
 */
export function shouldReportPreCheckout(): boolean {
  const live = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live");
  return live || Boolean(TEST_EVENT_CODE);
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

/** Assemble the hashed + raw identifiers Meta uses to match a person. */
function buildUserData(input: MetaPurchaseInput): Record<string, string | string[]> {
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
  return userData;
}

/**
 * POST one event to the dataset. Resolves to true when Meta accepted it. Never
 * throws and never rejects, because callers sit on payment paths that must not
 * fail on our analytics.
 */
async function sendMetaEvent(
  eventName: "Purchase" | "InitiateCheckout",
  input: MetaPurchaseInput
): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    // Inert until the token is configured. Not an error.
    return false;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: buildUserData(input),
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
    const body = await res.text();
    if (!res.ok) {
      console.error(`Meta CAPI rejected ${eventName}:`, res.status, body);
      return false;
    }
    // Logged on success too: without this, a silently dropped event is
    // indistinguishable from one that was never attempted.
    console.log(`Meta CAPI ${eventName} accepted:`, body);
    return true;
  } catch (err) {
    console.error(`Meta CAPI ${eventName} failed:`, err);
    return false;
  }
}

/** Money confirmed. Fired from the Stripe webhook and the same-day accept path. */
export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<boolean> {
  return sendMetaEvent("Purchase", input);
}

/**
 * Visitor is leaving /book for Stripe's checkout. Intent, not revenue: the
 * value carried is the quoted rental total, which Meta uses for value-based
 * optimization, but no money has moved yet.
 *
 * Pass an event_id distinct from the Purchase one. Meta deduplicates on the
 * (event_name, event_id) pair, so reusing the id is technically safe, but
 * keeping them separate makes the two events legible in Events Manager.
 */
export async function sendMetaInitiateCheckout(
  input: MetaPurchaseInput
): Promise<boolean> {
  return sendMetaEvent("InitiateCheckout", input);
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
