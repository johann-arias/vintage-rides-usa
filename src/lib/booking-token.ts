import { createHmac, timingSafeEqual } from "crypto";

// Signed tokens for the one-click Accept / Decline links we email to the team.
// A token authorizes exactly one (bookingId, action) pair, so an Accept link
// can't be replayed as a Decline and vice-versa, and neither can be forged
// without the server secret.

export type BookingDecision = "accept" | "decline";

function secret(): string {
  // Dedicated secret if set, otherwise fall back to other high-entropy secrets
  // already present in the environment so the feature works before env rollout.
  return (
    process.env.BOOKING_ACTION_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "vr-usa-booking-fallback-secret"
  );
}

export function signBookingToken(bookingId: string, action: BookingDecision): string {
  return createHmac("sha256", secret())
    .update(`${bookingId}:${action}`)
    .digest("hex");
}

/**
 * Token for the rider profile link we email to the customer. Separate namespace
 * from the team's accept/decline tokens, so a profile link can never be replayed
 * as a booking decision.
 */
export function signProfileToken(bookingId: string): string {
  return createHmac("sha256", secret()).update(`${bookingId}:profile`).digest("hex");
}

export function verifyProfileToken(bookingId: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const a = Buffer.from(signProfileToken(bookingId), "utf8");
  const b = Buffer.from(token, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyBookingToken(
  bookingId: string,
  action: BookingDecision,
  token: string | undefined | null
): boolean {
  if (!token) return false;
  const expected = signBookingToken(bookingId, action);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(token, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
