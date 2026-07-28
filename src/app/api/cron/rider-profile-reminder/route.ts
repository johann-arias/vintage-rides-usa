import { NextRequest, NextResponse } from "next/server";
import {
  findProfilesToRemind,
  markProfileReminderSent,
  riderProfileUrl,
  REMINDER_DAYS_BEFORE,
} from "@/lib/rider-profile";
import { signProfileToken } from "@/lib/booking-token";
import { sendRiderProfileReminder } from "@/lib/email";
import { todayInRapidCity } from "@/lib/booking-window";

export const dynamic = "force-dynamic";

/**
 * Nudges paid bookings whose rider details are still empty, 3 days and then 1
 * day before pickup. Runs daily; the dates are compared in Rapid City time
 * because that is where the bikes and the counter are.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.vintageridesusa.com"
  ).replace(/\/$/, "");

  try {
    const targets = await findProfilesToRemind(todayInRapidCity());
    const sent: string[] = [];
    const failed: string[] = [];

    for (const t of targets) {
      try {
        await markProfileReminderSent(t.recordId);
        await sendRiderProfileReminder({
          bookingId: t.bookingId,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          startDate: t.startDate,
          pickupTime: t.pickupTime || undefined,
          profileUrl: riderProfileUrl(t.bookingId, signProfileToken(t.bookingId), siteUrl),
          daysUntil: t.daysUntil,
        });
        sent.push(t.bookingId);
      } catch (err) {
        console.error(`Rider profile reminder failed for ${t.bookingId}:`, err);
        failed.push(t.bookingId);
      }
    }

    return NextResponse.json({
      ok: true,
      daysBefore: REMINDER_DAYS_BEFORE,
      found: targets.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error("Rider profile reminder cron failed:", err);
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
  }
}
