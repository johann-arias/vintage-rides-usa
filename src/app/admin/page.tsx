import Link from "next/link";
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  parse,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import {
  getBlocksForPlanning,
  getToursForPlanning,
  getBookingsForPlanning,
  type AdminBooking,
  type PlanningTour,
} from "@/lib/airtable";
import { buildMonthCapacity, freeTone, TOTAL_BIKES } from "@/lib/planning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelBookingAction } from "./actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function channelBadge(channel: AdminBooking["channel"]) {
  if (channel === "B2B") {
    return (
      <Badge className="bg-[var(--brand-olive-700)]/12 text-[var(--brand-olive-700)]">
        B2B
      </Badge>
    );
  }
  return (
    <Badge className="bg-[var(--brand-amber)]/18 text-[#8a6516]">Website</Badge>
  );
}

function fmtRange(start: string, end: string) {
  try {
    return `${format(new Date(start), "d MMM")} → ${format(new Date(end), "d MMM yyyy")}`;
  } catch {
    return `${start} → ${end}`;
  }
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const today = new Date();
  const monthDate = month
    ? parse(`${month}-01`, "yyyy-MM-dd", new Date())
    : startOfMonth(today);

  const from = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const to = format(endOfMonth(monthDate), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  const [tours, blocks, bookings] = await Promise.all([
    getToursForPlanning(from, to),
    getBlocksForPlanning(from, to),
    getBookingsForPlanning(from, to),
  ]);

  const capacity = buildMonthCapacity(monthDate, tours, blocks);
  const byDate = new Map(capacity.map((c) => [c.date, c]));

  const prevMonth = format(addMonths(monthDate, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  // Monday-first leading blanks.
  const firstDow = (getDay(startOfMonth(monthDate)) + 6) % 7;

  // Unified reservation list for the displayed month: tours + rentals, by start.
  type Row =
    | { kind: "tour"; data: PlanningTour }
    | { kind: "booking"; data: AdminBooking };
  const rows: Row[] = [
    ...tours.map((t) => ({ kind: "tour" as const, data: t })),
    ...bookings
      .filter((b) => b.status !== "Cancelled")
      .map((b) => ({ kind: "booking" as const, data: b })),
  ].sort((a, b) => a.data.startDate.localeCompare(b.data.startDate));

  const todayCap = byDate.get(todayStr);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-[var(--brand-olive-700)]">
            Planning
          </h1>
          <p className="text-sm text-muted-foreground">
            Fleet of {TOTAL_BIKES} bikes · availability across all channels
            {todayCap ? ` · ${todayCap.free} free today` : ""}
          </p>
        </div>
        <Button render={<Link href="/admin/bookings/new" />}>
          <PlusCircle className="size-4" />
          Add B2B booking
        </Button>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="sm" render={<Link href={`/admin?month=${prevMonth}`} />}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="font-serif text-lg">{format(monthDate, "MMMM yyyy")}</h2>
          <Button variant="outline" size="sm" render={<Link href={`/admin?month=${nextMonth}`} />}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {capacity.map((c) => {
            const isToday = c.date === todayStr;
            const committed =
              c.committedTours + c.committedRentals + c.committedMaintenance;
            return (
              <div
                key={c.date}
                className={`flex min-h-16 flex-col rounded-lg border p-1.5 ${freeTone(
                  c.free
                )} ${isToday ? "ring-2 ring-[var(--brand-amber)]" : ""}`}
              >
                <span className="text-xs font-semibold">
                  {Number(c.date.slice(-2))}
                </span>
                <span className="mt-auto text-[0.7rem] leading-tight font-medium">
                  {c.free}/{TOTAL_BIKES} free
                </span>
                {committed > 0 ? (
                  <span className="text-[0.6rem] leading-tight text-muted-foreground">
                    {c.committedTours > 0 ? `${c.committedTours}T ` : ""}
                    {c.committedRentals > 0 ? `${c.committedRentals}R ` : ""}
                    {c.committedMaintenance > 0 ? `${c.committedMaintenance}M` : ""}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span><b>T</b> tour pilots</span>
          <span><b>R</b> rentals (website + B2B)</span>
          <span><b>M</b> maintenance</span>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg">
          Reservations in {format(monthDate, "MMMM")}
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No tours or rentals this month.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              if (row.kind === "tour") {
                const t = row.data;
                return (
                  <li
                    key={`tour-${t.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
                  >
                    <Badge className="bg-[var(--brand-olive)]/15 text-[var(--brand-olive)]">
                      Freedom Tour
                    </Badge>
                    <span className="font-mono text-sm font-medium">{t.idTour}</span>
                    <span className="text-sm text-muted-foreground">
                      {fmtRange(t.startDate, t.endDate)}
                    </span>
                    <span className="ml-auto text-sm font-medium">
                      {t.pilots} bike{t.pilots > 1 ? "s" : ""}
                    </span>
                  </li>
                );
              }
              const b = row.data;
              return (
                <li
                  key={`bk-${b.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
                >
                  {channelBadge(b.channel)}
                  <span className="text-sm font-medium">
                    {b.customerName || "—"}
                    {b.partnerPlatform ? (
                      <span className="text-muted-foreground"> · {b.partnerPlatform}</span>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {fmtRange(b.startDate, b.endDate)}
                  </span>
                  <span className="ml-auto text-sm font-medium">
                    {b.numberOfBikes} bike{b.numberOfBikes > 1 ? "s" : ""}
                  </span>
                  <form action={cancelBookingAction}>
                    <input type="hidden" name="bookingId" value={b.bookingId} />
                    <Button type="submit" variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
