// One-tap date suggestions for /book.
//
// Why they exist: nine visitors out of ten arriving from an ad left without
// ever touching a date field, so they never saw a price at all. The first
// suggestion is applied on arrival, which means the page opens on a real quote
// instead of an empty form, and the others are one tap away.
//
// The shape of the suggestions comes from the search log, not from taste:
// Friday is the most requested pickup day and the median rental is two days.
// Today is never suggested. A same-day pickup is a request-to-book (card
// authorized, team confirms) which is a poor thing to hand someone who has not
// asked for it, so the nearest suggestion sits at least MIN_LEAD_DAYS out.

import { addDays, todayInRapidCity, RALLY_WEEK } from "./booking-window";

/** Never suggest a pickup closer than this many days out. */
export const MIN_LEAD_DAYS = 2;

export interface DatePreset {
  /** Stable analytics id. */
  key: string;
  /** Chip label. */
  label: string;
  /** Human date range under the label, e.g. "Aug 7 to 9". */
  hint: string;
  startDate: string;
  endDate: string;
  /** Billed days, same definition as the pricing engine. */
  days: number;
}

// Noon anchor: a bare YYYY-MM-DD parses as UTC midnight, which lands on the
// previous day in any negative-offset zone. Noon is safe everywhere.
function at(ymd: string): Date {
  return new Date(`${ymd}T12:00:00Z`);
}

function weekday(ymd: string): number {
  return at(ymd).getUTCDay(); // 0 Sunday … 5 Friday
}

/** The first Friday at least `minLead` days after `from`. */
export function nextFriday(from: string, minLead = MIN_LEAD_DAYS): string {
  let d = addDays(from, minLead);
  while (weekday(d) !== 5) d = addDays(d, 1);
  return d;
}

const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

/** "Aug 7 to 9" within a month, "Aug 30 to Sep 2" across one. */
function rangeHint(start: string, end: string): string {
  const from = MONTH_DAY.format(at(start));
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const to = sameMonth ? String(Number(end.slice(8, 10))) : MONTH_DAY.format(at(end));
  return `${from} to ${to}`;
}

function preset(key: string, label: string, startDate: string, days: number): DatePreset {
  const endDate = addDays(startDate, days);
  return { key, label, hint: rangeHint(startDate, endDate), startDate, endDate, days };
}

/** True when [start, end] touches any day of rally week, in any year. */
export function touchesRallyWeek(startDate: string, endDate: string): boolean {
  let cursor = startDate;
  // A rental is a few weeks at most; the cap only guards against bad input.
  for (let i = 0; i <= 400 && cursor <= endDate; i++) {
    const mmdd = cursor.slice(5);
    if (mmdd >= RALLY_WEEK.start && mmdd <= RALLY_WEEK.end) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

/**
 * The suggestions, in the order they are shown. The first one is the default
 * applied on arrival. Must be called on the client: /book is prerendered, so
 * anything computed at module scope or during the server render would be
 * frozen at build time.
 */
export function buildDatePresets(today: string = todayInRapidCity()): DatePreset[] {
  const friday = nextFriday(today);
  const weekend = preset("weekend", "Weekend", friday, 2);
  // A weekend that lands inside rally week is worth naming, since not charging
  // extra that week is the whole point of our pricing.
  if (touchesRallyWeek(weekend.startDate, weekend.endDate)) weekend.label = "Rally weekend";

  const presets = [
    weekend,
    preset("three_days", "3 days", friday, 3),
    preset("week", "A week", friday, 7),
  ];

  // Rally weekend as its own shortcut, while it is still ahead of us and not
  // already one of the suggestions above. Only ever the current year: next
  // year's rally dates are not ours to guess.
  const rallyStart = `${today.slice(0, 4)}-${RALLY_WEEK.start}`;
  if (today < rallyStart && !presets.some((p) => p.startDate === rallyStart)) {
    presets.push(preset("rally", "Rally weekend", rallyStart, 2));
  }

  return presets;
}
