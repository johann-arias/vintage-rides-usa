import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import type { PlanningBlock, PlanningTour } from "@/lib/airtable";

export const TOTAL_BIKES = 10;

export interface DayCapacity {
  date: string; // yyyy-MM-dd
  committedTours: number;
  committedRentals: number;
  committedMaintenance: number;
  free: number;
}

function covers(start: string, end: string, day: string): boolean {
  // Inclusive on both ends: a bike committed start..end is unavailable every day
  // in that span. Conservative by design — never overstate availability.
  return start <= day && day <= end;
}

/**
 * Per-day capacity for a calendar month. Mirrors the public availability logic:
 * free = 10 − tour pilots − non-cancelled RENTAL/MAINTENANCE blocks.
 */
export function buildMonthCapacity(
  monthDate: Date,
  tours: PlanningTour[],
  blocks: PlanningBlock[]
): DayCapacity[] {
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  });

  return days.map((d) => {
    const day = format(d, "yyyy-MM-dd");

    const committedTours = tours.reduce(
      (sum, t) => (covers(t.startDate, t.endDate, day) ? sum + t.pilots : sum),
      0
    );

    let committedRentals = 0;
    let committedMaintenance = 0;
    for (const b of blocks) {
      if (!covers(b.startDate, b.endDate, day)) continue;
      if (b.type === "MAINTENANCE") committedMaintenance += 1;
      else committedRentals += 1; // RENTAL / HOLD / tour blocks all consume a bike
    }

    const free = Math.max(
      0,
      TOTAL_BIKES - committedTours - committedRentals - committedMaintenance
    );
    return { date: day, committedTours, committedRentals, committedMaintenance, free };
  });
}

/** Tailwind classes for a day cell based on how many bikes are free. */
export function freeTone(free: number): string {
  if (free <= 0) return "bg-destructive/10 text-destructive border-destructive/20";
  if (free <= 3) return "bg-[var(--brand-amber)]/15 text-[#8a6516] border-[var(--brand-amber)]/30";
  return "bg-[var(--brand-olive-700)]/10 text-[var(--brand-olive-700)] border-[var(--brand-olive-700)]/20";
}
