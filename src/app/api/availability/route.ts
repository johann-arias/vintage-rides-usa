import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableBikeCount,
  getActivePricingRules,
  calculateRentalPrice,
} from "@/lib/airtable";
import { isSameDay, isPast, todayInRapidCity } from "@/lib/booking-window";
import { logAvailabilitySearch, type SearchOutcome } from "@/lib/availability-log";

/** Whole days between two YYYY-MM-DD strings (noon anchor avoids DST slips). */
function daysBetween(fromYmd: string, toYmd: string): number {
  const a = new Date(`${fromYmd}T12:00:00Z`).getTime();
  const b = new Date(`${toYmd}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

const NO_STORE = { "cache-control": "no-store, no-cache, must-revalidate" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const bikes = parseInt(searchParams.get("bikes") ?? "1", 10);
  // The page now opens on a suggested date range and prices it straight away.
  // That check is ours, not the visitor's, so it stays out of the search log:
  // that table answers "what are they actually trying to book", and filling it
  // with our own default would drown the real demand signal.
  const suggested = searchParams.get("suggested") === "1";

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400, headers: NO_STORE });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400, headers: NO_STORE });
  }

  if (end < start) {
    return NextResponse.json({ error: "endDate cannot be before startDate" }, { status: 400, headers: NO_STORE });
  }

  // Past pickup dates are never bookable.
  if (isPast(startDate)) {
    if (!suggested) void logAvailabilitySearch({
      startDate,
      endDate,
      days: Math.max(daysBetween(startDate, endDate), 1),
      bikes,
      leadTimeDays: daysBetween(todayInRapidCity(), startDate),
      outcome: "past_date",
      availableCount: 0,
    });
    return NextResponse.json(
      {
        availableCount: 0,
        requested: bikes,
        canBook: false,
        outOfSeason: false,
        requestToBook: false,
        pastDate: true,
        pricing: null,
      },
      { headers: NO_STORE }
    );
  }

  try {
    const [availableCount, pricingRules] = await Promise.all([
      getAvailableBikeCount(startDate, endDate),
      getActivePricingRules(),
    ]);

    const pricing = calculateRentalPrice(startDate, endDate, bikes, pricingRules);

    // Not awaited: the visitor's answer never waits on our bookkeeping.
    const outcome: SearchOutcome =
      availableCount < bikes
        ? "sold_out"
        : pricing.totalDays < pricing.minDays
        ? "below_min_days"
        : "available";
    if (!suggested) void logAvailabilitySearch({
      startDate,
      endDate,
      days: pricing.totalDays,
      bikes,
      leadTimeDays: daysBetween(todayInRapidCity(), startDate),
      outcome,
      availableCount,
      dailyRate: pricing.dailyRate,
      totalPrice: pricing.totalPrice,
      season: pricing.seasonName,
    });

    return NextResponse.json(
      {
        availableCount,
        requested: bikes,
        canBook: availableCount >= bikes,
        outOfSeason: false,
        // Same-day = request-to-book (card authorized, captured on team confirm).
        requestToBook: isSameDay(startDate),
        pricing: {
          dailyRate: pricing.dailyRate,
          totalDays: pricing.totalDays,
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          totalPrice: pricing.totalPrice,
          minDays: pricing.minDays,
          seasonName: pricing.seasonName,
        },
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("Availability check failed:", err);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500, headers: NO_STORE }
    );
  }
}
