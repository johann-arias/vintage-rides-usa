import { NextRequest, NextResponse } from "next/server";
import { getExpiredPendingRequests } from "@/lib/airtable";
import { resolveBookingDecision } from "@/lib/booking-decision";
import { SAME_DAY_REQUEST_EXPIRY_HOURS } from "@/lib/booking-window";

export const dynamic = "force-dynamic";

/**
 * Releases same-day request-to-book holds nobody acted on. Cancels the Stripe
 * authorization, frees the bikes, and emails the customer. Runs on a Vercel
 * cron; authenticated with CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await getExpiredPendingRequests(SAME_DAY_REQUEST_EXPIRY_HOURS);
  const released: string[] = [];
  const failed: string[] = [];

  for (const b of expired) {
    try {
      const result = await resolveBookingDecision(b.bookingId, "decline");
      if (result.ok) released.push(b.bookingId);
      else failed.push(b.bookingId);
    } catch (err) {
      console.error(`Auto-release failed for ${b.bookingId}:`, err);
      failed.push(b.bookingId);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: expired.length,
    released,
    failed,
    olderThanHours: SAME_DAY_REQUEST_EXPIRY_HOURS,
  });
}
