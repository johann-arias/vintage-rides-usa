import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import base, { Tables } from "@/lib/airtable";
import {
  sendBookingConfirmation,
  sendInternalBookingNotification,
  sendBookingRequestReceived,
  sendInternalBookingRequest,
} from "@/lib/email";
import { signBookingToken } from "@/lib/booking-token";
import { sendMetaPurchase, readMetaSignals, shouldReportPurchase } from "@/lib/meta-capi";
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

  // Same-day request-to-book: card is authorized (manual capture), not charged.
  // Booking stays Pending Payment and its blocks Tentative until the team accepts.
  const requestToBook = meta.requestToBook === "1";
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? "";

  // 1. Create booking record
  await base(Tables.Bookings).create([
    {
      fields: {
        "Booking ID": bookingId,
        Status: requestToBook ? "Pending Payment" : "Confirmed",
        "First Name": meta.firstName ?? "",
        "Last Name": meta.lastName ?? "",
        Email: meta.email ?? "",
        Phone: meta.phone ?? "",
        "Start Date": meta.startDate,
        "End Date": meta.endDate,
        "Pickup Time": meta.pickupTime ?? "",
        "Drop-off Time": meta.dropoffTime ?? "",
        "Number of Days": parseInt(meta.totalDays ?? "0", 10),
        "Number of Bikes": bikeCount,
        "Total Price (USD)": (session.amount_total ?? 0) / 100,
        "Stripe Session ID": session.id,
        "Stripe Payment Intent ID": paymentIntentId,
        // Rider License Number and Emergency Contact Name stay in Airtable for
        // the team to fill at pickup: the website no longer asks for them.
        "Special Requests": meta.specialRequests ?? "",
        ...(requestToBook
          ? { "Internal Notes": "Channel: Website | Same-day request (authorized, awaiting accept)" }
          : {}),
      },
    },
  ]);

  // 2. Create availability blocks — one per bike. Tentative for same-day requests
  // (still counts against availability so the bike can't be double-sold) and
  // Confirmed for immediate bookings.
  const blockRecords = Array.from({ length: bikeCount }, (_, i) => ({
    fields: {
      "Block ID": `${bookingId}-BIKE${i + 1}`,
      Type: "RENTAL",
      "Booking ID": bookingId,
      "Start Date": meta.startDate,
      "End Date": meta.endDate,
      Status: requestToBook ? "Tentative" : "Confirmed",
      Notes: `Auto-created from Stripe session ${session.id}`,
    },
  }));

  await base(Tables.Blocks).create(blockRecords);

  // 3. Emails — non-blocking for the webhook ack.
  const totalPrice = (session.amount_total ?? 0) / 100;
  const totalDays = parseInt(meta.totalDays ?? "0", 10);
  const emailBase = {
    bookingId,
    firstName: meta.firstName ?? "",
    lastName: meta.lastName ?? "",
    email: meta.email ?? "",
    startDate: meta.startDate,
    endDate: meta.endDate,
    pickupTime: meta.pickupTime || undefined,
    dropoffTime: meta.dropoffTime || undefined,
    totalDays,
    bikeCount,
    totalPrice,
  };

  if (requestToBook) {
    // Customer: "request received, card authorized not charged".
    if (meta.email) {
      try {
        await sendBookingRequestReceived(emailBase);
      } catch (err) {
        console.error("Request-received email failed:", err);
      }
    }
    // Team: PENDING alert with one-click accept/decline (LIVE + TEST so it's testable).
    const siteBase = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.vintageridesusa.com").replace(/\/$/, "");
    const link = (action: "accept" | "decline") =>
      `${siteBase}/booking-request/${bookingId}?action=${action}&token=${signBookingToken(bookingId, action)}`;
    try {
      await sendInternalBookingRequest({
        ...emailBase,
        phone: meta.phone ?? "",
        livemode: event.livemode,
        acceptUrl: link("accept"),
        declineUrl: link("decline"),
      });
    } catch (err) {
      console.error("Internal request notification failed:", err);
    }
    return NextResponse.json({ received: true, bookingId, pending: true });
  }

  // Meta Purchase, advance bookings only, because the card is captured now.
  // Same-day requests are only authorized here; their Purchase fires from
  // resolveBookingDecision() once the team accepts and the money actually moves.
  const metaSignals = readMetaSignals(meta);
  if (shouldReportPurchase(event.livemode)) {
    await sendMetaPurchase({
      eventId: metaSignals.metaEventId ?? bookingId,
      value: totalPrice,
      currency: session.currency ?? "usd",
      email: meta.email,
      phone: meta.phone,
      firstName: meta.firstName,
      lastName: meta.lastName,
      fbp: metaSignals.fbp,
      fbc: metaSignals.fbc,
      clientIpAddress: metaSignals.clientIp,
      clientUserAgent: metaSignals.clientUserAgent,
      eventSourceUrl: metaSignals.eventSourceUrl,
      numItems: bikeCount,
    });
  }

  // Immediate booking: confirm the customer + notify the team (LIVE only).
  if (meta.email) {
    try {
      await sendBookingConfirmation(emailBase);
    } catch (err) {
      console.error("Booking confirmation email failed:", err);
    }
  }
  if (event.livemode) {
    try {
      await sendInternalBookingNotification({
        ...emailBase,
        phone: meta.phone ?? "",
        livemode: true,
      });
    } catch (err) {
      console.error("Internal booking notification failed:", err);
    }
  }

  return NextResponse.json({ received: true, bookingId });
}
