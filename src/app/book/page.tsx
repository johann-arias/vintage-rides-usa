"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AvailabilityResult = {
  availableCount: number;
  requested: number;
  canBook: boolean;
  outOfSeason?: boolean;
  pricing: {
    dailyRate: number;
    totalDays: number;
    totalPrice: number;
    minDays: number;
    meetsMinimum: boolean;
  };
} | null;

type Step = "dates" | "details" | "review";

const today = new Date().toISOString().split("T")[0];
const minEnd = (start: string) => {
  const d = new Date(start);
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
};

export default function BookPage() {
  const router = useRouter();

  // Step 1: Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bikeCount, setBikeCount] = useState(1);
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

  const checkAvailability = useCallback(async () => {
    if (!startDate || !endDate) return;
    setCheckingAvailability(true);
    setAvailability(null);
    try {
      const res = await fetch(
        `/api/availability?startDate=${startDate}&endDate=${endDate}&bikes=${bikeCount}`
      );
      const data = await res.json();
      setAvailability(data);
    } catch {
      setError("Could not check availability. Please try again.");
    } finally {
      setCheckingAvailability(false);
    }
  }, [startDate, endDate, bikeCount]);

  useEffect(() => {
    if (startDate && endDate && new Date(endDate) > new Date(startDate)) {
      checkAvailability();
    }
  }, [startDate, endDate, bikeCount, checkAvailability]);

  async function handleCheckout() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          totalPrice: availability?.pricing.totalPrice,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canProceedToDetails =
    availability?.canBook && availability?.pricing?.meetsMinimum && !availability?.outOfSeason;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 bg-[#f8f6f0] min-h-screen">
        {/* Header */}
        <section className="bg-[#111110] py-14">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-3">Rental Booking</p>
            <h1 className="text-white text-3xl md:text-4xl font-light">Book Your Bike</h1>
          </div>
        </section>

        {/* Progress steps */}
        <div className="bg-[#1a1a18] border-b border-white/10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-6">
            {(["dates", "details", "review"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s
                      ? "bg-[#c8a45a] text-[#111110]"
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

        <div className="max-w-3xl mx-auto px-6 py-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
              {error}
            </div>
          )}

          {/* ── Step 1: Dates ──────────────────────────────────────────────── */}
          {step === "dates" && (
            <div className="space-y-8">
              <div className="bg-white rounded-sm border border-[#e8e6e0] p-8">
                <h2 className="text-[#111110] font-semibold text-lg mb-6">Select Dates & Bikes</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (endDate && new Date(endDate) <= new Date(e.target.value)) {
                          setEndDate(minEnd(e.target.value));
                        }
                      }}
                      className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-[#111110] text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={startDate ? minEnd(startDate) : today}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-[#111110] text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
                    Number of Bikes
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setBikeCount(Math.max(1, bikeCount - 1))}
                      className="w-10 h-10 border border-[#e8e6e0] rounded-sm text-[#111110] font-bold hover:border-[#c8a45a] transition-colors"
                    >
                      −
                    </button>
                    <span className="text-[#111110] font-semibold text-xl w-8 text-center">{bikeCount}</span>
                    <button
                      onClick={() => setBikeCount(Math.min(10, bikeCount + 1))}
                      className="w-10 h-10 border border-[#e8e6e0] rounded-sm text-[#111110] font-bold hover:border-[#c8a45a] transition-colors"
                    >
                      +
                    </button>
                    <span className="text-[#6b6b6b] text-sm">bike{bikeCount > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Availability result */}
                {checkingAvailability && (
                  <div className="bg-[#f8f6f0] border border-[#e8e6e0] rounded-sm px-4 py-4 text-sm text-[#6b6b6b] flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#c8a45a] border-t-transparent rounded-full animate-spin" />
                    Checking availability…
                  </div>
                )}

                {availability && !checkingAvailability && (
                  <div
                    className={`rounded-sm px-5 py-5 border ${
                      availability.canBook && availability.pricing?.meetsMinimum
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {availability.outOfSeason ? (
                      <p className="text-red-700 text-sm font-medium">
                        Bikes are not available for rental during those dates. Please select dates between May and September.
                      </p>
                    ) : !availability.pricing?.meetsMinimum ? (
                      <p className="text-red-700 text-sm font-medium">
                        Minimum rental is {availability.pricing?.minDays} days.
                        Please extend your dates.
                      </p>
                    ) : !availability.canBook ? (
                      <p className="text-red-700 text-sm font-medium">
                        Only {availability.availableCount} bike{availability.availableCount !== 1 ? "s" : ""} available
                        for those dates. Please reduce your selection or choose different dates.
                      </p>
                    ) : (
                      <div>
                        <p className="text-green-700 text-sm font-semibold mb-3">
                          {availability.availableCount} bike{availability.availableCount !== 1 ? "s" : ""} available — looks good!
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-[#111110] font-semibold">{availability.pricing.totalDays}</div>
                            <div className="text-[#6b6b6b] text-xs uppercase tracking-wider">Days</div>
                          </div>
                          <div>
                            <div className="text-[#111110] font-semibold">${availability.pricing.dailyRate}</div>
                            <div className="text-[#6b6b6b] text-xs uppercase tracking-wider">Per bike/day</div>
                          </div>
                          <div>
                            <div className="text-[#c8a45a] font-bold text-lg">
                              ${availability.pricing.totalPrice.toLocaleString()}
                            </div>
                            <div className="text-[#6b6b6b] text-xs uppercase tracking-wider">Total</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep("details")}
                disabled={!canProceedToDetails}
                className="w-full bg-[#c8a45a] hover:bg-[#e8c98a] disabled:bg-[#e8e6e0] disabled:text-[#6b6b6b] text-[#111110] font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
              >
                Continue to Details
              </button>
            </div>
          )}

          {/* ── Step 2: Details ────────────────────────────────────────────── */}
          {step === "details" && (
            <div className="space-y-8">
              <div className="bg-white rounded-sm border border-[#e8e6e0] p-8">
                <h2 className="text-[#111110] font-semibold text-lg mb-6">Your Details</h2>

                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
                    Motorcycle License Number *
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Your license number with motorcycle endorsement"
                    className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Jane Doe — +1 555 123 4567"
                    className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    placeholder="Luggage, helmet size, route suggestions…"
                    className="w-full border border-[#e8e6e0] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45a] focus:ring-1 focus:ring-[#c8a45a] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("dates")}
                  className="flex-1 border border-[#2a2a28] text-[#111110] font-medium tracking-wider py-4 rounded-sm hover:bg-[#111110] hover:text-white transition-colors text-sm uppercase"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  disabled={!firstName || !lastName || !email || !licenseNumber}
                  className="flex-[2] bg-[#c8a45a] hover:bg-[#e8c98a] disabled:bg-[#e8e6e0] disabled:text-[#6b6b6b] text-[#111110] font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
                >
                  Review Booking
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────────────────── */}
          {step === "review" && availability && (
            <div className="space-y-6">
              <div className="bg-white rounded-sm border border-[#e8e6e0] p-8">
                <h2 className="text-[#111110] font-semibold text-lg mb-6">Review Your Booking</h2>

                <div className="space-y-4 mb-8">
                  {[
                    { label: "Pickup", value: new Date(startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
                    { label: "Return", value: new Date(endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
                    { label: "Duration", value: `${availability.pricing.totalDays} days` },
                    { label: "Bikes", value: `${bikeCount} × Royal Enfield Himalayan 450` },
                    { label: "Daily Rate", value: `$${availability.pricing.dailyRate} per bike` },
                    { label: "Rider", value: `${firstName} ${lastName}` },
                    { label: "Email", value: email },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-[#f0ede6] text-sm">
                      <span className="text-[#6b6b6b]">{row.label}</span>
                      <span className="text-[#111110] font-medium">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-3 text-lg">
                    <span className="font-semibold text-[#111110]">Total</span>
                    <span className="font-bold text-[#c8a45a]">
                      ${availability.pricing.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-[#6b6b6b] text-xs leading-relaxed border-t border-[#f0ede6] pt-4">
                  By proceeding you agree to our Terms & Conditions. Full payment is charged at checkout.
                  Cancellation policy: 100% refund if cancelled 30+ days before pickup, 50% within 30 days, no refund within 7 days.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("details")}
                  className="flex-1 border border-[#2a2a28] text-[#111110] font-medium tracking-wider py-4 rounded-sm hover:bg-[#111110] hover:text-white transition-colors text-sm uppercase"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="flex-[2] bg-[#111110] hover:bg-[#2a2a28] disabled:opacity-60 text-white font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    `Pay $${availability.pricing.totalPrice.toLocaleString()}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
