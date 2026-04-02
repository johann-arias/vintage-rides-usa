import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import base, { Tables } from "@/lib/airtable";
import { nanoid } from "nanoid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Called by Stripe webhook after successful payment.
 * Creates the booking record in Airtable and blocks the bikes.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata ?? {};

  const bookingId = `VR-USA-${nanoid(8).toUpperCase()}`;
  const bikeCount = parseInt(meta.bikeCount ?? "1", 10);

  // 1. Create booking record
  await base(Tables.Bookings).create([
    {
      fields: {
        "Booking ID": bookingId,
        Status: "Confirmed",
        "First Name": meta.firstName ?? "",
        "Last Name": meta.lastName ?? "",
        Email: meta.email ?? "",
        Phone: meta.phone ?? "",
        "Start Date": meta.startDate,
        "End Date": meta.endDate,
        "Number of Days": parseInt(meta.totalDays ?? "0", 10),
        "Number of Bikes": bikeCount,
        "Total Price (USD)": (session.amount_total ?? 0) / 100,
        "Stripe Session ID": session.id,
        "Rider License Number": meta.licenseNumber ?? "",
        "Emergency Contact Name": meta.emergencyContact ?? "",
        "Special Requests": meta.specialRequests ?? "",
      },
    },
  ]);

  // 2. Create availability blocks — one per bike
  const blockRecords = Array.from({ length: bikeCount }, (_, i) => ({
    fields: {
      "Block ID": `${bookingId}-BIKE${i + 1}`,
      Type: "RENTAL",
      "Booking ID": bookingId,
      "Start Date": meta.startDate,
      "End Date": meta.endDate,
      Status: "Confirmed",
      Notes: `Auto-created from Stripe session ${session.id}`,
    },
  }));

  await base(Tables.Blocks).create(blockRecords);

  return NextResponse.json({ received: true, bookingId });
}
