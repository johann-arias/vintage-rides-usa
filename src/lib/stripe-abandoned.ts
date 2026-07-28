// Checkout sessions that were created but never paid.
//
// This is the missing half of the funnel: GA4 tells us who clicked pay, Stripe
// tells us who reached the card form and walked away. Together they separate
// "the booking form lost them" from "the payment page lost them".
//
// Careful with same-day request-to-book: those sessions are authorized, not
// captured, so `payment_status` stays "unpaid" even though the customer did
// everything right. Only `status` distinguishes them — a completed session is
// never an abandon, whatever its payment status says.
//
// Second trap, learned the hard way: a customer who adjusts their cart leaves a
// dead session behind. Jordan Walters opened a 2-day checkout at 20:05, backed
// out, and paid for 1 day at 20:23. The 2-day session is "abandoned" by Stripe's
// definition and was showing up as $291 lost. Any session whose email has a
// completed session elsewhere is a REBOOK, not an abandon: never counted as
// lost, never emailed a recovery link.

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Wait this long after a cart is started before nudging: they may still be
 * typing. Tunable without a deploy via ABANDONED_CART_DELAY_HOURS.
 */
export const RECOVERY_DELAY_HOURS = Number(process.env.ABANDONED_CART_DELAY_HOURS ?? 3);
/** Past this age a cart is cold; a nudge reads as creepy rather than helpful. */
export const RECOVERY_MAX_AGE_DAYS = 7;
/** Never send a second recovery email to the same address inside this window. */
export const RECOVERY_COOLDOWN_DAYS = 7;
/** Stripe metadata key holding the ISO timestamp of the recovery email we sent. */
export const RECOVERY_SENT_KEY = "recoveryEmailSentAt";

export interface AbandonedSession {
  id: string;
  createdAt: string;
  /** "open" = still recoverable, "expired" = the window closed. */
  state: "open" | "expired";
  email: string | null;
  name: string | null;
  amount: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  bikes: number | null;
  /** Stripe's recovery link, present once the session has expired. */
  recoveryUrl: string | null;
  /** True once we have emailed this cart. */
  recoveryEmailSentAt: string | null;
}

export interface AbandonedStats {
  connected: boolean;
  error?: string;
  rangeDays: number;
  created: number;
  completed: number;
  abandoned: number;
  /** Dead sessions whose customer booked anyway. Not a loss, not a follow-up. */
  recovered: number;
  /** Abandoned as a share of sessions created, 0..1. */
  abandonRate: number;
  /** Money left on the table by the abandoned ones. */
  lostValue: number;
  sessions: AbandonedSession[];
}

function empty(rangeDays: number, error?: string): AbandonedStats {
  return {
    connected: false,
    error,
    rangeDays,
    created: 0,
    completed: 0,
    abandoned: 0,
    recovered: 0,
    abandonRate: 0,
    lostValue: 0,
    sessions: [],
  };
}

function normalizeEmail(s: Stripe.Checkout.Session): string | null {
  const raw =
    s.customer_email ??
    s.customer_details?.email ??
    (s.metadata?.email as string | undefined) ??
    null;
  const clean = raw?.trim().toLowerCase();
  return clean ? clean : null;
}

/** Placeholder addresses from our own probes. Never email these. */
function isProbeEmail(email: string): boolean {
  return /@(example\.(com|org|net)|test\.com)$/.test(email);
}

async function listSessions(rangeDays: number): Promise<Stripe.Checkout.Session[]> {
  const since = Math.floor((Date.now() - rangeDays * 86_400_000) / 1000);
  const all: Stripe.Checkout.Session[] = [];
  for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
    all.push(s);
    if (all.length >= 500) break; // sanity stop, far above real volume
  }
  return all;
}

/** Lowercased emails that completed a checkout in the window, whatever the session. */
function emailsThatBooked(all: Stripe.Checkout.Session[]): Set<string> {
  const booked = new Set<string>();
  for (const s of all) {
    if (s.status !== "complete") continue;
    const email = normalizeEmail(s);
    if (email) booked.add(email);
  }
  return booked;
}

function toAbandonedSession(s: Stripe.Checkout.Session): AbandonedSession {
  const m = (s.metadata ?? {}) as Record<string, string>;
  const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
  return {
    id: s.id,
    createdAt: new Date(s.created * 1000).toISOString(),
    state: s.status === "open" ? "open" : "expired",
    email: normalizeEmail(s),
    name: name || null,
    amount: s.amount_total != null ? s.amount_total / 100 : null,
    currency: (s.currency ?? "usd").toUpperCase(),
    startDate: m.startDate ?? null,
    endDate: m.endDate ?? null,
    bikes: m.bikeCount ? Number(m.bikeCount) : null,
    recoveryUrl: s.after_expiration?.recovery?.url ?? null,
    recoveryEmailSentAt: m[RECOVERY_SENT_KEY] ?? null,
  };
}

export async function getAbandonedCheckouts(rangeDays = 30): Promise<AbandonedStats> {
  if (!process.env.STRIPE_SECRET_KEY) return empty(rangeDays, "STRIPE_SECRET_KEY is not set.");

  try {
    const all = await listSessions(rangeDays);
    const booked = emailsThatBooked(all);

    const completed = all.filter((s) => s.status === "complete");
    const dead = all.filter((s) => s.status === "open" || s.status === "expired");
    // Split the dead sessions: the customer either came back and paid (a rebook,
    // invisible to Stripe because it is a different session id) or never did.
    const rebooked = dead.filter((s) => {
      const email = normalizeEmail(s);
      return email != null && booked.has(email);
    });
    const lost = dead.filter((s) => {
      const email = normalizeEmail(s);
      return email == null || !booked.has(email);
    });

    const sessions: AbandonedSession[] = lost
      .sort((a, b) => b.created - a.created)
      .map(toAbandonedSession);

    return {
      connected: true,
      rangeDays,
      created: all.length,
      completed: completed.length,
      abandoned: lost.length,
      recovered: rebooked.length,
      abandonRate: all.length > 0 ? lost.length / all.length : 0,
      lostValue: sessions.reduce((sum, s) => sum + (s.amount ?? 0), 0),
      sessions: sessions.slice(0, 15),
    };
  } catch (e) {
    return empty(rangeDays, e instanceof Error ? e.message : "Unknown Stripe error.");
  }
}

export interface RecoverableCart {
  sessionId: string;
  email: string;
  firstName: string;
  lastName: string;
  startDate: string;
  endDate: string;
  bikes: number;
  totalDays: number;
  amount: number;
  /** Where to send them back: the live checkout, or Stripe's recovery link. */
  url: string;
}

export interface RecoveryScan {
  connected: boolean;
  error?: string;
  scanned: number;
  eligible: RecoverableCart[];
  /** Why each skipped session was skipped, for the cron response. */
  skipped: Record<string, number>;
}

/**
 * Carts worth one nudge. Deliberately conservative: every exclusion here is a
 * customer we would otherwise annoy.
 *
 * Timing note: we email while the session is still OPEN, using its live
 * checkout url, because that is a single click back into a prefilled payment
 * page. Stripe's `after_expiration.recovery.url` only exists once the session
 * has expired (24h), which is far too late to be useful, so it is the fallback
 * rather than the plan.
 */
export async function findRecoverableCarts(): Promise<RecoveryScan> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { connected: false, error: "STRIPE_SECRET_KEY is not set.", scanned: 0, eligible: [], skipped: {} };
  }

  try {
    const all = await listSessions(RECOVERY_MAX_AGE_DAYS);
    const booked = emailsThatBooked(all);
    const now = Date.now();
    const minAgeMs = RECOVERY_DELAY_HOURS * 3_600_000;
    const cooldownMs = RECOVERY_COOLDOWN_DAYS * 86_400_000;
    const today = new Date().toISOString().slice(0, 10);

    // Addresses we have already nudged recently, from any session. Without this
    // a customer who abandons twice gets two emails.
    const recentlyEmailed = new Set<string>();
    for (const s of all) {
      const sentAt = (s.metadata ?? {})[RECOVERY_SENT_KEY];
      if (!sentAt) continue;
      const email = normalizeEmail(s);
      if (email && now - new Date(sentAt).getTime() < cooldownMs) recentlyEmailed.add(email);
    }

    const skipped: Record<string, number> = {};
    const skip = (reason: string) => {
      skipped[reason] = (skipped[reason] ?? 0) + 1;
    };

    const eligible: RecoverableCart[] = [];
    const claimedThisRun = new Set<string>();

    for (const s of all.sort((a, b) => b.created - a.created)) {
      if (s.status === "complete") continue; // paid, not a cart
      // FOOTGUN: ABANDONED_CART_ALLOW_TEST exists so this path can be proven
      // end to end against Stripe TEST data. Never set it in production, or
      // sandbox carts start emailing people.
      if (!s.livemode && process.env.ABANDONED_CART_ALLOW_TEST !== "1") {
        skip("test_mode");
        continue;
      }
      const email = normalizeEmail(s);
      if (!email) {
        skip("no_email");
        continue;
      }
      if (isProbeEmail(email)) {
        skip("probe_email");
        continue;
      }
      const m = (s.metadata ?? {}) as Record<string, string>;
      if (m[RECOVERY_SENT_KEY]) {
        skip("already_emailed");
        continue;
      }
      if (booked.has(email)) {
        skip("booked_elsewhere");
        continue;
      }
      if (recentlyEmailed.has(email) || claimedThisRun.has(email)) {
        skip("cooldown");
        continue;
      }
      if (m.requestToBook === "1") {
        // Same-day request: the pickup is today, a nudge hours later is noise.
        skip("same_day_request");
        continue;
      }
      if (now - s.created * 1000 < minAgeMs) {
        skip("too_fresh");
        continue;
      }
      if (m.startDate && m.startDate < today) {
        skip("trip_date_passed");
        continue;
      }
      // Open sessions carry a live checkout url; expired ones only have the
      // recovery link, and only if it has been generated.
      const url = s.status === "open" ? s.url : (s.after_expiration?.recovery?.url ?? null);
      if (!url) {
        skip("no_link");
        continue;
      }

      claimedThisRun.add(email);
      eligible.push({
        sessionId: s.id,
        email,
        firstName: m.firstName ?? "",
        lastName: m.lastName ?? "",
        startDate: m.startDate ?? "",
        endDate: m.endDate ?? "",
        bikes: m.bikeCount ? Number(m.bikeCount) : 1,
        totalDays: m.totalDays ? Number(m.totalDays) : 1,
        amount: s.amount_total != null ? s.amount_total / 100 : 0,
        url,
      });
    }

    return { connected: true, scanned: all.length, eligible, skipped };
  } catch (e) {
    return {
      connected: false,
      error: e instanceof Error ? e.message : "Unknown Stripe error.",
      scanned: 0,
      eligible: [],
      skipped: {},
    };
  }
}

/**
 * Stamps the session so it can never be emailed twice. Stripe allows metadata
 * updates on open AND expired sessions, which makes the session itself the
 * dedup ledger — no extra table, and the lock lives exactly as long as the
 * thing it guards.
 */
export async function markRecoveryEmailSent(sessionId: string): Promise<void> {
  const current = await stripe.checkout.sessions.retrieve(sessionId);
  await stripe.checkout.sessions.update(sessionId, {
    metadata: { ...(current.metadata ?? {}), [RECOVERY_SENT_KEY]: new Date().toISOString() },
  });
}
