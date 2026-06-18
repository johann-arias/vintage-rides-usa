import type { Bike } from "@/lib/airtable";

/**
 * Checkbox grid to pin specific bikes to a booking. Pure server component —
 * each box submits `name="bike"` with the Bike Name; the server reads
 * `formData.getAll("bike")`. Selection highlight uses CSS `:has(:checked)`,
 * no client JS.
 */
export function BikePicker({
  bikes,
  selected = [],
}: {
  bikes: Bike[];
  selected?: string[];
}) {
  const sel = new Set(selected);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {bikes.map((b) => (
        <label
          key={b.id}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-white px-3 py-2 text-sm transition-colors hover:bg-[var(--brand-cream)] has-checked:border-[var(--brand-olive-700)] has-checked:bg-[var(--brand-olive-700)]/10"
        >
          <input
            type="checkbox"
            name="bike"
            value={b.name}
            defaultChecked={sel.has(b.name)}
            className="size-4 accent-[var(--brand-olive-700)]"
          />
          <span className="truncate font-medium">
            {b.name.replace(/^Himalayan 450 #?/, "") || b.name}
          </span>
          {b.status !== "Available" ? (
            <span className="ml-auto text-[0.65rem] text-muted-foreground">
              {b.status === "In Maintenance" ? "maint." : b.status}
            </span>
          ) : null}
        </label>
      ))}
    </div>
  );
}
