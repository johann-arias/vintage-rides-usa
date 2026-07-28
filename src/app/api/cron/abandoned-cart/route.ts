import { NextRequest, NextResponse } from "next/server";
import {
  findRecoverableCarts,
  markRecoveryEmailSent,
  RECOVERY_DELAY_HOURS,
  RECOVERY_COOLDOWN_DAYS,
  RECOVERY_MAX_AGE_DAYS,
} from "@/lib/stripe-abandoned";
import { sendAbandonedCartRecovery } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Abandoned cart recovery, run by us rather than by Stripe.
 *
 * Stripe only sends its own recovery email when the session carries a marketing
 * opt-in (`consent_collection[promotions]` + the customer ticking the box). We
 * never collect that, so nothing was ever going out. This cron closes the gap,
 * and does the one thing Stripe cannot: it checks whether the person booked
 * anyway under a different session before nudging them.
 *
 * Order matters here. The session is stamped BEFORE the send, so a crash mid-run
 * costs one missed email rather than a duplicate one landing on a customer.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scan = await findRecoverableCarts();
  if (!scan.connected) {
    return NextResponse.json({ ok: false, error: scan.error }, { status: 500 });
  }

  const sent: string[] = [];
  const failed: string[] = [];

  for (const cart of scan.eligible) {
    try {
      // Claim first: a duplicate nudge is worse than a missed one.
      await markRecoveryEmailSent(cart.sessionId);
      await sendAbandonedCartRecovery({
        email: cart.email,
        firstName: cart.firstName,
        lastName: cart.lastName,
        startDate: cart.startDate,
        endDate: cart.endDate,
        totalDays: cart.totalDays,
        bikeCount: cart.bikes,
        totalPrice: cart.amount,
        resumeUrl: cart.url,
      });
      sent.push(cart.email);
    } catch (err) {
      console.error(`Abandoned cart recovery failed for ${cart.sessionId}:`, err);
      failed.push(cart.sessionId);
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: scan.scanned,
    eligible: scan.eligible.length,
    sent,
    failed,
    skipped: scan.skipped,
    rules: {
      delayHours: RECOVERY_DELAY_HOURS,
      maxAgeDays: RECOVERY_MAX_AGE_DAYS,
      cooldownDays: RECOVERY_COOLDOWN_DAYS,
    },
  });
}
