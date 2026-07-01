// Booking window rules shared by the client date picker and the server guards.
//
// Same-day rentals are NOT self-service bookable on the site: they require
// prepping a bike on short notice, so we route them to the team "on demand"
// (phone / WhatsApp / email). The earliest date a customer can self-book is
// tomorrow, evaluated in Rapid City local time (where the bikes actually are).

export const RAPID_CITY_TZ = "America/Denver";

// Minimum lead time before a self-service pickup, in days. 1 = no same-day.
export const MIN_LEAD_DAYS = 1;

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

// Earliest pickup date a customer can self-book (tomorrow in Rapid City).
export function earliestBookableDate(): string {
  return addDays(todayInRapidCity(), MIN_LEAD_DAYS);
}

// True when the requested pickup is today or already past — i.e. a same-day
// (or invalid) request that must be handled on demand rather than self-booked.
export function isSameDayOrPast(startDate: string): boolean {
  return startDate < earliestBookableDate();
}
