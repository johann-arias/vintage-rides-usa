// The rider profile: everything we need for the ride that is not needed to take
// the money.
//
// The booking form used to ask for a licence number, an emergency contact and a
// phone before payment, on a phone screen, from someone who had not yet decided
// to trust us. That was the heaviest question on the page and it sat right in
// front of the card form. Now the deal is: pay first, tell us the rest after.
//
// Nothing here blocks a rental. A profile that is never filled in just means the
// team collects it at the counter, which is where the licence gets checked
// anyway. It only has to be easy enough that most people do it themselves.

import base, { Tables } from "@/lib/airtable";
import {
  MAX_LICENSE_PHOTO_BYTES,
  LICENSE_PHOTO_TYPES,
  type LicensePhotoUpload,
  type RiderProfileInput,
} from "@/lib/rider-profile-options";

export type { RiderProfileInput, LicensePhotoUpload };

export interface RiderProfileBooking {
  recordId: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  numberOfBikes: number;
  numberOfDays: number;
  totalPrice: number;
  pickupTime: string;
  status: string;
  completedAt: string | null;
  /** Current values, so the form can be edited rather than only filled once. */
  licenseNumber: string;
  specialRequests: string;
  /** True once a licence photo is attached; the file itself never leaves Airtable. */
  hasLicensePhoto: boolean;
}

export async function getRiderProfileBooking(
  bookingId: string
): Promise<RiderProfileBooking | null> {
  const recs = await base(Tables.Bookings)
    .select({ filterByFormula: `{Booking ID} = "${bookingId}"`, maxRecords: 1 })
    .firstPage();
  const r = recs[0];
  if (!r) return null;
  const str = (f: string) => (r.get(f) as string) ?? "";
  return {
    recordId: r.id,
    bookingId,
    firstName: str("First Name"),
    lastName: str("Last Name"),
    email: str("Email"),
    phone: str("Phone"),
    startDate: str("Start Date"),
    endDate: str("End Date"),
    numberOfBikes: (r.get("Number of Bikes") as number) ?? 1,
    numberOfDays: (r.get("Number of Days") as number) ?? 0,
    totalPrice: (r.get("Total Price (USD)") as number) ?? 0,
    pickupTime: str("Pickup Time"),
    status: str("Status"),
    completedAt: str("Rider Profile Completed At") || null,
    licenseNumber: str("Rider License Number"),
    specialRequests: str("Special Requests"),
    hasLicensePhoto: ((r.get("Rider License Photo") as unknown[]) ?? []).length > 0,
  };
}

/**
 * Writes whatever the customer filled in. Every field is optional on purpose: a
 * half-filled profile is worth more than an abandoned one.
 */
export async function saveRiderProfile(
  recordId: string,
  input: RiderProfileInput
): Promise<void> {
  const clean = (v: string | undefined, max = 300) => v?.trim().slice(0, max) || undefined;

  const fields: Record<string, string> = { "Rider Profile Completed At": new Date().toISOString() };
  const phone = clean(input.phone, 40);
  const licence = clean(input.licenseNumber, 60);
  const requests = clean(input.specialRequests, 2000);
  if (phone) fields.Phone = phone;
  if (licence) fields["Rider License Number"] = licence;
  if (requests) fields["Special Requests"] = requests;

  await base(Tables.Bookings).update([{ id: recordId, fields }]);
}

/**
 * Pushes the licence photo into the booking's attachment field.
 *
 * Airtable's content API takes the bytes directly, so the file never needs a
 * public URL of ours and never sits in our own storage: it goes straight from
 * the customer's phone to the record the team already opens at pickup. The SDK
 * has no binding for this endpoint, hence the raw fetch.
 */
export async function attachLicensePhoto(
  recordId: string,
  file: LicensePhotoUpload
): Promise<void> {
  if (!LICENSE_PHOTO_TYPES.includes(file.contentType as (typeof LICENSE_PHOTO_TYPES)[number])) {
    throw new Error(`Unsupported licence photo type: ${file.contentType}`);
  }
  // Base64 inflates by ~4/3; compare on the decoded size.
  if ((file.data.length * 3) / 4 > MAX_LICENSE_PHOTO_BYTES) {
    throw new Error("Licence photo too large");
  }

  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const res = await fetch(
    `https://content.airtable.com/v0/${baseId}/${recordId}/${encodeURIComponent("Rider License Photo")}/uploadAttachment`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: file.contentType,
        file: file.data,
        filename: file.filename.slice(0, 120),
      }),
    }
  );
  if (!res.ok) {
    // Never log the body: it is a photo of someone's driving licence.
    throw new Error(`Airtable attachment upload failed with ${res.status}`);
  }
}

/**
 * Booking id for a Stripe session, so the confirmation page can offer the
 * profile link straight after payment. Returns null while the webhook has not
 * landed yet, which is a normal race for a few seconds and not an error: the
 * same link is in the confirmation email.
 */
export async function getBookingIdBySessionId(sessionId: string): Promise<string | null> {
  const recs = await base(Tables.Bookings)
    .select({
      filterByFormula: `{Stripe Session ID} = "${sessionId}"`,
      fields: ["Booking ID"],
      maxRecords: 1,
    })
    .firstPage();
  return (recs[0]?.get("Booking ID") as string) || null;
}

/** Public URL of the profile form for a booking. */
export function riderProfileUrl(bookingId: string, token: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/booking/${bookingId}/profile?t=${token}`;
}

// ── Reminders ───────────────────────────────────────────────────────────────

/** Days before pickup we nudge someone whose profile is still empty. */
export const REMINDER_DAYS_BEFORE = [3, 1];
/** Never two reminders inside this window, whatever the cron does. */
const REMINDER_COOLDOWN_HOURS = 36;

export interface ProfileReminderTarget {
  recordId: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  pickupTime: string;
  daysUntil: number;
}

/**
 * Confirmed website bookings riding in exactly 3 or 1 days whose rider profile
 * is still empty. Deliberately narrow: a reminder that fires on the wrong day,
 * twice, or for a booking the team already handled is worse than no reminder.
 */
export async function findProfilesToRemind(today: string): Promise<ProfileReminderTarget[]> {
  const targets = REMINDER_DAYS_BEFORE.map((d) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + d);
    return { date: date.toISOString().slice(0, 10), daysUntil: d };
  });

  // DATETIME_FORMAT, not `{Start Date} = "2026-07-31"`: Airtable compares a date
  // field against a string literal as different types and quietly matches
  // nothing, so the naive version returns an empty set every single day.
  const dateClause = targets
    .map((t) => `DATETIME_FORMAT({Start Date}, 'YYYY-MM-DD') = "${t.date}"`)
    .join(", ");
  const records = await base(Tables.Bookings)
    .select({
      // The last clause covers bookings taken by the previous flow, which asked
      // for a licence and an emergency contact up front: their profile stamp is
      // empty but we already hold what we would be asking for, and emailing
      // someone for details they gave us is the fastest way to look sloppy.
      //
      // LEN({Field} & "") rather than {Field} != BLANK(): Airtable evaluates the
      // latter as TRUE on an empty field, which silently matched nothing and
      // would have cancelled every reminder.
      filterByFormula: `AND(
        {Status} = "Confirmed",
        {Rider Profile Completed At} = BLANK(),
        {Email} != BLANK(),
        OR(${dateClause}),
        NOT(AND(LEN({Rider License Number} & "") > 0, LEN({Emergency Contact Name} & "") > 0))
      )`,
      fields: [
        "Booking ID",
        "First Name",
        "Last Name",
        "Email",
        "Start Date",
        "Pickup Time",
        "Rider Profile Reminder Sent At",
      ],
    })
    .all();

  const cooldownEdge = Date.now() - REMINDER_COOLDOWN_HOURS * 3_600_000;
  const out: ProfileReminderTarget[] = [];
  for (const r of records) {
    const bookingId = (r.get("Booking ID") as string) ?? "";
    // B2B rows are the team's own entries; nobody is waiting on a form.
    if (bookingId.startsWith("VR-B2B-")) continue;
    const lastSent = r.get("Rider Profile Reminder Sent At") as string | undefined;
    if (lastSent && new Date(lastSent).getTime() > cooldownEdge) continue;
    const startDate = r.get("Start Date") as string;
    const match = targets.find((t) => t.date === startDate);
    if (!match) continue;
    out.push({
      recordId: r.id,
      bookingId,
      firstName: (r.get("First Name") as string) ?? "",
      lastName: (r.get("Last Name") as string) ?? "",
      email: (r.get("Email") as string) ?? "",
      startDate,
      pickupTime: (r.get("Pickup Time") as string) ?? "",
      daysUntil: match.daysUntil,
    });
  }
  return out;
}

/**
 * Stamped BEFORE sending, like the abandoned-cart lock: a crash costs one
 * missed reminder, never a duplicate in someone's inbox.
 */
export async function markProfileReminderSent(recordId: string): Promise<void> {
  await base(Tables.Bookings).update([
    { id: recordId, fields: { "Rider Profile Reminder Sent At": new Date().toISOString() } },
  ]);
}
