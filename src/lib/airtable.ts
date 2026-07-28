import Airtable, { type FieldSet, type Record as AirtableRecord } from "airtable";
import { nanoid } from "nanoid";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY!,
}).base(process.env.AIRTABLE_BASE_ID!);

export const Tables = {
  Bikes: "USA_Bikes",
  Blocks: "USA_Bike_Blocks",
  Bookings: "USA_Rental_Bookings",
  Pricing: "USA_Pricing",
  AvailabilitySearches: "USA_Availability_Searches",
  Tours: "Tours",
  Riders: "Riders",
} as const;

export default base;

// ── Types ──────────────────────────────────────────────────────────────────

export interface Bike {
  id: string;
  name: string;
  serialNumber?: string;
  year: number;
  color: string;
  mileage: number;
  status: "Available" | "In Maintenance" | "Retired";
  notes?: string;
  lastServiceDate?: string;
}

export interface BikeBlock {
  id: string;
  blockId: string;
  type: "GUIDED_TOUR" | "FREEDOM_TOUR" | "RENTAL" | "MAINTENANCE" | "HOLD";
  bikeId: string;
  bookingId?: string;
  tourId?: string;
  startDate: string;
  endDate: string;
  status: "Confirmed" | "Tentative" | "Cancelled";
}

export interface RentalBooking {
  id: string;
  bookingId: string;
  status: "Pending Payment" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  numberOfBikes: number;
  bikeNames?: string;
  totalPrice: number;
  stripeSessionId?: string;
  pickupLocation?: string;
  specialRequests?: string;
}

export interface PricingRule {
  id: string;
  seasonName: string;
  isActive: boolean;
  dailyRateUsd: number;
  minRentalDays: number;
  seasonStart?: string;
  seasonEnd?: string;
  notes?: string;
}

// ── Availability ───────────────────────────────────────────────────────────

/**
 * Returns how many bikes are committed to USA_*F tours overlapping with [start, end].
 * Logic: Tours where ID_TOUR starts with "USA_" and contains "F", overlapping date range,
 * count linked Riders where Type of rider = "Pilot" and Status is an active PAX status.
 */
export async function getBikesCommittedToTours(
  startDate: string,
  endDate: string
): Promise<number> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Fetch USA_*F tours that overlap with the requested period
  // A tour overlaps if: tour.Start tour <= endDate AND tour.End tour >= startDate
  const tourRecords = await base(Tables.Tours)
    .select({
      filterByFormula: `AND(
        FIND("USA_", {ID_TOUR}) > 0,
        FIND("F", {ID_TOUR}) > 0,
        IS_BEFORE({Start tour}, DATEADD("${endDate}", 1, "days")),
        IS_AFTER({End tour}, DATEADD("${startDate}", -1, "days"))
      )`,
      fields: ["ID_TOUR", "Start tour", "End tour", "Riders"],
    })
    .all();

  if (tourRecords.length === 0) return 0;

  // Collect all rider record IDs linked to these overlapping tours
  const riderIds = new Set<string>();
  for (const tour of tourRecords) {
    const linked = tour.get("Riders") as string[] | undefined;
    if (linked) linked.forEach((id) => riderIds.add(id));
  }

  if (riderIds.size === 0) return 0;

  // Count riders with Type of rider = "Pilot" among those IDs
  // Airtable doesn't support RECORD_ID() in filter with list, so we batch
  const idList = Array.from(riderIds);
  const batches = [];
  for (let i = 0; i < idList.length; i += 100) {
    batches.push(idList.slice(i, i + 100));
  }

  let pilotCount = 0;
  for (const batch of batches) {
    const orClauses = batch.map((id) => `RECORD_ID() = "${id}"`).join(", ");
    const records = await base(Tables.Riders)
      .select({
        filterByFormula: `AND(OR(${orClauses}), {Type of rider} = "Pilot")`,
        fields: ["Type of rider"],
      })
      .all();
    pilotCount += records.length;
  }

  return pilotCount;
}

/**
 * Returns how many bikes are blocked by confirmed rentals overlapping [start, end].
 * Excludes blocks tagged as Stripe test-mode sessions so dev bookings don't eat
 * into real availability.
 */
export async function getBikesBlockedByRentals(
  startDate: string,
  endDate: string
): Promise<number> {
  const records = await base(Tables.Blocks)
    .select({
      filterByFormula: `AND(
        {Type} = "RENTAL",
        {Status} != "Cancelled",
        FIND("cs_test_", {Notes}) = 0,
        IS_BEFORE({Start Date}, DATEADD("${endDate}", 1, "days")),
        IS_AFTER({End Date}, DATEADD("${startDate}", -1, "days"))
      )`,
      fields: ["Bike ID"],
    })
    .all();

  return records.length;
}

const TOTAL_BIKES = 10;

// Rentals are open year-round. Best riding is May–Sep; winter rides are weather-dependent.

export async function getAvailableBikeCount(
  startDate: string,
  endDate: string
): Promise<number> {
  const [tourBikes, rentalBikes] = await Promise.all([
    getBikesCommittedToTours(startDate, endDate),
    getBikesBlockedByRentals(startDate, endDate),
  ]);

  return Math.max(0, TOTAL_BIKES - tourBikes - rentalBikes);
}

// ── Pricing ────────────────────────────────────────────────────────────────

export async function getActivePricingRules(): Promise<PricingRule[]> {
  const records = await base(Tables.Pricing)
    .select({
      filterByFormula: `{Is Active} = "Yes"`,
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    seasonName: (r.get("Season Name") as string) ?? "",
    isActive: true,
    dailyRateUsd: (r.get("Daily Rate USD") as number) ?? 0,
    minRentalDays: (r.get("Min Rental Days") as number) ?? 1,
    seasonStart: (r.get("Season Start MM-DD") as string) ?? undefined,
    seasonEnd: (r.get("Season End MM-DD") as string) ?? undefined,
    notes: (r.get("Notes") as string) ?? undefined,
  }));
}

// Numeric ordinal for an MM-DD string, used to compare how wide a season window is.
function mmddOrdinal(mmdd: string): number {
  const [m, d] = mmdd.split("-").map(Number);
  return m * 31 + d;
}

// Picks the pricing rule for a rental spanning [startDate, endDate] (inclusive).
// Any day the rental touches a special window (e.g. Sturgis Rally) makes that
// window apply to the WHOLE rental, so a rental that merely clips the rally
// still gets the surge rate, not just one that starts inside it.
export function getPriceForDate(
  startDate: Date,
  endDate: Date,
  rules: PricingRule[]
): PricingRule {
  const matching = new Map<string, PricingRule>();
  const cursor = new Date(startDate);
  // Cap the walk defensively; a rental is at most a few weeks in practice.
  for (let i = 0; i <= 400 && cursor <= endDate; i++) {
    const mmdd = `${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    for (const r of rules) {
      if (r.seasonStart && r.seasonEnd && mmdd >= r.seasonStart && mmdd <= r.seasonEnd) {
        matching.set(r.id, r);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const matched = [...matching.values()];
  if (matched.length > 0) {
    // Most specific (narrowest) window wins, so a short rally window overrides the
    // broad standard season when dates overlap (e.g. Sturgis week inside May-Sep).
    return matched.sort(
      (a, b) =>
        mmddOrdinal(a.seasonEnd!) - mmddOrdinal(a.seasonStart!) -
        (mmddOrdinal(b.seasonEnd!) - mmddOrdinal(b.seasonStart!))
    )[0];
  }

  // Off-season (no window matches): fall back to the cheapest active rule.
  return [...rules].sort((a, b) => a.dailyRateUsd - b.dailyRateUsd)[0];
}

export const TAX_RATE = 0.119; // 11.9%

export function calculateRentalPrice(
  startDate: string,
  endDate: string,
  numberOfBikes: number,
  rules: PricingRule[]
): { dailyRate: number; totalDays: number; subtotal: number; tax: number; totalPrice: number; minDays: number; seasonName: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Same-day return (end === start) still bills as a full 1-day rental.
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const rule = getPriceForDate(start, end, rules);
  const dailyRate = rule.dailyRateUsd;
  const subtotal = dailyRate * totalDays * numberOfBikes;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalPrice = Math.round((subtotal + tax) * 100) / 100;

  // Minimum rental duration is data-driven per pricing rule (Airtable "Min Rental
  // Days"). All active rules are at 1 today (day rentals OK, rally week included);
  // the check stays so a minimum can be reinstated from Airtable without a deploy.
  const minDays = Math.max(1, rule.minRentalDays || 1);

  return { dailyRate, totalDays, subtotal, tax, totalPrice, minDays, seasonName: rule.seasonName };
}

// ── Bikes ──────────────────────────────────────────────────────────────────

// ── Admin backoffice: planning reads ─────────────────────────────────────────

export interface PlanningBlock {
  id: string;
  type: BikeBlock["type"];
  bookingId?: string;
  tourId?: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface PlanningTour {
  id: string;
  idTour: string;
  name: string;
  startDate: string;
  endDate: string;
  pilots: number;
}

export type BookingChannel = "WEBSITE" | "B2B" | "DIRECT";

export interface AdminBooking {
  id: string;
  bookingId: string;
  channel: BookingChannel;
  status: RentalBooking["status"];
  customerName: string;
  email?: string;
  phone?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  numberOfBikes: number;
  totalPrice: number;
  partnerPlatform?: string;
  notes?: string;
  pickupTime?: string;
  dropoffTime?: string;
  /** Bike Names pinned to this booking (from the Bike Names text field). */
  assignedBikes: string[];
  /**
   * When the customer filled in their rider profile after paying. Null means
   * the team collects helmet size, emergency contact and licence at the
   * counter, which is fine but worth knowing before they walk in.
   */
  riderProfileCompletedAt?: string;
}

/** A booking plus the live per-block bike assignment (read from the blocks). */
export interface BookingDetail extends AdminBooking {
  blockType: BikeBlock["type"];
  firstName: string;
  lastName: string;
}

// Channel is derived from the Booking ID prefix so no Airtable schema change is
// required: `VR-B2B-*` = partner platform, anything else = public website.
function channelFromBookingId(bookingId: string): BookingChannel {
  if (bookingId.startsWith("VR-B2B-")) return "B2B";
  return "WEBSITE";
}

function overlapFormula(
  startField: string,
  endField: string,
  from: string,
  to: string
): string {
  return `AND(
    IS_BEFORE({${startField}}, DATEADD("${to}", 1, "days")),
    IS_AFTER({${endField}}, DATEADD("${from}", -1, "days"))
  )`;
}

/** All non-cancelled bike blocks overlapping [from, to], excluding Stripe test blocks. */
export async function getBlocksForPlanning(
  from: string,
  to: string
): Promise<PlanningBlock[]> {
  const records = await base(Tables.Blocks)
    .select({
      filterByFormula: `AND(
        {Status} != "Cancelled",
        FIND("cs_test_", {Notes} & "") = 0,
        ${overlapFormula("Start Date", "End Date", from, to)}
      )`,
      fields: ["Type", "Booking ID", "Tour ID", "Start Date", "End Date", "Notes"],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    type: (r.get("Type") as BikeBlock["type"]) ?? "RENTAL",
    bookingId: (r.get("Booking ID") as string) ?? undefined,
    tourId: (r.get("Tour ID") as string) ?? undefined,
    startDate: r.get("Start Date") as string,
    endDate: r.get("End Date") as string,
    notes: (r.get("Notes") as string) ?? undefined,
  }));
}

/** USA Freedom Tours (ID_TOUR contains "USA_" and "F") overlapping [from, to], with pilot counts. */
export async function getToursForPlanning(
  from: string,
  to: string
): Promise<PlanningTour[]> {
  const tourRecords = await base(Tables.Tours)
    .select({
      filterByFormula: `AND(
        FIND("USA_", {ID_TOUR}) > 0,
        FIND("F", {ID_TOUR}) > 0,
        ${overlapFormula("Start tour", "End tour", from, to)}
      )`,
      fields: ["ID_TOUR", "Start tour", "End tour", "Riders"],
    })
    .all();

  if (tourRecords.length === 0) return [];

  // Collect every linked rider id, then resolve which ones are pilots in one pass.
  const riderIds = new Set<string>();
  for (const tour of tourRecords) {
    const linked = (tour.get("Riders") as string[] | undefined) ?? [];
    linked.forEach((id) => riderIds.add(id));
  }

  const pilotSet = new Set<string>();
  const idList = Array.from(riderIds);
  for (let i = 0; i < idList.length; i += 100) {
    const batch = idList.slice(i, i + 100);
    const orClauses = batch.map((id) => `RECORD_ID() = "${id}"`).join(", ");
    const records = await base(Tables.Riders)
      .select({
        filterByFormula: `AND(OR(${orClauses}), {Type of rider} = "Pilot")`,
        fields: ["Type of rider"],
      })
      .all();
    records.forEach((r) => pilotSet.add(r.id));
  }

  return tourRecords.map((tour) => {
    const linked = (tour.get("Riders") as string[] | undefined) ?? [];
    const idTour = (tour.get("ID_TOUR") as string) ?? "";
    return {
      id: tour.id,
      idTour,
      name: idTour,
      startDate: tour.get("Start tour") as string,
      endDate: tour.get("End tour") as string,
      pilots: linked.filter((id) => pilotSet.has(id)).length,
    };
  });
}

function mapBooking(r: AirtableRecord<FieldSet>): AdminBooking {
  const bookingId = (r.get("Booking ID") as string) ?? "";
  const first = (r.get("First Name") as string) ?? "";
  const last = (r.get("Last Name") as string) ?? "";
  const internalNotes = (r.get("Internal Notes") as string) ?? "";
  const platformMatch = internalNotes.match(/Platform:\s*([^|]+)/i);
  return {
    id: r.id,
    bookingId,
    channel: channelFromBookingId(bookingId),
    status: (r.get("Status") as RentalBooking["status"]) ?? "Confirmed",
    customerName: `${first} ${last}`.trim(),
    email: (r.get("Email") as string) ?? undefined,
    phone: (r.get("Phone") as string) ?? undefined,
    startDate: r.get("Start Date") as string,
    endDate: r.get("End Date") as string,
    numberOfDays: (r.get("Number of Days") as number) ?? 0,
    numberOfBikes: (r.get("Number of Bikes") as number) ?? 1,
    totalPrice: (r.get("Total Price (USD)") as number) ?? 0,
    partnerPlatform: platformMatch ? platformMatch[1].trim() : undefined,
    notes: (r.get("Special Requests") as string) ?? undefined,
    pickupTime: (r.get("Pickup Time") as string) || undefined,
    dropoffTime: (r.get("Drop-off Time") as string) || undefined,
    riderProfileCompletedAt: (r.get("Rider Profile Completed At") as string) || undefined,
    assignedBikes: ((r.get("Bike Names") as string) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** Rental bookings (website + B2B) overlapping [from, to]. */
export async function getBookingsForPlanning(
  from: string,
  to: string
): Promise<AdminBooking[]> {
  const records = await base(Tables.Bookings)
    .select({
      filterByFormula: overlapFormula("Start Date", "End Date", from, to),
      sort: [{ field: "Start Date", direction: "asc" }],
    })
    .all();

  return records.map(mapBooking);
}

/** Every rental booking, newest start first — for the full bookings table. */
export async function getAllBookings(): Promise<AdminBooking[]> {
  const records = await base(Tables.Bookings)
    .select({ sort: [{ field: "Start Date", direction: "desc" }] })
    .all();
  return records.map(mapBooking);
}

// ── Turnover stats ───────────────────────────────────────────────────────────

/**
 * Per Johann (2026-06-23): direct (WEBSITE) bookings count their real stored
 * total; B2B / marketplace bookings count a flat $100 per bike-day
 * (days × bikes). Easy to revisit — just one constant + one branch below.
 */
export const B2B_BIKE_DAY_RATE = 100;

export interface ChannelTurnover {
  channel: BookingChannel;
  bookings: number;
  bikeDays: number;
  turnover: number;
}

export interface TurnoverStats {
  total: number;
  bookings: number;
  byChannel: ChannelTurnover[];
  /** Last 12 calendar months, oldest → newest, bucketed by rental start date. */
  byMonth: { month: string; website: number; b2b: number; total: number }[];
  thisYear: number;
  thisMonth: number;
}

/** Turnover contribution of a single booking, per the rules above. */
export function bookingTurnover(b: AdminBooking): number {
  if (b.channel === "B2B") {
    return B2B_BIKE_DAY_RATE * (b.numberOfDays || 0) * (b.numberOfBikes || 1);
  }
  return b.totalPrice || 0; // WEBSITE = real stored total (post-tax)
}

/** Staff bookings (Platform tagged "Staff") are internal use, not revenue. */
export function isStaffBooking(b: AdminBooking): boolean {
  return (b.partnerPlatform ?? "").trim().toLowerCase() === "staff";
}

export async function getTurnoverStats(): Promise<TurnoverStats> {
  const all = await getAllBookings();
  // Exclude cancelled, staff, and not-yet-captured same-day holds (Pending Payment).
  const live = all.filter(
    (b) => b.status !== "Cancelled" && b.status !== "Pending Payment" && !isStaffBooking(b)
  );

  // Two display buckets: B2B (marketplace, flat bike-day rate) vs everything
  // else (WEBSITE/DIRECT = real booking totals).
  const websiteBucket: ChannelTurnover = { channel: "WEBSITE", bookings: 0, bikeDays: 0, turnover: 0 };
  const b2bBucket: ChannelTurnover = { channel: "B2B", bookings: 0, bikeDays: 0, turnover: 0 };
  const bucketFor = (ch: BookingChannel) => (ch === "B2B" ? b2bBucket : websiteBucket);

  // Last 12 months including the current one (YYYY-MM keys, oldest first).
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthKeys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const monthMap = new Map(
    monthKeys.map((m) => [m, { month: m, website: 0, b2b: 0, total: 0 }])
  );

  const thisYearKey = String(now.getUTCFullYear());
  const thisMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  let total = 0;
  let thisYear = 0;
  let thisMonth = 0;

  for (const b of live) {
    const value = bookingTurnover(b);
    total += value;

    const ch = bucketFor(b.channel);
    ch.bookings += 1;
    ch.bikeDays += (b.numberOfDays || 0) * (b.numberOfBikes || 1);
    ch.turnover += value;

    const monthKey = (b.startDate || "").slice(0, 7); // YYYY-MM
    if (monthKey.startsWith(thisYearKey)) thisYear += value;
    if (monthKey === thisMonthKey) thisMonth += value;

    const bucket = monthMap.get(monthKey);
    if (bucket) {
      if (b.channel === "B2B") bucket.b2b += value;
      else bucket.website += value;
      bucket.total += value;
    }
  }

  return {
    total,
    bookings: live.length,
    byChannel: [websiteBucket, b2bBucket],
    byMonth: monthKeys.map((m) => monthMap.get(m)!),
    thisYear,
    thisMonth,
  };
}

// ── Admin backoffice: writes ─────────────────────────────────────────────────

export interface B2BBookingInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  startDate: string;
  endDate: string;
  bikes: number;
  /** Optional specific bikes to pin (by Bike Name); count drives blocks if larger. */
  assignedBikes?: string[];
  platform: string;
  notes?: string;
  pickupTime?: string;
  dropoffTime?: string;
}

function daysBetween(start: string, end: string): number {
  const d = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, d);
}

/**
 * Creates a manual B2B reservation: one booking record (channel encoded in the
 * Booking ID prefix + Internal Notes) plus one RENTAL block per bike, so the
 * existing availability logic counts it and no public double-booking is possible.
 */
export async function createB2BBooking(input: B2BBookingInput): Promise<string> {
  const bookingId = `VR-B2B-${nanoid(8).toUpperCase()}`;
  const days = daysBetween(input.startDate, input.endDate);
  const assigned = (input.assignedBikes ?? []).filter(Boolean).slice(0, 10);
  const n = Math.max(1, Math.min(10, Math.max(input.bikes, assigned.length)));

  await base(Tables.Bookings).create([
    {
      fields: {
        "Booking ID": bookingId,
        Status: "Confirmed",
        "First Name": input.firstName,
        "Last Name": input.lastName,
        Email: input.email ?? "",
        Phone: input.phone ?? "",
        "Start Date": input.startDate,
        "End Date": input.endDate,
        "Pickup Time": input.pickupTime ?? "",
        "Drop-off Time": input.dropoffTime ?? "",
        "Number of Days": days,
        "Number of Bikes": n,
        "Bike Names": assigned.join(", "),
        "Internal Notes": `Channel: B2B | Platform: ${input.platform}${
          input.notes ? ` | ${input.notes}` : ""
        }`,
        "Special Requests": input.notes ?? "",
      },
    },
  ]);

  const blocks = Array.from({ length: n }, (_, i) => ({
    fields: {
      "Block ID": `${bookingId}-BIKE${i + 1}`,
      Type: "RENTAL",
      "Bike ID": assigned[i] ?? "",
      "Booking ID": bookingId,
      "Start Date": input.startDate,
      "End Date": input.endDate,
      Status: "Confirmed",
      Notes: `B2B ${input.platform}`,
    },
  }));
  // Airtable caps creates at 10 records per call; a B2B booking never exceeds 10 bikes.
  await base(Tables.Blocks).create(blocks);

  return bookingId;
}

export interface MaintenanceInput {
  startDate: string;
  endDate: string;
  bikes: number;
  reason?: string;
}

/** Blocks N bikes for maintenance over a date range (no booking record). */
export async function createMaintenanceBlock(input: MaintenanceInput): Promise<void> {
  const blockId = `MAINT-${nanoid(6).toUpperCase()}`;
  const blocks = Array.from({ length: input.bikes }, (_, i) => ({
    fields: {
      "Block ID": `${blockId}-${i + 1}`,
      Type: "MAINTENANCE",
      "Start Date": input.startDate,
      "End Date": input.endDate,
      Status: "Confirmed",
      Notes: input.reason ?? "Maintenance",
    },
  }));
  await base(Tables.Blocks).create(blocks);
}

async function updateInBatches(
  table: string,
  records: { id: string; fields: Record<string, unknown> }[]
): Promise<void> {
  for (let i = 0; i < records.length; i += 10) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await base(table).update(records.slice(i, i + 10) as any);
  }
}

/** Everything the accept/decline flow needs about a same-day request. */
export interface BookingForDecision {
  recordId: string;
  bookingId: string;
  status: RentalBooking["status"];
  paymentIntentId?: string;
  /** Needed to recover the Meta CAPI signals stashed in the checkout metadata. */
  sessionId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  numberOfBikes: number;
  totalPrice: number;
  pickupTime?: string;
  dropoffTime?: string;
}

/** Look up a booking (by its public Booking ID) for the accept/decline flow. */
export async function getBookingForDecision(
  bookingId: string
): Promise<BookingForDecision | null> {
  const recs = await base(Tables.Bookings)
    .select({ filterByFormula: `{Booking ID} = "${bookingId}"`, maxRecords: 1 })
    .firstPage();
  const r = recs[0];
  if (!r) return null;
  return {
    recordId: r.id,
    bookingId,
    status: (r.get("Status") as RentalBooking["status"]) ?? "Confirmed",
    paymentIntentId: (r.get("Stripe Payment Intent ID") as string) || undefined,
    sessionId: (r.get("Stripe Session ID") as string) || undefined,
    firstName: (r.get("First Name") as string) ?? "",
    lastName: (r.get("Last Name") as string) ?? "",
    email: (r.get("Email") as string) ?? "",
    phone: (r.get("Phone") as string) || undefined,
    startDate: r.get("Start Date") as string,
    endDate: r.get("End Date") as string,
    numberOfDays: (r.get("Number of Days") as number) ?? 0,
    numberOfBikes: (r.get("Number of Bikes") as number) ?? 1,
    totalPrice: (r.get("Total Price (USD)") as number) ?? 0,
    pickupTime: (r.get("Pickup Time") as string) || undefined,
    dropoffTime: (r.get("Drop-off Time") as string) || undefined,
  };
}

/**
 * Confirms a booking after its hold is captured: booking → Confirmed and every
 * live (non-cancelled) block → Confirmed so the tentative hold becomes firm.
 */
export async function confirmBooking(bookingId: string): Promise<void> {
  const bookingRecs = await base(Tables.Bookings)
    .select({ filterByFormula: `{Booking ID} = "${bookingId}"` })
    .all();
  await updateInBatches(
    Tables.Bookings,
    bookingRecs.map((r) => ({ id: r.id, fields: { Status: "Confirmed" } }))
  );

  const blockRecs = await base(Tables.Blocks)
    .select({
      filterByFormula: `AND({Booking ID} = "${bookingId}", {Status} != "Cancelled")`,
    })
    .all();
  await updateInBatches(
    Tables.Blocks,
    blockRecs.map((r) => ({ id: r.id, fields: { Status: "Confirmed" } }))
  );
}

/**
 * Same-day website requests still "Pending Payment" older than `hours` — the
 * auto-release cron cancels their holds and frees the bikes. Website-only
 * (VR-USA- prefix) so staff/B2B rows are never touched.
 */
export async function getExpiredPendingRequests(
  hours: number
): Promise<BookingForDecision[]> {
  const recs = await base(Tables.Bookings)
    .select({
      filterByFormula: `AND(
        {Status} = "Pending Payment",
        LEFT({Booking ID}, 7) = "VR-USA-",
        DATETIME_DIFF(NOW(), {Date de création}, 'hours') >= ${hours}
      )`,
    })
    .all();
  return recs.map((r) => ({
    recordId: r.id,
    bookingId: (r.get("Booking ID") as string) ?? "",
    status: (r.get("Status") as RentalBooking["status"]) ?? "Pending Payment",
    paymentIntentId: (r.get("Stripe Payment Intent ID") as string) || undefined,
    sessionId: (r.get("Stripe Session ID") as string) || undefined,
    firstName: (r.get("First Name") as string) ?? "",
    lastName: (r.get("Last Name") as string) ?? "",
    email: (r.get("Email") as string) ?? "",
    phone: (r.get("Phone") as string) || undefined,
    startDate: r.get("Start Date") as string,
    endDate: r.get("End Date") as string,
    numberOfDays: (r.get("Number of Days") as number) ?? 0,
    numberOfBikes: (r.get("Number of Bikes") as number) ?? 1,
    totalPrice: (r.get("Total Price (USD)") as number) ?? 0,
    pickupTime: (r.get("Pickup Time") as string) || undefined,
    dropoffTime: (r.get("Drop-off Time") as string) || undefined,
  }));
}

/** Cancels a booking and all its bike blocks (frees the availability). */
export async function cancelBooking(bookingId: string): Promise<void> {
  const bookingRecs = await base(Tables.Bookings)
    .select({ filterByFormula: `{Booking ID} = "${bookingId}"` })
    .all();
  await updateInBatches(
    Tables.Bookings,
    bookingRecs.map((r) => ({ id: r.id, fields: { Status: "Cancelled" } }))
  );

  const blockRecs = await base(Tables.Blocks)
    .select({ filterByFormula: `{Booking ID} = "${bookingId}"` })
    .all();
  await updateInBatches(
    Tables.Blocks,
    blockRecs.map((r) => ({ id: r.id, fields: { Status: "Cancelled" } }))
  );
}

function mapBike(r: AirtableRecord<FieldSet>): Bike {
  return {
    id: r.id,
    name: (r.get("Bike Name") as string) ?? "",
    serialNumber: (r.get("Serial Number") as string) ?? undefined,
    year: (r.get("Year") as number) ?? 2024,
    color: (r.get("Color") as string) ?? "",
    mileage: (r.get("Mileage (mi)") as number) ?? 0,
    status: (r.get("Status") as Bike["status"]) ?? "Available",
    notes: (r.get("Notes") as string) ?? undefined,
    lastServiceDate: (r.get("Last Service Date") as string) ?? undefined,
  };
}

const bikeSort = (a: Bike, b: Bike) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

export async function getAllBikes(): Promise<Bike[]> {
  const records = await base(Tables.Bikes)
    .select({ filterByFormula: `{Status} = "Available"` })
    .all();
  return records.map(mapBike).sort(bikeSort);
}

/** Bikes that can be assigned to a booking (everything except Retired), name-sorted. */
export async function getAssignableBikes(): Promise<Bike[]> {
  const records = await base(Tables.Bikes)
    .select({ filterByFormula: `{Status} != "Retired"` })
    .all();
  return records.map(mapBike).sort(bikeSort);
}

/** Updates a bike's odometer reading. */
export async function updateBikeMileage(
  recordId: string,
  miles: number
): Promise<void> {
  await base(Tables.Bikes).update([
    { id: recordId, fields: { "Mileage (mi)": Math.max(0, Math.round(miles)) } },
  ]);
}

/** A single booking with its live block type, by Airtable record id. */
export async function getBookingByRecordId(
  recordId: string
): Promise<BookingDetail | null> {
  let rec: AirtableRecord<FieldSet>;
  try {
    rec = await base(Tables.Bookings).find(recordId);
  } catch {
    return null;
  }
  const booking = mapBooking(rec);
  const blocks = await base(Tables.Blocks)
    .select({
      filterByFormula: `AND({Booking ID} = "${booking.bookingId}", {Status} != "Cancelled")`,
      fields: ["Type"],
    })
    .firstPage();
  const blockType =
    (blocks[0]?.get("Type") as BikeBlock["type"]) ?? "RENTAL";
  return {
    ...booking,
    blockType,
    firstName: (rec.get("First Name") as string) ?? "",
    lastName: (rec.get("Last Name") as string) ?? "",
  };
}

async function deleteInBatches(table: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 10) {
    await base(table).destroy(ids.slice(i, i + 10));
  }
}

export interface UpdateBookingInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  startDate: string;
  endDate: string;
  numberOfBikes: number;
  assignedBikes: string[];
  status: RentalBooking["status"];
  platform?: string;
  notes?: string;
  pickupTime?: string;
  dropoffTime?: string;
}

/**
 * Edits a booking and rebuilds its bike blocks. Blocks are deleted and
 * recreated (one per bike) so the per-bike assignment, dates and count stay in
 * sync with the booking row. A cancelled booking keeps no active blocks.
 */
export async function updateBooking(
  recordId: string,
  input: UpdateBookingInput
): Promise<void> {
  const rec = await base(Tables.Bookings).find(recordId);
  const bookingId = (rec.get("Booking ID") as string) ?? "";
  const channel = channelFromBookingId(bookingId);
  const days = daysBetween(input.startDate, input.endDate);
  const assigned = input.assignedBikes.filter(Boolean).slice(0, 10);
  const n = Math.max(1, Math.min(10, Math.max(input.numberOfBikes, assigned.length)));

  const fields: Record<string, string | number> = {
    "First Name": input.firstName,
    "Last Name": input.lastName,
    Email: input.email ?? "",
    Phone: input.phone ?? "",
    "Start Date": input.startDate,
    "End Date": input.endDate,
    "Pickup Time": input.pickupTime ?? "",
    "Drop-off Time": input.dropoffTime ?? "",
    "Number of Days": days,
    "Number of Bikes": n,
    "Bike Names": assigned.join(", "),
    Status: input.status,
    "Special Requests": input.notes ?? "",
  };
  if (channel === "B2B") {
    fields["Internal Notes"] = `Channel: B2B | Platform: ${input.platform ?? ""}${
      input.notes ? ` | ${input.notes}` : ""
    }`;
  }
  await base(Tables.Bookings).update([{ id: recordId, fields }]);

  // Rebuild blocks from scratch — simplest correct reconciliation.
  const existing = await base(Tables.Blocks)
    .select({ filterByFormula: `{Booking ID} = "${bookingId}"` })
    .all();
  await deleteInBatches(Tables.Blocks, existing.map((r) => r.id));

  if (input.status !== "Cancelled") {
    const note =
      channel === "B2B" ? `B2B ${input.platform ?? ""}`.trim() : "Edited via backoffice";
    const blocks = Array.from({ length: n }, (_, i) => ({
      fields: {
        "Block ID": `${bookingId}-BIKE${i + 1}`,
        Type: "RENTAL",
        "Bike ID": assigned[i] ?? "",
        "Booking ID": bookingId,
        "Start Date": input.startDate,
        "End Date": input.endDate,
        Status: "Confirmed",
        Notes: note,
      },
    }));
    await base(Tables.Blocks).create(blocks);
  }
}
