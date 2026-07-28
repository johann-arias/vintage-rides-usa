"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  PICKUP_LOCATION,
  PICKUP_DIRECTIONS_URL,
  PICKUP_MAP_EMBED_URL,
  RENTAL_TIME_SLOTS,
  AFTER_HOURS_OPTION,
  DEFAULT_PICKUP_TIME,
  DROPOFF_BY_APPOINTMENT,
  GOOGLE_LISTING_URL,
} from "@/lib/location";
import { earliestBookableDate, todayInRapidCity } from "@/lib/booking-window";
import { trackEvent, trackBeginCheckout, daysBetween } from "@/lib/analytics";

// Short testimonials for the trust rail on the dates step (cold ad traffic).
// Trimmed from the full set on the homepage — same reviewers, same voice.
const RAIL_REVIEWS = [
  {
    quote:
      "I called Mike last second, he had me set up on a bike in no time. We went over the bike and he gave me guidance on which roads to take. I'll be returning and using Vintage Rides.",
    author: "Brandon Kuuzi",
  },
  {
    quote:
      "Mike was extremely accommodating and flexible, gave us his cell and was very responsive, and was full of local knowledge. Don't forget to pet Katy, the shop dog!",
    author: "M S",
  },
];

// What's included, condensed for the rail. Fuller spec list lives on /fleet.
const RAIL_INCLUDED = [
  "452cc · 40 hp · 6-speed",
  "Long-travel suspension, built for pavement & dirt",
  "Panniers, phone mount & tank bag included",
  "Custer State Park + Black Hills passes included",
];

type AvailabilityResult = {
  availableCount: number;
  requested: number;
  canBook: boolean;
  outOfSeason?: boolean;
  requestToBook?: boolean;
  pastDate?: boolean;
  pricing: {
    dailyRate: number;
    totalDays: number;
    subtotal: number;
    tax: number;
    totalPrice: number;
    minDays: number;
    seasonName: string;
  } | null;
} | null;

// Single label for what the availability check told the visitor. This is the
// answer to "why did they stop at step 1" — sold out, too short, wrong season
// or simply the price they saw.
function availabilityOutcome(a: NonNullable<AvailabilityResult>): string {
  if (a.pastDate) return "past_date";
  if (a.outOfSeason) return "out_of_season";
  if (!a.canBook) return "sold_out";
  if (a.pricing && a.pricing.totalDays < a.pricing.minDays) return "below_min_days";
  return "available";
}

// Earliest self-service pickup date (no same-day — those are arranged on demand).
const earliest = earliestBookableDate();
// Return date can be the pickup date itself (same-day / day rental).
const minEnd = (start: string) => start;

export default function BookPage() {
  // The rental itself: the only thing asked for before payment.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bikeCount, setBikeCount] = useState(1);
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  // Drop-off is always arranged by appointment — not a customer-selectable slot.
  const dropoffTime = DROPOFF_BY_APPOINTMENT;
  const [availability, setAvailability] = useState<AvailabilityResult>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // A discount code carried in the link, e.g. /book?promo=EAGLE130. Read from
  // the URL rather than useSearchParams so this page needs no Suspense
  // boundary. Stripe validates it and applies it on the payment page; we only
  // pass it along and say that it is there.
  const [promoCode, setPromoCode] = useState("");
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("promo");
    if (code) setPromoCode(code.trim().toUpperCase().slice(0, 40));
  }, []);

  // The form column is taller than a laptop viewport, so `position: sticky` on
  // it does nothing useful: the pay button sits below the fold and the proof
  // rail on the right keeps scrolling past it. A bar pinned to the bottom of
  // the screen carries the price and the button instead, and it stays up for
  // as long as there is something to buy. It used to hide itself whenever the
  // real button came into view; that was fragile to get right and gained
  // nothing, so it no longer tries.

  // ── Funnel instrumentation ──────────────────────────────────────────────
  // There is one step left before Stripe, so the funnel is short: landed,
  // touched a date, saw a price, went to pay. These refs keep each milestone
  // firing once.
  const datesStartedRef = useRef(false);
  const leavingForCheckoutRef = useRef(false);
  const exitSentRef = useRef(false);
  const addToCartSentRef = useRef(false);
  // Latest state, read by the exit listener so it never has to re-subscribe.
  const snapshotRef = useRef({ hasDates: false, outcome: "" });

  // Landing on the page: the top of the funnel. The name is kept from the
  // three-step era so the /garage report reads across the change.
  useEffect(() => {
    trackEvent("book_step_dates", { step: "dates", step_number: 1 });
  }, []);

  // Keep the exit snapshot current without re-subscribing the listener.
  useEffect(() => {
    snapshotRef.current = {
      hasDates: Boolean(startDate && endDate),
      outcome: availability ? availabilityOutcome(availability) : "",
    };
  });

  // How far the visitor got when the page went away. Sent once, and skipped
  // when the page is left on purpose for the Stripe checkout.
  useEffect(() => {
    const onExit = (forced: boolean) => {
      if (!forced && document.visibilityState !== "hidden") return;
      if (leavingForCheckoutRef.current || exitSentRef.current) return;
      exitSentRef.current = true;
      const s = snapshotRef.current;
      trackEvent("book_exit_dates", {
        step: "dates",
        step_number: 1,
        has_dates: s.hasDates,
        outcome: s.outcome,
      });
    };
    const onVisibility = () => onExit(false);
    const onPageHide = () => onExit(true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // First touch on the pickup date: the single most telling number on this
  // page, since most ad traffic leaves without ever engaging with the form.
  function markDatesStarted() {
    if (datesStartedRef.current) return;
    datesStartedRef.current = true;
    trackEvent("book_dates_started");
  }

  const checkAvailability = useCallback(async () => {
    if (!startDate || !endDate) return;
    setCheckingAvailability(true);
    setAvailability(null);
    setError("");
    // Same billed-days definition as the pricing engine (a same-day rental is
    // one day, not zero), so every event in the funnel counts duration alike.
    const shared = {
      days: Math.max(daysBetween(startDate, endDate), 1),
      lead_time_days: daysBetween(todayInRapidCity(), startDate),
      bikes: bikeCount,
    };
    try {
      const res = await fetch(
        `/api/availability?startDate=${startDate}&endDate=${endDate}&bikes=${bikeCount}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || typeof data?.canBook !== "boolean") {
        setError("Could not check availability. Please try again in a moment.");
        trackEvent("book_avail_error", { ...shared, outcome: "error" });
        return;
      }
      setAvailability(data);
      // The moment the visitor learns whether they can ride and at what price.
      // Outcome in the event name: sold out, too short, wrong season or a price
      // they walked away from are four very different problems.
      const outcome = availabilityOutcome(data);
      trackEvent(`book_avail_${outcome}`, {
        ...shared,
        days: data.pricing?.totalDays ?? shared.days,
        outcome,
        available_count: data.availableCount,
        season: data.pricing?.seasonName,
        daily_rate: data.pricing?.dailyRate,
        value: data.pricing?.totalPrice,
        currency: "USD",
      });
    } catch {
      setError("Could not check availability. Please try again.");
      trackEvent("book_avail_error", { ...shared, outcome: "error" });
    } finally {
      setCheckingAvailability(false);
    }
  }, [startDate, endDate, bikeCount]);

  useEffect(() => {
    // >= so same-day (return === pickup) day rentals also trigger a check.
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      checkAvailability();
    }
  }, [startDate, endDate, bikeCount, checkAvailability]);

  /**
   * Best-effort Meta pixel call. Analytics never blocks a booking.
   *
   * `eventId` matters for InitiateCheckout: the server fires the same event
   * through the Conversions API a moment later, when it creates the Stripe
   * session. Same act, two transports. Without a shared id Meta counts it
   * twice, inflates the very metric both ad sets optimise on, and teaches the
   * optimiser that checkouts are twice as common as they are.
   */
  function fireMetaEvent(name: string, eventId?: string) {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq !== "function" || !availability?.pricing) return;
    try {
      fbq(
        "track",
        name,
        {
          value: availability.pricing.totalPrice,
          currency: "USD",
          num_items: bikeCount,
          content_ids: ["himalayan-450-rental"],
          content_type: "product",
        },
        eventId ? { eventID: eventId } : undefined
      );
    } catch {
      /* analytics must never break the booking flow */
    }
  }

  // AddToCart the first time a bookable price is on screen. With the details
  // step gone, this is the dense upstream signal the ad optimiser can learn on:
  // it happens to everyone who picks usable dates, not just to the few who go
  // all the way to the card form. Fired once per page, not once per date edit.
  useEffect(() => {
    if (addToCartSentRef.current) return;
    if (!availability?.pricing || !availability.canBook) return;
    if (availability.outOfSeason || availability.pastDate) return;
    if (availability.pricing.totalDays < availability.pricing.minDays) return;
    addToCartSentRef.current = true;
    fireMetaEvent("AddToCart");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability]);

  async function handleCheckout() {
    // InitiateCheckout means what it says: they are leaving to pay. It goes out
    // from here AND from the server when the Stripe session is created, sharing
    // this id so Meta merges them into one event with the union of their
    // parameters: the browser brings the pixel context, the server brings the
    // IP, user agent and click cookies.
    const icEventId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ic-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    fireMetaEvent("InitiateCheckout", icEventId);
    setSubmitting(true);
    setError("");
    // Commerce event for GTM to route; our own funnel event follows.
    if (availability?.pricing) {
      trackBeginCheckout({
        value: availability.pricing.totalPrice,
        days: availability.pricing.totalDays,
        bikes: bikeCount,
      });
    }
    trackEvent("book_checkout_click", {
      days: availability?.pricing?.totalDays,
      bikes: bikeCount,
      season: availability?.pricing?.seasonName,
      request_to_book: Boolean(availability?.requestToBook),
      value: availability?.pricing?.totalPrice,
      currency: "USD",
    });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          bikeCount,
          pickupTime,
          dropoffTime,
          icEventId,
          promoCode: promoCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        // Leaving for Stripe is the success case, not an abandon.
        leavingForCheckoutRef.current = true;
        trackEvent("book_checkout_redirect", {
          value: availability?.pricing?.totalPrice,
          currency: "USD",
          request_to_book: Boolean(availability?.requestToBook),
        });
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed. Please try again.");
        trackEvent("book_checkout_error", { reason: String(data.error ?? "unknown").slice(0, 100) });
      }
    } catch {
      setError("Something went wrong. Please try again.");
      trackEvent("book_checkout_error", { reason: "network" });
    } finally {
      setSubmitting(false);
    }
  }

  const belowMinDays =
    availability?.pricing != null &&
    availability.pricing.totalDays < availability.pricing.minDays;

  const canPay =
    availability?.canBook &&
    !availability?.outOfSeason &&
    !availability?.pastDate &&
    availability?.pricing != null &&
    !belowMinDays;

  // Tell the floating contact widget to step above the pinned bar, but only
  // while that bar is actually on screen.
  useEffect(() => {
    document.body.classList.toggle("has-booking-bar", Boolean(canPay));
    return () => document.body.classList.remove("has-booking-bar");
  });

  /** "Friday, September 12, 2026", or empty while the date is unset. */
  const longDate = (ymd: string) =>
    ymd
      ? new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })
      : "";

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 bg-[#faf5ea] min-h-screen">
        {/* Header */}
        <section className="bg-[#2e3b23] py-14">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-3">Rental Booking</p>
            <h1 className="text-white text-3xl md:text-4xl font-light">
              Book your <span className="font-semibold">Himalayan 450</span>
            </h1>
            {/* Trust strip — instant context for visitors arriving cold from an ad. */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-[#f4e9cf]">
                <span className="text-[#d9a32b] tracking-tight" aria-hidden>★★★★★</span>
                <span className="font-medium">5.0</span>
                <span className="text-white/50">on Google</span>
              </span>
              <span className="text-white/20" aria-hidden>·</span>
              <span className="text-[#f4e9cf]">$130<span className="text-white/50">/day + tax</span></span>
              <span className="text-white/20" aria-hidden>·</span>
              <span className="text-[#f4e9cf]">Free Custer + Black Hills park passes</span>
              <span className="text-white/20" aria-hidden>·</span>
              <span className="text-[#f4e9cf]">Free cancellation 14+ days out</span>
            </div>
          </div>
        </section>


        <div className="max-w-6xl mx-auto px-6 py-10">
          {error && (
            <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
              {error}
            </div>
          )}

          {/* ── The only step before Stripe ────────────────────────────────── */}
          {/* Two columns on desktop: booking form + a trust rail for cold ad
              traffic. On mobile everything stacks, form first (offer visible),
              proof below. Name, email and phone are collected by Stripe on the
              next screen, the rest of the rider profile after payment. */}
          <div className="lg:grid lg:grid-cols-5 lg:gap-10 lg:items-start">
             {/* Both columns scroll together. Pinning this one used to look like a
                 second scrollbar: it is taller than the viewport, so sticky froze
                 it mid-page while the proof rail carried on. The pinned bar at the
                 bottom of the screen is what keeps the price and the button
                 reachable now. */}
             <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-sm border border-[#e8e3d3] p-8">
                <h2 className="text-[#1a1a17] font-semibold text-lg mb-6">Select Dates & Bikes</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-3">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      min={earliest}
                      value={startDate}
                      onChange={(e) => {
                        markDatesStarted();
                        setStartDate(e.target.value);
                        if (endDate && new Date(endDate) <= new Date(e.target.value)) {
                          setEndDate(minEnd(e.target.value));
                        }
                      }}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-[#1a1a17] text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={startDate ? minEnd(startDate) : earliest}
                      value={endDate}
                      onChange={(e) => {
                        markDatesStarted();
                        setEndDate(e.target.value);
                      }}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-[#1a1a17] text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-3">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                      Pickup Time
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-[#1a1a17] text-sm bg-white focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    >
                      {RENTAL_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value={AFTER_HOURS_OPTION}>{AFTER_HOURS_OPTION}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                      Drop-off Time
                    </label>
                    <div className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-[#6e6a5e] text-sm bg-[#faf5ea]">
                      {DROPOFF_BY_APPOINTMENT}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#6e6a5e] mb-6">
                  Pickup every half hour, <span className="text-[#1a1a17] font-medium">8:00 AM to 6:00 PM</span>.
                  After-hours pickup and all drop-offs by appointment.
                </p>

                <div className="mb-6">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                    Number of Bikes
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setBikeCount(Math.max(1, bikeCount - 1))}
                      className="w-10 h-10 border border-[#e8e3d3] rounded-sm text-[#1a1a17] font-bold hover:border-[#d9a32b] transition-colors"
                    >
                      −
                    </button>
                    <span className="text-[#1a1a17] font-semibold text-xl w-8 text-center">{bikeCount}</span>
                    <button
                      onClick={() => setBikeCount(Math.min(10, bikeCount + 1))}
                      className="w-10 h-10 border border-[#e8e3d3] rounded-sm text-[#1a1a17] font-bold hover:border-[#d9a32b] transition-colors"
                    >
                      +
                    </button>
                    <span className="text-[#6e6a5e] text-sm">bike{bikeCount > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Availability result */}
                {checkingAvailability && (
                  <div className="bg-[#faf5ea] border border-[#e8e3d3] rounded-sm px-4 py-4 text-sm text-[#6e6a5e] flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#d9a32b] border-t-transparent rounded-full animate-spin" />
                    Checking availability…
                  </div>
                )}

                {availability && !checkingAvailability && (
                  <div
                    className={`rounded-sm px-5 py-5 border ${
                      availability.canBook && !availability.outOfSeason && !availability.pastDate && !belowMinDays
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {availability.pastDate ? (
                      <p className="text-red-700 text-sm font-medium">
                        That pickup date is in the past. Please choose today or a later date.
                      </p>
                    ) : availability.outOfSeason ? (
                      <p className="text-red-700 text-sm font-medium">
                        Bikes are not available for rental during those dates. Please select dates between May and September.
                      </p>
                    ) : !availability.canBook ? (
                      <p className="text-red-700 text-sm font-medium">
                        Only {availability.availableCount} bike{availability.availableCount !== 1 ? "s" : ""} available
                        for those dates. Please reduce your selection or choose different dates.
                      </p>
                    ) : belowMinDays ? (
                      <p className="text-red-700 text-sm font-medium">
                        {availability.pricing!.seasonName === "Sturgis Rally"
                          ? `The Sturgis Rally period requires a minimum ${availability.pricing!.minDays}-day rental.`
                          : `This period requires a minimum ${availability.pricing!.minDays}-day rental.`}{" "}
                        Please extend your return date.
                      </p>
                    ) : (
                      <div>
                        <p className="text-green-700 text-sm font-semibold mb-4">
                          {availability.availableCount} bike{availability.availableCount !== 1 ? "s" : ""} available — looks good!
                        </p>
                        {availability.requestToBook && (
                          <div className="mb-4 rounded-sm border border-[#e8d9b0] bg-[#faf5ea] px-4 py-3 text-sm text-[#8a6516]">
                            <span className="font-semibold text-[#1a1a17]">Same-day request.</span> We&apos;ll
                            authorize your card now but only charge once the team confirms your bike (usually within
                            a couple of hours). If we can&apos;t, the hold is released and you&apos;re not charged.
                          </div>
                        )}
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#6e6a5e]">${availability.pricing!.dailyRate} × {availability.pricing!.totalDays} day{availability.pricing!.totalDays !== 1 ? "s" : ""} × {bikeCount} bike{bikeCount > 1 ? "s" : ""}</span>
                            <span className="text-[#1a1a17]">${availability.pricing!.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6e6a5e]">Tax (11.9%)</span>
                            <span className="text-[#1a1a17]">${availability.pricing!.tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-[#e8e3d3] pt-2 mt-2">
                            <span className="font-semibold text-[#1a1a17]">Total</span>
                            <span className="font-bold text-[#d9a32b] text-lg">${availability.pricing!.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recap + terms + pay. Everything that used to be a third step,
                  minus the fields Stripe collects better than we can. */}
              <div>
                {canPay && (
                  <div className="mb-5 rounded-sm border border-[#e8e3d3] bg-white px-5 py-4">
                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="text-[#6e6a5e]">Pickup</span>
                      <span className="text-[#1a1a17] font-medium text-right">
                        {longDate(startDate)} · {pickupTime}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 text-sm border-t border-[#f0ece0]">
                      <span className="text-[#6e6a5e]">Return</span>
                      <span className="text-[#1a1a17] font-medium text-right">
                        {longDate(endDate)} · {dropoffTime}
                      </span>
                    </div>
                    {promoCode && (
                      <p className="mt-3 rounded-sm border border-[#e8d9b0] bg-[#faf5ea] px-3 py-2 text-xs text-[#8a6516]">
                        Discount code <span className="font-semibold">{promoCode}</span> will be
                        applied on the payment page.
                      </p>
                    )}
                    <p className="mt-3 border-t border-[#f0ece0] pt-3 text-xs leading-relaxed text-[#6e6a5e]">
                      {availability?.requestToBook
                        ? "Same-day: your card is authorized and only charged once we confirm your bike."
                        : "Secure payment on the next screen, then two minutes of ride details."}{" "}
                      Full refund if cancelled 14 or more days before pickup, 50% between 7 and 14
                      days, none within 7.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={!canPay || submitting}
                  className="w-full bg-[#2e3b23] hover:bg-[#3a4a2c] disabled:bg-[#e8e3d3] disabled:text-[#6e6a5e] text-white font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : !canPay ? (
                    "Select your dates"
                  ) : availability!.requestToBook ? (
                    `Request to Book · Authorize $${availability!.pricing!.totalPrice.toLocaleString()}`
                  ) : (
                    `Continue to Payment · $${availability!.pricing!.totalPrice.toLocaleString()}`
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-[#6e6a5e]">
                  🔒 Secure checkout · Free cancellation 14+ days before pickup · No account needed
                </p>
              </div>

              {/* The fleet — scale + availability, reinforces a real shop with bikes ready. */}
              <div className="relative rounded-sm overflow-hidden border border-[#e8e3d3]">
                <div
                  className="aspect-[16/9] bg-[#e8e3d3] bg-cover bg-center"
                  style={{ backgroundImage: "url('/fleet-lineup-side.jpg')" }}
                  role="img"
                  aria-label="The Vintage Rides USA fleet of Royal Enfield Himalayan 450s"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-semibold">10 × 2025 Royal Enfield Himalayan 450</p>
                  <p className="text-white/80 text-sm">The same bikes we run in the Himalayas and the Andes.</p>
                </div>
              </div>
             </div>

              {/* ── Trust rail ─────────────────────────────────────────────── */}
              <aside className="lg:col-span-2 mt-10 lg:mt-0 space-y-6">
                {/* What you're renting — the single bike + what's included */}
                <div className="bg-white rounded-sm border border-[#e8e3d3] overflow-hidden">
                  <div
                    className="aspect-[16/10] bg-[#e8e3d3] bg-cover bg-center"
                    style={{ backgroundImage: "url('/bike-studio.jpg')" }}
                    role="img"
                    aria-label="Royal Enfield Himalayan 450"
                  />
                  <div className="p-6">
                    <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#a9781a] mb-2">What you&apos;re renting</p>
                    <h3 className="text-[#1a1a17] font-semibold text-lg leading-snug mb-3">Royal Enfield Himalayan 450</h3>
                    <ul className="space-y-1.5 mb-4">
                      {RAIL_INCLUDED.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-[#2a2a24]">
                          <span className="text-[#d9a32b] mt-0.5 shrink-0">—</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                    <Link href="/fleet" className="text-sm text-[#a9781a] hover:text-[#966b14] font-medium">
                      See full specs →
                    </Link>
                  </div>
                </div>

                {/* Meet your local hosts — the trust anchor for cold traffic */}
                <div className="bg-white rounded-sm border border-[#e8e3d3] overflow-hidden">
                  <div
                    className="aspect-[16/10] bg-[#e8e3d3] bg-cover bg-center"
                    style={{ backgroundImage: "url('/mike-wendy-garage.jpg')" }}
                    role="img"
                    aria-label="Mike and Wendy in their Rapid City garage"
                  />
                  <div className="p-6">
                    <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#a9781a] mb-2">Your local hosts</p>
                    <h3 className="text-[#1a1a17] font-semibold text-lg mb-3">Mike &amp; Wendy · Rapid City</h3>
                    <div className="inline-flex items-center gap-2 border border-[#d9a32b]/50 bg-[#d9a32b]/10 rounded-sm px-3 py-1.5 mb-4">
                      <span className="text-base leading-none" aria-hidden>🏆</span>
                      <span className="text-[#57534a] text-[11px] tracking-wider uppercase">
                        Wendy: first woman to win the Iron Butt Rally · 2019
                      </span>
                    </div>
                    <p className="text-sm text-[#57534a] leading-relaxed mb-3">
                      Born-and-raised Black Hills locals since 2018. You get the keys from us in person,
                      plus the honest rundown on which roads are riding best that week.
                    </p>
                    <p className="text-sm text-[#1a1a17] italic">We&apos;ll treat you like a neighbor, not a number.</p>
                  </div>
                </div>

                {/* Where you pick up — the map, surfaced early instead of only at review */}
                <div className="bg-white rounded-sm border border-[#e8e3d3] overflow-hidden">
                  <div className="p-6 pb-4">
                    <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#a9781a] mb-2">Where you pick up</p>
                    <p className="text-[#1a1a17] font-semibold">{PICKUP_LOCATION.name}</p>
                    <p className="text-[#2a2a24] text-sm mt-1">{PICKUP_LOCATION.street}</p>
                    <p className="text-[#2a2a24] text-sm">{PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}</p>
                    <a
                      href={PICKUP_DIRECTIONS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-[#a9781a] hover:text-[#966b14] font-medium"
                    >
                      Get directions →
                    </a>
                  </div>
                  <iframe
                    title="Pickup location map"
                    src={PICKUP_MAP_EMBED_URL}
                    className="w-full h-52 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {/* Reviews */}
                <div className="bg-[#2e3b23] rounded-sm p-6 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#d9a32b]" aria-hidden>★★★★★</span>
                    <span className="text-sm font-medium">5.0 on Google</span>
                  </div>
                  <div className="space-y-4">
                    {RAIL_REVIEWS.map((r) => (
                      <figure key={r.author}>
                        <blockquote className="text-sm text-white/85 leading-relaxed">&ldquo;{r.quote}&rdquo;</blockquote>
                        <figcaption className="text-xs text-[#d9a32b] mt-1.5">{r.author}</figcaption>
                      </figure>
                    ))}
                  </div>
                  <a
                    href={GOOGLE_LISTING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5 text-sm text-white/70 hover:text-white font-medium border-b border-white/30"
                  >
                    Read all reviews →
                  </a>
                </div>
              </aside>
            </div>
        </div>

        {/* Pinned action bar. Appears as soon as there is a bookable price and
            steps aside when the real button is on screen, so there are never
            two pay buttons competing. Right padding clears the floating contact
            button, which sits at bottom-6 right-6 with z-50. */}
        {canPay && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e3d3] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
            <div className="max-w-6xl mx-auto flex items-center gap-4 px-6 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[#1a1a17] font-semibold leading-tight whitespace-nowrap">
                  ${availability!.pricing!.totalPrice.toLocaleString()}
                  <span className="ml-2 text-[11px] font-normal text-[#6e6a5e] sm:text-xs">
                    {availability!.pricing!.totalDays}d · {bikeCount} bike
                    {bikeCount > 1 ? "s" : ""} · incl. tax
                  </span>
                </p>
                <p className="hidden text-xs text-[#6e6a5e] sm:block">
                  Free cancellation 14+ days before pickup
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="shrink-0 bg-[#2e3b23] hover:bg-[#3a4a2c] disabled:opacity-60 text-white font-semibold tracking-wider px-4 sm:px-6 py-3 rounded-sm transition-colors text-xs sm:text-sm uppercase whitespace-nowrap"
              >
                {submitting ? (
                  "Redirecting…"
                ) : availability!.requestToBook ? (
                  <>
                    Request<span className="hidden sm:inline"> to book</span>
                  </>
                ) : (
                  <>
                    Continue<span className="hidden sm:inline"> to payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
      {/* The pinned bar is fixed, and the footer sits outside <main>, so its
          last strip would end up behind the bar at the bottom of the page.
          Same colour as the footer, so it reads as the footer being taller. */}
      {canPay && <div className="h-20 bg-[#2e3b23]" aria-hidden />}
    </>
  );
}
