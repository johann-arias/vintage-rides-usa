import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableBikeCount,
  getActivePricingRules,
  calculateRentalPrice,
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
      pricing: {
        dailyRate: pricing.dailyRate,
        totalDays: pricing.totalDays,
        totalPrice: pricing.totalPrice,
        minDays: pricing.minDays,
        meetsMinimum: pricing.totalDays >= pricing.minDays,
      },
    });
  } catch (err) {
    console.error("Availability check failed:", err);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
