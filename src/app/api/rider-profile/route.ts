import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { signProfileToken, verifyProfileToken } from "@/lib/booking-token";
import {
  getBookingIdBySessionId,
  getRiderProfileBooking,
  saveRiderProfile,
} from "@/lib/rider-profile";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Hands the confirmation page its booking and profile token from the Stripe
 * session id it was redirected with, so the form can be filled in place rather
 * than behind a click.
 *
 * The session id alone is not treated as proof: we ask Stripe whether that
 * session exists and completed before handing out anything. And because the
 * webhook and the browser redirect race each other, a booking that is not in
 * Airtable yet answers 202 rather than 404, which is the page's cue to wait a
 * beat and ask again.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }
  // Same-day requests are authorized rather than captured, so "unpaid" with a
  // completed session is a legitimate booking, not an unpaid one.
  if (session.status !== "complete") {
    return NextResponse.json({ error: "This checkout is not complete." }, { status: 404 });
  }

  const bookingId = await getBookingIdBySessionId(sessionId);
  if (!bookingId) {
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  const booking = await getRiderProfileBooking(bookingId);
  if (!booking) {
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  return NextResponse.json({ booking, token: signProfileToken(bookingId) });
}

/**
 * Saves the rider profile a customer fills in after paying. Authenticated by
 * the HMAC in their emailed link, not by a session: they never created an
 * account and we are not going to make them.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.bookingId !== "string" || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing booking or token." }, { status: 400 });
  }

  if (!verifyProfileToken(body.bookingId, body.token)) {
    return NextResponse.json({ error: "This link is not valid." }, { status: 403 });
  }

  const booking = await getRiderProfileBooking(body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status === "Cancelled") {
    return NextResponse.json({ error: "This booking was cancelled." }, { status: 409 });
  }

  try {
    await saveRiderProfile(booking.recordId, {
      phone: body.phone,
      emergencyContact: body.emergencyContact,
      licenseNumber: body.licenseNumber,
      helmetSize: body.helmetSize,
      ridingExperience: body.ridingExperience,
      specialRequests: body.specialRequests,
    });
  } catch (err) {
    console.error("Rider profile save failed:", err);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
