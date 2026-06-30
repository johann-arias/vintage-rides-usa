import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingByRecordId, getAssignableBikes } from "@/lib/airtable";
import { BACKOFFICE_TIME_OPTIONS } from "@/lib/location";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BikePicker } from "@/components/admin/BikePicker";
import { updateBookingAction } from "../../../actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  missing: "A customer name and both dates are required.",
  dates: "The end date must be on or after the start date.",
};

const STATUSES = [
  "Pending Payment",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function EditBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [booking, bikes] = await Promise.all([
    getBookingByRecordId(id),
    getAssignableBikes(),
  ]);
  if (!booking) notFound();

  const isB2B = booking.channel === "B2B";

  // Include the booking's stored time even if it's not one of the standard
  // options, so the select shows the real value instead of silently resetting.
  const timeOptions = (current?: string) =>
    current && !BACKOFFICE_TIME_OPTIONS.includes(current)
      ? [current, ...BACKOFFICE_TIME_OPTIONS]
      : BACKOFFICE_TIME_OPTIONS;

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl text-[var(--brand-olive-700)]">
            Edit booking
          </h1>
          <Badge
            className={
              isB2B
                ? "bg-[var(--brand-olive-700)]/12 text-[var(--brand-olive-700)]"
                : "bg-[var(--brand-amber)]/18 text-[#8a6516]"
            }
          >
            {isB2B ? "B2B" : "Website"}
          </Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {booking.bookingId}
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}

      <form
        action={updateBookingAction}
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <input type="hidden" name="recordId" value={id} />

        {isB2B ? (
          <div className="space-y-1.5">
            <Label htmlFor="platform">Partner platform</Label>
            <Input
              id="platform"
              name="platform"
              defaultValue={booking.partnerPlatform ?? ""}
              className="bg-white"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" defaultValue={booking.firstName} className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" defaultValue={booking.lastName} className="bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={booking.email ?? ""} className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={booking.phone ?? ""} className="bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={booking.startDate} required className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" name="endDate" type="date" defaultValue={booking.endDate} required className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" defaultValue={booking.status} className={selectClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pickupTime">Pickup time</Label>
            <select
              id="pickupTime"
              name="pickupTime"
              defaultValue={booking.pickupTime ?? ""}
              className={selectClass}
            >
              <option value="">Not set</option>
              {timeOptions(booking.pickupTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dropoffTime">Drop-off time</Label>
            <select
              id="dropoffTime"
              name="dropoffTime"
              defaultValue={booking.dropoffTime ?? ""}
              className={selectClass}
            >
              <option value="">Not set</option>
              {timeOptions(booking.dropoffTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bikes">Number of bikes</Label>
          <select id="bikes" name="bikes" defaultValue={String(booking.numberOfBikes)} className={selectClass}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            If you pin more specific bikes below than this number, the count is
            bumped to match.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Assign specific bikes (optional)</Label>
          <BikePicker bikes={bikes} selected={booking.assignedBikes} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={booking.notes ?? ""} className="bg-white" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" render={<Link href="/garage/bookings" />}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
