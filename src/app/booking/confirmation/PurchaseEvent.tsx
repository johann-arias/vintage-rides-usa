"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

/**
 * Reports the sale to GA4 from the confirmation page.
 *
 * The payment itself completes on Stripe's domain, so no browser event can be
 * fired at the moment money moves; this page, which only loads after a
 * successful checkout, is the closest honest place. Meta gets the same sale
 * server-side through the Conversions API, which is more robust but needs a
 * secret we do not have for GA4.
 *
 * Fired once per booking, guarded in localStorage: a customer who reloads the
 * page, or comes back to it from their email, must not be counted twice. That
 * matters more than usual here because the number feeds an ad optimiser.
 *
 * Same-day requests are excluded on purpose. Their card is authorized, not
 * captured, and the team can still decline: reporting revenue that may be
 * released within hours would teach the optimiser to buy the wrong clicks.
 */
export default function PurchaseEvent({
  bookingId,
  value,
  days,
  bikes,
  pending,
}: {
  bookingId: string;
  value: number;
  days: number;
  bikes: number;
  pending: boolean;
}) {
  useEffect(() => {
    if (pending || !bookingId || value <= 0) return;
    const key = `vr-purchase-reported:${bookingId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // Private mode or storage disabled: better one possible duplicate than
      // no revenue reported at all.
    }
    trackPurchase({ transactionId: bookingId, value, days, bikes });
  }, [bookingId, value, days, bikes, pending]);

  return null;
}
