import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableBikeCount,
  getActivePricingRules,
  calculateRentalPrice,
} from "@/lib/airtable";
import { isSameDay, isPast } from "@/lib/booking-window";

const NO_STORE = { "cache-control": "no-store, no-cache, must-revalidate" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const bikes = parseInt(searchParams.get("bikes") ?? "1", 10);

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
