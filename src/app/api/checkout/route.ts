import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAvailableBikeCount, getActivePricingRules, calculateRentalPrice } from "@/lib/airtable";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    startDate,
    endDate,
    bikeCount,
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    emergencyContact,
    specialRequests,
  } = body;

  if (!startDate || !endDate || !bikeCount || !firstName || !lastName || !email || !licenseNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Re-check availability server-side (never trust client)
  const available = await getAvailableBikeCount(startDate, endDate);
  if (available < bikeCount) {
    return NextResponse.json(
      { error: `Only ${available} bike(s) available for those dates.` },
      { status: 409 }
    );
  }

  const rules = await getActivePricingRules();
  const pricing = calculateRentalPrice(startDate, endDate, bikeCount, rules);

  if (pricing.totalDays < pricing.minDays) {
    return NextResponse.json(
      { error: `Minimum rental is ${pricing.minDays} days.` },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(pricing.totalPrice * 100),
          product_data: {
            name: `Royal Enfield Himalayan 450 Rental × ${bikeCount}`,
            description: `${startDate} → ${endDate} · ${pricing.totalDays} days · $${pricing.dailyRate}/bike/day`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      startDate,
      endDate,
      bikeCount: String(bikeCount),
      firstName,
      lastName,
      email,
      phone: phone ?? "",
      licenseNumber,
      emergencyContact: emergencyContact ?? "",
      specialRequests: specialRequests ?? "",
      totalDays: String(pricing.totalDays),
      dailyRate: String(pricing.dailyRate),
    },
    success_url: `${baseUrl}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/book`,
  });

  return NextResponse.json({ url: session.url });
}
