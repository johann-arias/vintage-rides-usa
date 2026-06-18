import { getAllBikes, getActivePricingRules } from "@/lib/airtable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createMaintenanceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ maint?: string; error?: string }>;
}) {
  const { maint, error } = await searchParams;
  const [bikes, pricing] = await Promise.all([
    getAllBikes(),
    getActivePricingRules(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-serif text-2xl text-[var(--brand-olive-700)]">
          Fleet &amp; maintenance
        </h1>
        <p className="text-sm text-muted-foreground">
          {bikes.length} active bikes · pricing rules · block bikes for service
        </p>
      </header>

      {maint ? (
        <p className="rounded-lg border border-[var(--brand-olive-700)]/30 bg-[var(--brand-olive-700)]/10 px-4 py-2.5 text-sm text-[var(--brand-olive-700)]">
          Maintenance block created.
        </p>
      ) : null}
      {error === "dates" ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          The end date must be on or after the start date.
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 font-serif text-lg">Block bikes for maintenance</h2>
        <form
          action={createMaintenanceAction}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="startDate">From *</Label>
            <Input id="startDate" name="startDate" type="date" required className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">To *</Label>
            <Input id="endDate" name="endDate" type="date" required className="bg-white" />
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
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Block
            </Button>
          </div>
          <div className="space-y-1.5 sm:col-span-4">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="Service, repair…"
              className="bg-white"
            />
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg">Pricing rules</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[var(--brand-cream)] text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 text-right font-medium">Rate / day</th>
                <th className="px-4 py-3 text-center font-medium">Min days</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{p.seasonName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.seasonStart && p.seasonEnd
                      ? `${p.seasonStart} → ${p.seasonEnd}`
                      : "All year"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${p.dailyRateUsd}
                  </td>
                  <td className="px-4 py-3 text-center">{p.minRentalDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Edit rates directly in the Airtable USA_Pricing table.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg">Bikes</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {bikes.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                <Badge className="bg-[var(--brand-olive-700)]/12 text-[var(--brand-olive-700)]">
                  {b.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {b.year} · {b.color || "—"}
              </p>
              <form
                action={updateBikeMileageAction}
                className="mt-2 flex items-center gap-1.5"
              >
                <input type="hidden" name="bikeId" value={b.id} />
                <Input
                  name="miles"
                  type="number"
                  min={0}
                  defaultValue={b.mileage}
                  aria-label={`Mileage for ${b.name}`}
                  className="h-8 w-24 bg-white"
                />
                <span className="text-xs text-muted-foreground">mi</span>
                <Button type="submit" variant="ghost" size="sm" className="ml-auto">
                  Save
                </Button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
