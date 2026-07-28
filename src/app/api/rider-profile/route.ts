import { NextRequest, NextResponse } from "next/server";
import { verifyProfileToken } from "@/lib/booking-token";
import { getRiderProfileBooking, saveRiderProfile } from "@/lib/rider-profile";

export const dynamic = "force-dynamic";

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
