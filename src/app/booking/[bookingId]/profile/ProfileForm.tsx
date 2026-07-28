"use client";

import { useState } from "react";
import { HELMET_SIZES, EXPERIENCE_LEVELS } from "@/lib/rider-profile-options";
// Type-only, so nothing from the Airtable module reaches the browser bundle.
import type { RiderProfileBooking } from "@/lib/rider-profile";

const LABEL = "block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2";
const FIELD =
  "w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]";

export default function ProfileForm({
  booking,
  token,
}: {
  booking: RiderProfileBooking;
  token: string;
}) {
  const [phone, setPhone] = useState(booking.phone);
  const [emergencyContact, setEmergencyContact] = useState(booking.emergencyContact);
  const [licenseNumber, setLicenseNumber] = useState(booking.licenseNumber);
  const [helmetSize, setHelmetSize] = useState(booking.helmetSize);
  const [ridingExperience, setRidingExperience] = useState(booking.ridingExperience);
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(booking.completedAt));
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/rider-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          token,
          phone,
          emergencyContact,
          licenseNumber,
          helmetSize,
          ridingExperience,
          specialRequests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save. Please try again.");
        return;
      }
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="rounded-sm border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          <span className="font-semibold">Thank you, that&apos;s all we needed.</span> Your details
          are with the team. You can change anything below and save again any time before pickup.
        </div>
      )}
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-sm border border-[#e8e3d3] p-6 md:p-8 space-y-5">
        <div>
          <label className={LABEL} htmlFor="phone">
            Mobile number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 605 555 0134"
            className={FIELD}
          />
          <p className="mt-1.5 text-xs text-[#6e6a5e]">
            So we can reach you on the day, about the bike or the weather.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="emergency">
            Emergency contact
          </label>
          <input
            id="emergency"
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Name and phone number"
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="licence">
            Motorcycle license number
          </label>
          <input
            id="licence"
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="The one with your motorcycle endorsement"
            className={FIELD}
          />
          <p className="mt-1.5 text-xs text-[#6e6a5e]">
            Bring the license itself to pickup, we check it there. Filling it in now just makes
            handover quicker.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className={LABEL} htmlFor="helmet">
              Helmet size
            </label>
            <select
              id="helmet"
              value={helmetSize}
              onChange={(e) => setHelmetSize(e.target.value)}
              className={`${FIELD} bg-white`}
            >
              <option value="">Not sure yet</option>
              {HELMET_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[#6e6a5e]">A helmet is included with every rental.</p>
          </div>
          <div>
            <label className={LABEL} htmlFor="experience">
              Riding experience
            </label>
            <select
              id="experience"
              value={ridingExperience}
              onChange={(e) => setRidingExperience(e.target.value)}
              className={`${FIELD} bg-white`}
            >
              <option value="">Rather not say</option>
              {EXPERIENCE_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[#6e6a5e]">
              Helps us set the bike up and point you at the right roads.
            </p>
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="requests">
            Anything else
          </label>
          <textarea
            id="requests"
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Luggage, route ideas, riding with someone else…"
            className={`${FIELD} resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#2e3b23] hover:bg-[#3a4a2c] disabled:opacity-60 text-white font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
      >
        {saving ? "Saving…" : saved ? "Save changes" : "Save my details"}
      </button>
      <p className="text-center text-xs text-[#6e6a5e]">
        Every field is optional. Whatever you skip, we&apos;ll sort out at the counter.
      </p>
    </form>
  );
}
