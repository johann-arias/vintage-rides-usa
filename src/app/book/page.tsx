"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { trackEvent, daysBetween } from "@/lib/analytics";

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

type Step = "dates" | "details" | "review";

const STEP_NUMBER: Record<Step, number> = { dates: 1, details: 2, review: 3 };

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
  const router = useRouter();

  // Step 1: Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bikeCount, setBikeCount] = useState(1);
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  // Drop-off is always arranged by appointment — not a customer-selectable slot.
  const dropoffTime = DROPOFF_BY_APPOINTMENT;
  const [availability, setAvailability] = useState<AvailabilityResult>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Step 2: Customer details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [step, setStep] = useState<Step>("dates");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Funnel instrumentation ──────────────────────────────────────────────
  // Most visitors leave step 1 without ever picking a date, and until now the
  // only signal between "page viewed" and "checkout" was a single Meta event.
  // These refs keep each milestone firing once.
  const datesStartedRef = useRef(false);
  const leavingForCheckoutRef = useRef(false);
  const exitSentRef = useRef(false);
  // Latest state, read by the exit listener so it never has to re-subscribe.
  const snapshotRef = useRef({ step: "dates" as Step, hasDates: false, outcome: "", missing: "" });

  // Steps swap in place, so the browser keeps the previous scroll offset and the
  // next step opens mid-page (mobile especially: you land on the footer). Bring
  // the progress bar back under the sticky navbar on every step change.
  const stepsBarRef = useRef<HTMLDivElement>(null);
  const isFirstStepRender = useRef(true);

  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    const bar = stepsBarRef.current;
    if (!bar) return;
    const NAVBAR_HEIGHT = 64; // main has pt-16
    const top = bar.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
  }, [step]);

  // Every step entry, including the first render: this is the funnel spine.
  // The step lives in the event NAME, not in a parameter, so the /garage report
  // can read it straight from the GA4 API with no custom dimension to register.
  useEffect(() => {
    trackEvent(`book_step_${step}`, { step, step_number: STEP_NUMBER[step] });
  }, [step]);

  // Keep the exit snapshot current without re-subscribing the listener.
  useEffect(() => {
    snapshotRef.current = {
      step,
      hasDates: Boolean(startDate && endDate),
      outcome: availability ? availabilityOutcome(availability) : "",
      missing: [
        !firstName && "first_name",
        !lastName && "last_name",
        !email && "email",
        !licenseNumber && "license_number",
      ]
        .filter(Boolean)
        .join(","),
    };
  });

  // Where the visitor stood when the page went away. Sent once, and skipped
  // when the page is left on purpose for the Stripe checkout.
  useEffect(() => {
    const onExit = (forced: boolean) => {
      if (!forced && document.visibilityState !== "hidden") return;
      if (leavingForCheckoutRef.current || exitSentRef.current) return;
      exitSentRef.current = true;
      const s = snapshotRef.current;
      trackEvent(`book_exit_${s.step}`, {
        step: s.step,
        step_number: STEP_NUMBER[s.step],
        has_dates: s.hasDates,
        outcome: s.outcome,
        missing_required: s.step === "details" ? s.missing : undefined,
      });
      // One event per required field still empty when they left. Field names
      // only, never their values — this says which question killed the form.
      if (s.step === "details" && s.missing) {
        for (const field of s.missing.split(",")) trackEvent(`book_missing_${field}`);
      }
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

  // Upper-funnel signal for Meta: the visitor has valid dates, a price, and is
  // moving to the details step. Fired browser-side through the GTM pixel.
  //
  // This used to be reported as InitiateCheckout, the same name the server uses
  // when it actually creates a Stripe session, so Meta saw one event meaning two
  // different things and the funnel could not be read. AddToCart is the honest
  // name for this step and is still a standard event the ad optimizer accepts.
  // It is also the only dense signal we have: 30 in the campaign's first three
  // days, against zero real checkout sessions.
  //
  // No server twin, so no event_id / dedup needed. Best-effort, never blocks.
  function fireAddToCart() {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq !== "function" || !availability?.pricing) return;
    try {
      fbq("track", "AddToCart", {
        value: availability.pricing.totalPrice,
        currency: "USD",
        num_items: bikeCount,
        content_ids: ["himalayan-450-rental"],
        content_type: "product",
      });
    } catch {
      /* analytics must never break the booking flow */
    }
  }

  function handleProceedToDetails() {
    fireAddToCart();
    trackEvent("book_continue_click", {
      days: availability?.pricing?.totalDays,
      lead_time_days: startDate ? daysBetween(todayInRapidCity(), startDate) : undefined,
      bikes: bikeCount,
      season: availability?.pricing?.seasonName,
      value: availability?.pricing?.totalPrice,
      currency: "USD",
    });
    setStep("details");
  }

  async function handleCheckout() {
    setSubmitting(true);
    setError("");
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
          firstName,
          lastName,
          email,
          phone,
          licenseNumber,
          emergencyContact,
          specialRequests,
          totalPrice: availability?.pricing?.totalPrice,
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

  const canProceedToDetails =
    availability?.canBook &&
    !availability?.outOfSeason &&
    availability?.pricing != null &&
    !belowMinDays;

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
              <span className="text-[#f4e9cf]">Free cancellation 30+ days out</span>
            </div>
          </div>
        </section>

        {/* Progress steps */}
        <div ref={stepsBarRef} className="bg-[#26301c] border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
            {(["dates", "details", "review"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s
                      ? "bg-[#d9a32b] text-[#1a1a17]"
                      : i < ["dates", "details", "review"].indexOf(step)
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-xs tracking-wider uppercase hidden sm:block ${
                    step === s ? "text-white" : "text-white/40"
                  }`}
                >
                  {s === "dates" ? "Dates & Bikes" : s === "details" ? "Your Details" : "Review"}
                </span>
                {i < 2 && <span className="text-white/20 text-xs ml-2">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {error && (
            <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
              {error}
            </div>
          )}

          {/* ── Step 1: Dates ──────────────────────────────────────────────── */}
          {/* Two columns on desktop: booking form + a trust rail for cold ad
              traffic. On mobile everything stacks, form first (offer visible),
              proof below. Only this step is enriched — steps 2 & 3 stay lean. */}
          {step === "dates" && (
            <div className="lg:grid lg:grid-cols-5 lg:gap-10 lg:items-start">
             {/* Form column stays pinned on desktop while the taller proof rail scrolls,
                 keeping the CTA in view and absorbing the height difference. */}
             <div className="lg:col-span-3 space-y-8 lg:sticky lg:top-6 lg:self-start">
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
                  Pickup available every half hour, <span className="text-[#1a1a17] font-medium">8:00 AM to 6:00 PM</span>. After-hours pickup and all drop-offs are arranged by appointment — we&apos;ll confirm a time with you. Riding <span className="text-[#1a1a17] font-medium">today</span>? Same-day bookings are a quick request: we authorize your card and only charge once the team confirms your bike.
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

              <div>
                <button
                  onClick={handleProceedToDetails}
                  disabled={!canProceedToDetails}
                  className="w-full bg-[#d9a32b] hover:bg-[#e2ae2c] disabled:bg-[#e8e3d3] disabled:text-[#6e6a5e] text-[#1a1a17] font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
                >
                  Continue to Details
                </button>
                <p className="mt-3 text-center text-xs text-[#6e6a5e]">
                  🔒 Secure checkout · Free cancellation 30+ days before pickup · No account needed
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
          )}

          {/* ── Step 2: Details ────────────────────────────────────────────── */}
          {step === "details" && (
            <div className="space-y-8 max-w-3xl mx-auto">
              <div className="bg-white rounded-sm border border-[#e8e3d3] p-8">
                <h2 className="text-[#1a1a17] font-semibold text-lg mb-6">Your Details</h2>

                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                    Motorcycle License Number *
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Your license number with motorcycle endorsement"
                    className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Jane Doe — +1 555 123 4567"
                    className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    placeholder="Luggage, helmet size, route suggestions…"
                    className="w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    trackEvent("book_back_click", { step, step_number: STEP_NUMBER[step] });
                    setStep("dates");
                  }}
                  className="flex-1 border border-[#3a4730] text-[#1a1a17] font-medium tracking-wider py-4 rounded-sm hover:bg-[#2e3b23] hover:text-white transition-colors text-sm uppercase"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Which optional fields survived the form tells us how much
                    // of it is actually worth asking for before payment.
                    trackEvent("book_review_click", {
                      has_phone: Boolean(phone),
                      has_emergency_contact: Boolean(emergencyContact),
                      has_special_requests: Boolean(specialRequests),
                    });
                    setStep("review");
                  }}
                  disabled={!firstName || !lastName || !email || !licenseNumber}
                  className="flex-[2] bg-[#d9a32b] hover:bg-[#e2ae2c] disabled:bg-[#e8e3d3] disabled:text-[#6e6a5e] text-[#1a1a17] font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
                >
                  Review Booking
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────────────────── */}
          {step === "review" && availability && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-sm border border-[#e8e3d3] p-8">
                <h2 className="text-[#1a1a17] font-semibold text-lg mb-6">Review Your Booking</h2>

                <div className="space-y-0 mb-8">
                  {[
                    { label: "Pickup", value: `${new Date(startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · ${pickupTime}` },
                    { label: "Return", value: `${new Date(endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · ${dropoffTime}` },
                    { label: "Duration", value: `${availability.pricing!.totalDays} day${availability.pricing!.totalDays !== 1 ? "s" : ""}` },
                    { label: "Bikes", value: `${bikeCount} × Royal Enfield Himalayan 450` },
                    { label: "Rider", value: `${firstName} ${lastName}` },
                    { label: "Email", value: email },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2.5 border-b border-[#e8e3d3] text-sm">
                      <span className="text-[#6e6a5e]">{row.label}</span>
                      <span className="text-[#1a1a17] font-medium">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2.5 border-b border-[#e8e3d3] text-sm">
                    <span className="text-[#6e6a5e]">Subtotal (${availability.pricing!.dailyRate}/day × {availability.pricing!.totalDays}d × {bikeCount})</span>
                    <span className="text-[#1a1a17] font-medium">${availability.pricing!.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-[#e8e3d3] text-sm">
                    <span className="text-[#6e6a5e]">Tax (11.9%)</span>
                    <span className="text-[#1a1a17] font-medium">${availability.pricing!.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-4 mt-1">
                    <span className="font-semibold text-[#1a1a17]">Total</span>
                    <span className="font-bold text-[#d9a32b] text-xl">${availability.pricing!.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[#6e6a5e] text-xs leading-relaxed border-t border-[#e8e3d3] pt-4">
                  By proceeding you agree to our Terms & Conditions.{" "}
                  {availability.requestToBook
                    ? "For same-day rides your card is authorized (a hold) at checkout and only charged once we confirm your bike. If we can't confirm, the hold is released and you're not charged."
                    : "Full payment is charged at checkout."}{" "}
                  Cancellation policy: 100% refund if cancelled 30+ days before pickup, 50% within 30 days, no refund within 7 days.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    trackEvent("book_back_click", { step, step_number: STEP_NUMBER[step] });
                    setStep("details");
                  }}
                  className="flex-1 border border-[#3a4730] text-[#1a1a17] font-medium tracking-wider py-4 rounded-sm hover:bg-[#2e3b23] hover:text-white transition-colors text-sm uppercase"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="flex-[2] bg-[#2e3b23] hover:bg-[#3a4a2c] disabled:opacity-60 text-white font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : availability.requestToBook ? (
                    `Request to Book · Authorize $${availability.pricing!.totalPrice.toLocaleString()}`
                  ) : (
                    `Pay $${availability.pricing!.totalPrice.toLocaleString()}`
                  )}
                </button>
              </div>

              <div className="bg-white rounded-sm border border-[#e8e3d3] overflow-hidden">
                <div className="p-6 pb-4">
                  <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#d9a32b] mb-2">Pickup location</p>
                  <p className="text-[#1a1a17] font-semibold">{PICKUP_LOCATION.name}</p>
                  <p className="text-[#2a2a24] text-sm mt-1">{PICKUP_LOCATION.street}</p>
                  <p className="text-[#2a2a24] text-sm">{PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}</p>
                  <a
                    href={PICKUP_DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm text-[#d9a32b] hover:text-[#966b14] font-medium"
                  >
                    Get directions →
                  </a>
                </div>
                <iframe
                  title="Pickup location map"
                  src={PICKUP_MAP_EMBED_URL}
                  className="w-full h-56 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
