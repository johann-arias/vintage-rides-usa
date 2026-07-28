import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { getAvailableBikeCount, getActivePricingRules, calculateRentalPrice } from "@/lib/airtable";
import { isSameDay, isPast } from "@/lib/booking-window";
import { sendMetaInitiateCheckout, shouldReportPreCheckout } from "@/lib/meta-capi";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    startDate,
    endDate,
    bikeCount,
    pickupTime,
    dropoffTime,
    icEventId,
  } = body;

  // Nothing personal is asked for before payment any more. Stripe Checkout
  // collects name, email and phone itself, on a form that autofills and that
  // people already trust, and the rest of the rider profile is filled in after
  // the money has moved. So the only thing this route needs is the rental.
  if (!startDate || !endDate || !bikeCount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Past pickup dates are never bookable.
  if (isPast(startDate)) {
    return NextResponse.json({ error: "That pickup date is in the past." }, { status: 400 });
  }

  // Same-day = request-to-book: authorize the card now, capture only once the
  // team confirms a bike. Advance bookings are charged immediately as usual.
  const requestToBook = isSameDay(startDate);

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

  const originHeader = req.headers.get("origin");
  const baseUrl =
    originHeader ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // Meta Conversions API: the browser signals only exist here (the purchase
  // itself completes on Stripe's domain, then a webhook). Capture them now and
  // carry them through Stripe metadata so the Purchase can be attributed.
  // metaEventId is generated once so a webhook retry can't double-count.
  const metaEventId = randomUUID();
  const fbp = req.cookies.get("_fbp")?.value ?? "";
  const fbc = req.cookies.get("_fbc")?.value ?? "";
  const clientIp = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  // Stripe caps metadata values at 500 chars; user agents are well under, but clamp anyway.
  const clientUserAgent = (req.headers.get("user-agent") ?? "").slice(0, 480);

  const session = await stripe.checkout.sessions.create({
    // No payment_method_types on purpose. Pinning it to ["card"] overrode the
    // account's payment method configuration, where Klarna, Affirm, Cash App,
    // Amazon Pay and Link are all switched on: they were paid for and enabled
    // in the Dashboard but could never appear at checkout. Omitting the field
    // hands the choice back to that configuration, and Stripe shows each
    // customer only what fits their country, currency and device. Methods that
    // cannot do separate auth-then-capture are filtered out by Stripe itself on
    // same-day requests, so the request-to-book flow stays intact.
    mode: "payment",
    // Abandoned cart recovery: when the session expires unpaid, Stripe keeps a
    // recovery link alive for 30 days. It never mails it out on its own (that
    // needs promotional consent we do not collect), so the link is what our own
    // /api/cron/abandoned-cart uses, and it surfaces in the garage for manual
    // follow-up.
    after_expiration: { recovery: { enabled: true, allow_promotion_codes: false } },
    // Same-day: authorize only (manual capture). Advance: default (auto capture).
    ...(requestToBook
      ? { payment_intent_data: { capture_method: "manual" as const } }
      : {}),
    // Checkout always asks for an email and the cardholder name. The phone is
    // opt-in and we want it: a same-day request has to be confirmable by call,
    // and it is the only way to reach someone whose email bounces.
    phone_number_collection: { enabled: true },
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
      pickupTime: pickupTime ?? "",
      dropoffTime: dropoffTime ?? "",
      // Identity is no longer carried here: the webhook reads it from
      // session.customer_details, which is what Stripe actually verified.
      totalDays: String(pricing.totalDays),
      dailyRate: String(pricing.dailyRate),
      requestToBook: requestToBook ? "1" : "",
      metaEventId,
      fbp,
      fbc,
      clientIp,
      clientUserAgent,
      eventSourceUrl: `${baseUrl}/book`,
    },
    success_url: `${baseUrl}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}${
      requestToBook ? "&pending=1" : ""
    }`,
    cancel_url: `${baseUrl}/book`,
  });

  // Mid-funnel signal for the ad optimizer, the server half of a pair: the
  // browser fired the same InitiateCheckout a moment ago on the pay click.
  // `icEventId` comes from that call, so Meta deduplicates the two into one
  // event and takes the union of their parameters. Falling back to a derived id
  // when the browser could not send one costs the dedup but never the event.
  //
  // Match quality here is cookie-only: we no longer know the name or email at
  // this point, Stripe collects them on the next screen. The Purchase event,
  // which is the one that matters for attribution, is sent from the webhook
  // with the verified email, phone and name.
  const reportPreCheckout = shouldReportPreCheckout();
  console.log("[checkout] InitiateCheckout gate:", reportPreCheckout);
  if (reportPreCheckout) {
    await sendMetaInitiateCheckout({
      eventId: typeof icEventId === "string" && icEventId ? icEventId : `${metaEventId}-ic`,
      value: pricing.totalPrice,
      currency: "USD",
      fbp: fbp || undefined,
      fbc: fbc || undefined,
      clientIpAddress: clientIp || undefined,
      clientUserAgent: clientUserAgent || undefined,
      eventSourceUrl: `${baseUrl}/book`,
      numItems: bikeCount,
    });
  }

  return NextResponse.json({ url: session.url });
}
