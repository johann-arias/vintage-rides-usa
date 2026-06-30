import Link from "next/link";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { getAllBookings, type AdminBooking } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelBookingAction } from "../actions";

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
  searchParams: Promise<{ created?: string; cancelled?: string; updated?: string }>;
}) {
  const { created, cancelled, updated } = await searchParams;
  const bookings = await getAllBookings();

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
