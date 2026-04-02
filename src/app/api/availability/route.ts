import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableBikeCount,
  getActivePricingRules,
  calculateRentalPrice,
  isPeriodInRentalSeason,
} from "@/lib/airtable";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const bikes = parseInt(searchParams.get("bikes") ?? "1", 10);

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
  }

  // Bikes are in Arizona Oct–Apr only
  if (!isPeriodInRentalSeason(startDate, endDate)) {
    return NextResponse.json({
      availableCount: 0,
      requested: bikes,
      canBook: false,
      outOfSeason: true,
      pricing: null,
    });
  }

  try {
    const [availableCount, pricingRules] = await Promise.all([
      getAvailableBikeCount(startDate, endDate),
      getActivePricingRules(),
    ]);

    const pricing = calculateRentalPrice(startDate, endDate, bikes, pricingRules);

    return NextResponse.json({
      availableCount,
      requested: bikes,
      canBook: availableCount >= bikes,
      outOfSeason: false,
      pricing: {
        dailyRate: pricing.dailyRate,
        totalDays: pricing.totalDays,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        totalPrice: pricing.totalPrice,
      },
    });
  } catch (err) {
    console.error("Availability check failed:", err);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
