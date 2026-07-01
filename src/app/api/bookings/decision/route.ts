import { NextRequest, NextResponse } from "next/server";
import { verifyBookingToken, type BookingDecision } from "@/lib/booking-token";
import { resolveBookingDecision } from "@/lib/booking-decision";

export const dynamic = "force-dynamic";

/**
 * Accept or decline a same-day request-to-book from the emailed magic link.
 * A signed token authorizes the exact (bookingId, action) pair. This is a POST
 * so email-client link prefetching can never trigger a capture or release —
 * the action only fires on an explicit button click.
 */
export async function POST(req: NextRequest) {
  let body: { bookingId?: string; action?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const bookingId = (body.bookingId ?? "").trim();
  const action = body.action as BookingDecision;
  const token = body.token;

  if (!bookingId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json({ ok: false, error: "Missing or invalid parameters" }, { status: 400 });
  }
  if (!verifyBookingToken(bookingId, action, token)) {
    return NextResponse.json({ ok: false, error: "Invalid or expired link" }, { status: 403 });
  }

  try {
    const result = await resolveBookingDecision(bookingId, action);
    const status = result.notFound ? 404 : result.ok ? 200 : 409;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error("Booking decision failed:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
