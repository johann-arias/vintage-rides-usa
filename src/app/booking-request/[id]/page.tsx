import { getBookingForDecision } from "@/lib/airtable";
import { verifyBookingToken, signBookingToken, type BookingDecision } from "@/lib/booking-token";
import { SAME_DAY_REQUEST_EXPIRY_HOURS } from "@/lib/booking-window";
import DecisionButtons from "./DecisionButtons";

export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf5ea] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="text-white text-sm tracking-[0.18em] uppercase font-semibold bg-[#111110] inline-block px-5 py-3 rounded-sm">
            VINTAGE RIDES <span className="text-[#c8a45a] font-normal">USA</span>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

export default async function BookingRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string; token?: string }>;
}) {
  const { id } = await params;
  const { action: rawAction, token } = await searchParams;
  const action = (rawAction === "decline" ? "decline" : "accept") as BookingDecision;

  // The link's token must validate for the action it points at.
  if (!verifyBookingToken(id, action, token)) {
    return (
      <Shell>
        <div className="rounded-sm border border-red-200 bg-red-50 px-6 py-6 text-center">
          <h1 className="text-lg font-semibold text-red-700 mb-1">Invalid or expired link</h1>
          <p className="text-sm text-red-600">
            This action link isn&apos;t valid anymore. Open the booking from the garage instead.
          </p>
        </div>
      </Shell>
    );
  }

  const booking = await getBookingForDecision(id);
  if (!booking) {
    return (
      <Shell>
        <div className="rounded-sm border border-[#e8e3d3] bg-white px-6 py-6 text-center">
          <h1 className="text-lg font-semibold text-[#1a1a17] mb-1">Booking not found</h1>
          <p className="text-sm text-[#6e6a5e]">We couldn&apos;t find request {id}.</p>
        </div>
      </Shell>
    );
  }

  const resolved =
    booking.status !== "Pending Payment"
      ? booking.status === "Cancelled"
        ? "Declined"
        : "Confirmed"
      : null;

  // The page holds the secret, so it can mint both tokens for the buttons.
  const acceptToken = signBookingToken(id, "accept");
  const declineToken = signBookingToken(id, "decline");

  return (
    <Shell>
      <div className="rounded-sm border border-[#e8e3d3] bg-white overflow-hidden">
        <div className="bg-[#b34b00] px-6 py-4">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#ffd9b3]">
            Same-day request
          </p>
          <p className="text-white text-lg font-light mt-1">
            {booking.firstName} {booking.lastName}
          </p>
        </div>

        <div className="px-6 py-5 space-y-2.5 text-sm">
          {[
            ["Reference", booking.bookingId],
            ["Pickup", `${fmtDate(booking.startDate)}${booking.pickupTime ? ` · ${booking.pickupTime}` : ""}`],
            ["Return", `${fmtDate(booking.endDate)}${booking.dropoffTime ? ` · ${booking.dropoffTime}` : ""}`],
            ["Bikes", String(booking.numberOfBikes)],
            ["Email", booking.email || "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-[#f0ebdd] pb-2.5 last:border-0">
              <span className="text-[#6e6a5e]">{label}</span>
              <span className="text-[#1a1a17] font-medium text-right">{value}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 pt-1">
            <span className="text-[#6e6a5e]">Authorized (hold)</span>
            <span className="text-[#1a1a17] font-bold">{fmtMoney(booking.totalPrice)}</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          {resolved ? (
            <div className="rounded-sm border border-[#e8d9b0] bg-[#faf5ea] px-5 py-5 text-sm text-[#6e6a5e]">
              This request has already been{" "}
              <strong className="text-[#1a1a17]">
                {resolved === "Confirmed" ? "accepted (payment captured)" : "declined (hold released)"}
              </strong>
              . No further action needed.
            </div>
          ) : (
            <>
              <p className="text-xs text-[#6e6a5e] mb-4 leading-relaxed">
                Accepting captures the {fmtMoney(booking.totalPrice)} hold and sends the customer their
                confirmation. Declining releases the hold (no charge) and notifies them. If nobody acts, the
                hold auto-releases after {SAME_DAY_REQUEST_EXPIRY_HOURS} hours.
              </p>
              <DecisionButtons
                bookingId={booking.bookingId}
                acceptToken={acceptToken}
                declineToken={declineToken}
              />
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
