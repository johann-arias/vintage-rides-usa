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

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

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
}

export interface AbandonedStats {
  connected: boolean;
  error?: string;
  rangeDays: number;
  created: number;
  completed: number;
  abandoned: number;
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
    abandonRate: 0,
    lostValue: 0,
    sessions: [],
  };
}

export async function getAbandonedCheckouts(rangeDays = 30): Promise<AbandonedStats> {
  if (!process.env.STRIPE_SECRET_KEY) return empty(rangeDays, "STRIPE_SECRET_KEY is not set.");

  try {
    const since = Math.floor((Date.now() - rangeDays * 86_400_000) / 1000);
    const all: Stripe.Checkout.Session[] = [];
    for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
      all.push(s);
      if (all.length >= 500) break; // sanity stop, far above real volume
    }

    const completed = all.filter((s) => s.status === "complete");
    const abandoned = all.filter((s) => s.status === "open" || s.status === "expired");

    const sessions: AbandonedSession[] = abandoned
      .sort((a, b) => b.created - a.created)
      .map((s) => {
        const m = (s.metadata ?? {}) as Record<string, string>;
        const first = m.firstName ?? "";
        const last = m.lastName ?? "";
        const name = `${first} ${last}`.trim();
        return {
          id: s.id,
          createdAt: new Date(s.created * 1000).toISOString(),
          state: s.status === "open" ? "open" : "expired",
          email: s.customer_email ?? s.customer_details?.email ?? m.email ?? null,
          name: name || null,
          amount: s.amount_total != null ? s.amount_total / 100 : null,
          currency: (s.currency ?? "usd").toUpperCase(),
          startDate: m.startDate ?? null,
          endDate: m.endDate ?? null,
          bikes: m.bikeCount ? Number(m.bikeCount) : null,
          recoveryUrl: s.after_expiration?.recovery?.url ?? null,
        };
      });

    return {
      connected: true,
      rangeDays,
      created: all.length,
      completed: completed.length,
      abandoned: abandoned.length,
      abandonRate: all.length > 0 ? abandoned.length / all.length : 0,
      lostValue: sessions.reduce((sum, s) => sum + (s.amount ?? 0), 0),
      sessions: sessions.slice(0, 15),
    };
  } catch (e) {
    return empty(rangeDays, e instanceof Error ? e.message : "Unknown Stripe error.");
  }
}
