import Link from "next/link";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { getAllBookings, type AdminBooking } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cancelBookingAction,
  acceptBookingRequestAction,
  declineBookingRequestAction,
} from "../actions";

export const dynamic = "force-dynamic";

function channelBadge(channel: AdminBooking["channel"]) {
  if (channel === "B2B") {
    return (
      <Badge className="bg-[var(--brand-olive-700)]/12 text-[var(--brand-olive-700)]">
        B2B
      </Badge>
    );
  }
  return <Badge className="bg-[var(--brand-amber)]/18 text-[#8a6516]">Website</Badge>;
}

function statusBadge(status: AdminBooking["status"]) {
  if (status === "Cancelled")
    return <Badge variant="destructive">Cancelled</Badge>;
  if (status === "Completed")
    return <Badge variant="secondary">Completed</Badge>;
  if (status === "Pending Payment")
    return <Badge className="bg-[#b34b00]/12 text-[#b34b00]">Same-day request</Badge>;
  return (
    <Badge className="bg-[var(--brand-olive-700)]/12 text-[var(--brand-olive-700)]">
      {status}
    </Badge>
  );
}

function fmt(d: string) {
  try {
    return format(new Date(d), "d MMM yyyy");
  } catch {
    return d;
  }
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    cancelled?: string;
    updated?: string;
    accepted?: string;
    declined?: string;
    decision_error?: string;
  }>;
}) {
  const { created, cancelled, updated, accepted, declined, decision_error } = await searchParams;
  const bookings = await getAllBookings();
  const pendingCount = bookings.filter((b) => b.status === "Pending Payment").length;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-[var(--brand-olive-700)]">
            Reservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Website and B2B rental bookings ({bookings.length})
          </p>
        </div>
        <Button render={<Link href="/garage/bookings/new" />}>
          <PlusCircle className="size-4" />
          Add B2B booking
        </Button>
      </header>

      {decision_error ? (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          Couldn&apos;t complete that action: {decision_error}
        </p>
      ) : null}
      {accepted ? (
        <p className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-800">
          Request accepted — payment captured and the customer confirmed.
        </p>
      ) : null}
      {declined ? (
        <p className="mb-4 rounded-lg border border-[#e8d9b0] bg-[#faf5ea] px-4 py-2.5 text-sm text-[#8a6516]">
          Request declined — hold released and the customer notified.
        </p>
      ) : null}
      {pendingCount > 0 ? (
        <p className="mb-4 rounded-lg border border-[#b34b00]/30 bg-[#b34b00]/10 px-4 py-2.5 text-sm font-medium text-[#b34b00]">
          {pendingCount} same-day request{pendingCount > 1 ? "s" : ""} awaiting your decision — accept to charge, decline to release.
        </p>
      ) : null}
      {created ? (
        <p className="mb-4 rounded-lg border border-[var(--brand-olive-700)]/30 bg-[var(--brand-olive-700)]/10 px-4 py-2.5 text-sm text-[var(--brand-olive-700)]">
          B2B booking created and bikes blocked.
        </p>
      ) : null}
      {updated ? (
        <p className="mb-4 rounded-lg border border-[var(--brand-olive-700)]/30 bg-[var(--brand-olive-700)]/10 px-4 py-2.5 text-sm text-[var(--brand-olive-700)]">
          Booking updated.
        </p>
      ) : null}
      {cancelled ? (
        <p className="mb-4 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
          Booking cancelled, bikes freed.
        </p>
      ) : null}

      {bookings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No bookings yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[var(--brand-cream)] text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 text-center font-medium">Bikes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{channelBadge(b.channel)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.customerName || "—"}</div>
                    {b.partnerPlatform ? (
                      <div className="text-xs text-muted-foreground">
                        {b.partnerPlatform}
                      </div>
                    ) : b.email ? (
                      <div className="text-xs text-muted-foreground">{b.email}</div>
                    ) : null}
                    {/* Website bookings only: B2B rows never had a profile to fill. */}
                    {b.channel === "WEBSITE" && b.status !== "Cancelled" ? (
                      b.riderProfileCompletedAt ? (
                        <div className="mt-0.5 text-[0.7rem] text-[var(--brand-olive-700)]">
                          Rider details in
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[0.7rem] text-[#9a3b21]">
                          Rider details missing
                        </div>
                      )
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {fmt(b.startDate)} → {fmt(b.endDate)}
                    {b.pickupTime || b.dropoffTime ? (
                      <div className="text-[0.7rem] text-muted-foreground">
                        Pickup {b.pickupTime ?? "—"} · Drop-off {b.dropoffTime ?? "—"}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{b.numberOfBikes}</span>
                    {b.assignedBikes.length > 0 ? (
                      <div className="text-[0.7rem] whitespace-nowrap text-muted-foreground">
                        {b.assignedBikes
                          .map((n) => n.replace("Himalayan 450 ", ""))
                          .join(", ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {b.status === "Pending Payment" ? (
                      <>
                        <form action={acceptBookingRequestAction} className="inline">
                          <input type="hidden" name="bookingId" value={b.bookingId} />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-[#2e7d32] text-white hover:bg-[#276b2b]"
                          >
                            Accept
                          </Button>
                        </form>
                        <form action={declineBookingRequestAction} className="inline">
                          <input type="hidden" name="bookingId" value={b.bookingId} />
                          <Button type="submit" variant="ghost" size="sm" className="text-[#b3261e]">
                            Decline
                          </Button>
                        </form>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/garage/bookings/${b.id}/edit`} />}
                        >
                          Edit
                        </Button>
                        {b.status !== "Cancelled" ? (
                          <form action={cancelBookingAction} className="inline">
                            <input type="hidden" name="bookingId" value={b.bookingId} />
                            <Button type="submit" variant="ghost" size="sm">
                              Cancel
                            </Button>
                          </form>
                        ) : null}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
