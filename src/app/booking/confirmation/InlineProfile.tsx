"use client";

import { useEffect, useState } from "react";
import ProfileForm from "@/app/booking/[bookingId]/profile/ProfileForm";
import type { RiderProfileBooking } from "@/lib/rider-profile";

/**
 * The rider profile, filled in on the confirmation page itself. This is the
 * moment the customer is most willing to help: they have just paid, the page is
 * open, and nothing else is competing for their attention. A button to another
 * page would cost most of that.
 *
 * The booking may not exist yet when the browser lands here, because Stripe's
 * redirect races its own webhook. Rather than hide the form, we wait for it:
 * the endpoint answers 202 until Airtable has the record, and we ask again a
 * few times before giving up and pointing at the email.
 */
const RETRY_DELAY_MS = 1500;
const MAX_ATTEMPTS = 8;

export default function InlineProfile({
  sessionId,
  initialBooking,
  initialToken,
}: {
  sessionId?: string;
  initialBooking?: RiderProfileBooking;
  initialToken?: string;
}) {
  const [booking, setBooking] = useState(initialBooking ?? null);
  const [token, setToken] = useState(initialToken ?? "");
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (booking || !sessionId) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/rider-profile?session_id=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
          setToken(data.token);
          return;
        }
        if (res.status !== 202) {
          setGaveUp(true);
          return;
        }
      } catch {
        /* network hiccup: just try again */
      }
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setGaveUp(true);
        return;
      }
      setTimeout(poll, RETRY_DELAY_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [booking, sessionId]);

  if (booking && token) {
    return (
      <div className="text-left mb-8">
        <h2 className="text-[#1a1a17] text-xl font-semibold mb-1.5">One quick thing</h2>
        <p className="text-[#6e6a5e] text-sm leading-relaxed mb-5">
          A photo of your motorcycle license and a number to reach you on. We check the license
          before you arrive, so pickup is keys and go. None of it is required, and you can come back
          to it later from the link in your email.
        </p>
        <ProfileForm booking={booking} token={token} />
      </div>
    );
  }

  if (gaveUp || !sessionId) {
    return (
      <div className="bg-[#f7f2e6] border border-[#e6dcc4] rounded-sm p-6 text-left mb-8">
        <p className="text-[#1a1a17] font-semibold mb-1.5">One quick thing, by email</p>
        <p className="text-[#5b5b58] text-sm leading-relaxed">
          Your confirmation email has a link to send us a photo of your motorcycle license and a
          number to reach you on. Two minutes, and nothing in it is required.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e8e3d3] rounded-sm p-6 text-left mb-8">
      <div className="flex items-center gap-3 text-sm text-[#6e6a5e]">
        <div className="w-4 h-4 border-2 border-[#d9a32b] border-t-transparent rounded-full animate-spin" />
        Finalising your booking…
      </div>
    </div>
  );
}
