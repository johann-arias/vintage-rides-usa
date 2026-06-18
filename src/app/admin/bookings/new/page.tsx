import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createB2BBookingAction } from "../../actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  missing: "Fill in at least a customer name, the platform, and both dates.",
  dates: "The end date must be on or after the start date.",
};

export default async function NewB2BBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-[var(--brand-olive-700)]">
          Add B2B booking
        </h1>
        <p className="text-sm text-muted-foreground">
          Manually record a reservation received from a partner platform. This
          blocks the bikes so the website and tours can&apos;t double-book them.
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}

      <form
        action={createB2BBookingAction}
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="platform">Partner platform *</Label>
          <Input
            id="platform"
            name="platform"
            placeholder="EagleRider, Riders Share, Twisted Road…"
            required
            className="bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Customer first name</Label>
            <Input id="firstName" name="firstName" className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Customer last name</Label>
            <Input id="lastName" name="lastName" className="bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" className="bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date *</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End date *</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bikes">Bikes *</Label>
            <select
              id="bikes"
              name="bikes"
              defaultValue="1"
              className="h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Platform reference, special requests…"
            className="bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" render={<Link href="/admin/bookings" />}>
            Cancel
          </Button>
          <Button type="submit">Create booking</Button>
        </div>
      </form>
    </div>
  );
}
