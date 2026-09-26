// Booking window rules shared by the client date picker and the server guards.
//
// Same-day rentals ARE bookable online, but as a "request to book": the card is
// authorized (a hold) at checkout and only captured once the team confirms a
// bike is ready. Advance bookings (tomorrow onward) are charged immediately as
// usual. All date reasoning is done in Rapid City local time, where the bikes
// actually are.

export const RAPID_CITY_TZ = "America/Denver";

// How long a same-day request may sit before it auto-releases (hold cancelled,
// bike freed, customer notified). Kept short because same-day means today.
export const SAME_DAY_REQUEST_EXPIRY_HOURS = 3;

// Sturgis Rally week, as MM-DD (2027: Aug 6-15). The PRICE comes from the
// Airtable rule "Sturgis Rally" ($200/day, 3-day minimum since 2026-09-26);
// this constant only drives the suggested dates on /book and the demand read
// in the garage. Update both each year to the official rally dates.
export const RALLY_WEEK = { start: "08-06", end: "08-15" } as const;

// Format a Date as YYYY-MM-DD in a given IANA timezone. en-CA yields ISO order.
function ymdInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Shift a YYYY-MM-DD string by N days (noon anchor avoids DST edge slips).
export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// Today's date in Rapid City (America/Denver), as YYYY-MM-DD.
export function todayInRapidCity(): string {
  return ymdInTz(new Date(), RAPID_CITY_TZ);
}

// Earliest pickup date the site accepts at all (today — same-day allowed).
export function earliestBookableDate(): string {
  return todayInRapidCity();
}

// True when the requested pickup is today in Rapid City — i.e. a same-day
// request that must be authorized-then-captured rather than charged outright.
export function isSameDay(startDate: string): boolean {
  return startDate === todayInRapidCity();
}

// True when the requested pickup is already in the past — never bookable.
export function isPast(startDate: string): boolean {
  return startDate < todayInRapidCity();
}
