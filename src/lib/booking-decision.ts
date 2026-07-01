import Stripe from "stripe";
import {
  getBookingForDecision,
  confirmBooking,
  cancelBooking,
  type BookingForDecision,
} from "./airtable";
import { sendBookingConfirmation, sendBookingDeclined } from "./email";
import type { BookingDecision } from "./booking-token";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export interface DecisionResult {
  ok: boolean;
  bookingId: string;
  /** Final booking status after the decision, when known. */
  status?: "Confirmed" | "Declined";
  /** True when the booking was already resolved before this call (idempotent). */
  alreadyResolved?: boolean;
  notFound?: boolean;
  error?: string;
}

function toEmailInput(b: BookingForDecision) {
  return {
    bookingId: b.bookingId,
    firstName: b.firstName,
    lastName: b.lastName,
    email: b.email,
    startDate: b.startDate,
    endDate: b.endDate,
    pickupTime: b.pickupTime,
    dropoffTime: b.dropoffTime,
    totalDays: b.numberOfDays,
    bikeCount: b.numberOfBikes,
    totalPrice: b.totalPrice,
  };
}

/**
 * Accept or decline a same-day request-to-book. Captures or releases the Stripe
 * hold, syncs Airtable (booking + blocks), and emails the customer. Idempotent:
 * a booking that's no longer "Pending Payment" is returned as alreadyResolved.
 * Shared by the emailed magic links and the garage buttons.
 */
export async function resolveBookingDecision(
  bookingId: string,
  action: BookingDecision
): Promise<DecisionResult> {
  const b = await getBookingForDecision(bookingId);
  if (!b) return { ok: false, bookingId, notFound: true, error: "Booking not found" };

  if (b.status !== "Pending Payment") {
    // Already accepted (Confirmed/In Progress/Completed) or already released (Cancelled).
    const resolvedStatus = b.status === "Cancelled" ? "Declined" : "Confirmed";
    return { ok: true, bookingId, alreadyResolved: true, status: resolvedStatus };
  }

  const pi = b.paymentIntentId
    ? await stripe.paymentIntents.retrieve(b.paymentIntentId).catch(() => null)
    : null;

  if (action === "accept") {
    if (pi?.status === "requires_capture") {
      await stripe.paymentIntents.capture(pi.id);
    } else if (pi && pi.status !== "succeeded") {
      // Hold already released/expired — can't take money, so we can't confirm.
      return {
        ok: false,
        bookingId,
        error: `Payment hold is ${pi.status}; cannot capture. Ask the customer to rebook.`,
      };
    }
    await confirmBooking(bookingId);
    try {
      await sendBookingConfirmation(toEmailInput(b));
    } catch (err) {
      console.error("Accept: confirmation email failed:", err);
    }
    return { ok: true, bookingId, status: "Confirmed" };
  }

  // Decline / auto-release: release the hold (or refund if it was already captured).
  if (pi?.status === "requires_capture") {
    await stripe.paymentIntents.cancel(pi.id).catch((e) => console.error("PI cancel failed:", e));
  } else if (pi?.status === "succeeded") {
    await stripe.refunds.create({ payment_intent: pi.id }).catch((e) => console.error("Refund failed:", e));
  }
  await cancelBooking(bookingId);
  try {
    await sendBookingDeclined(toEmailInput(b));
  } catch (err) {
    console.error("Decline: notification email failed:", err);
  }
  return { ok: true, bookingId, status: "Declined" };
}
