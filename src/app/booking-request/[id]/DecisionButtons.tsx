"use client";

import { useState } from "react";

type Outcome = { status?: string; alreadyResolved?: boolean; error?: string } | null;

export default function DecisionButtons({
  bookingId,
  acceptToken,
  declineToken,
  initialStatus,
}: {
  bookingId: string;
  acceptToken: string;
  declineToken: string;
  initialStatus?: "Confirmed" | "Declined" | null;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"Confirmed" | "Declined" | null>(initialStatus ?? null);
  const [error, setError] = useState("");

  async function decide(action: "accept" | "decline") {
    setBusy(action);
    setError("");
    try {
      const res = await fetch("/api/bookings/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action,
          token: action === "accept" ? acceptToken : declineToken,
        }),
      });
      const data: Outcome = await res.json();
      if (!res.ok || !data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(data.status === "Confirmed" ? "Confirmed" : "Declined");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (done === "Confirmed") {
    return (
      <div className="rounded-sm border border-green-200 bg-green-50 px-5 py-5 text-sm text-green-800">
        <p className="font-semibold mb-1">Accepted — payment captured.</p>
        <p>The customer&apos;s card has been charged and their confirmation email is on its way.</p>
      </div>
    );
  }
  if (done === "Declined") {
    return (
      <div className="rounded-sm border border-[#e8d9b0] bg-[#faf5ea] px-5 py-5 text-sm text-[#6e6a5e]">
        <p className="font-semibold text-[#1a1a17] mb-1">Declined — hold released.</p>
        <p>The authorization was cancelled (no charge) and the customer has been notified.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => decide("accept")}
          disabled={busy !== null}
          className="flex-[2] bg-[#2e7d32] hover:bg-[#276b2b] disabled:opacity-60 text-white font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
        >
          {busy === "accept" ? "Capturing payment…" : "Accept & charge"}
        </button>
        <button
          onClick={() => decide("decline")}
          disabled={busy !== null}
          className="flex-1 border border-[#c9a99f] text-[#b3261e] hover:bg-red-50 disabled:opacity-60 font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
        >
          {busy === "decline" ? "Releasing…" : "Decline & release"}
        </button>
      </div>
    </div>
  );
}
