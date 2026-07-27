import { NextRequest, NextResponse } from "next/server";
import { purgeOldSearches, RETENTION_DAYS } from "@/lib/availability-log";

export const dynamic = "force-dynamic";

/**
 * Keeps the availability search log a rolling window instead of a table that
 * grows forever inside the shared ops base. Runs daily on a Vercel cron;
 * authenticated with CRON_SECRET like the other one.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await purgeOldSearches();
    return NextResponse.json({ ok: true, deleted, retentionDays: RETENTION_DAYS });
  } catch (err) {
    console.error("Search log purge failed:", err);
    return NextResponse.json({ ok: false, error: "Purge failed" }, { status: 500 });
  }
}
