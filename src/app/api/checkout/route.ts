import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { getAvailableBikeCount, getActivePricingRules, calculateRentalPrice } from "@/lib/airtable";
import { isSameDay, isPast } from "@/lib/booking-window";
import { sendMetaInitiateCheckout, shouldReportPreCheckout } from "@/lib/meta-capi";
import { parseGclCookie, type AdClick } from "@/lib/ad-click";

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
    promoCode,
    adClick,
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

  // A discount is only ever applied when the visitor arrived with a code in the
  // link. Turning Stripe's promotion field on for everyone would put a "got a
  // code?" box in front of every customer, which sends people off to hunt for
  // one instead of paying. Stripe owns the rules: expiry, redemption limits and
  // validity are enforced by it, not by us.
  let discountId: string | null = null;
  if (typeof promoCode === "string" && promoCode.trim()) {
    try {
      const found = await stripe.promotionCodes.list({
        code: promoCode.trim().toUpperCase(),
        active: true,
        limit: 1,
      });
      discountId = found.data[0]?.id ?? null;
      if (!discountId) console.log("[checkout] unknown or inactive promo code");
    } catch (err) {
      console.error("[checkout] promo lookup failed:", err);
    }
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

  // Google's half of the same idea. `_fbc` is what makes a Meta-attributed
  // rental auditable one by one; without an equivalent, a search ad could only
  // ever be inferred from GA4 session sources — which is exactly how the SEA
  // side of the 24 Jul–16 Aug review had to be guessed at.
  //
  // The browser sends whatever it captured from the landing URL (the ads point
  // at destination pages, so the click id is long gone by /book). The `_gcl_*`
  // cookies, written by the Google tag from that same click, back it up when
  // the query string was lost. Browser value wins: it is the click that
  // actually started this visit.
  const fromBrowser: AdClick = adClick && typeof adClick === "object" ? adClick : {};
  const gclAw = parseGclCookie(req.cookies.get("_gcl_aw")?.value);
  const gclDc = parseGclCookie(req.cookies.get("_gcl_dc")?.value);
  const clip = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : "");
  const gclid = clip(fromBrowser.clickId) || gclAw || gclDc || "";
  const gclidSource =
    clip(fromBrowser.clickIdSource) || (gclAw ? "gcl_aw" : gclDc ? "gcl_dc" : "");

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
    // recovery link alive for 30 days. That link also feeds our own
    // /api/cron/abandoned-cart and the garage follow-up list.
    after_expiration: { recovery: { enabled: true, allow_promotion_codes: false } },
    // Let Stripe mail that recovery link itself. It only does so when the
    // visitor both typed an email and ticked the box, which is the whole point:
    // Stripe never hands us the address of a session that did not complete
    // (formally tested 2026-07-29, customer_details stays null through
    // expiry), so a visitor who leaves before paying is otherwise unreachable
    // for good. Over 28-30/07, 21 of 21 abandoned sessions were anonymous and
    // roughly $9.4k of cart value expired with nobody to write to.
    //
    // This covers only the subset who opt in, so it does not replace capturing
    // the address before the visitor leaves for Stripe. It is the one recovery
    // path that works without us ever seeing the address.
    consent_collection: { promotions: "auto" },
    // Same-day: authorize only (manual capture). Advance: default (auto capture).
    ...(requestToBook
      ? { payment_intent_data: { capture_method: "manual" as const } }
      : {}),
    // Checkout always asks for an email and the cardholder name. The phone is
    // opt-in and we want it: a same-day request has to be confirmable by call,
    // and it is the only way to reach someone whose email bounces.
    phone_number_collection: { enabled: true },
    ...(discountId ? { discounts: [{ promotion_code: discountId }] } : {}),
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
      gclid,
      gclidSource,
      utmSource: clip(fromBrowser.utmSource),
      utmMedium: clip(fromBrowser.utmMedium),
      utmCampaign: clip(fromBrowser.utmCampaign),
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
