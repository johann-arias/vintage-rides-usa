import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY!,
}).base(process.env.AIRTABLE_BASE_ID!);

export const Tables = {
  Bikes: "USA_Bikes",
  Blocks: "USA_Bike_Blocks",
  Bookings: "USA_Rental_Bookings",
  Pricing: "USA_Pricing",
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
        IS_BEFORE({Start Date}, DATEADD("${endDate}", 1, "days")),
        IS_AFTER({End Date}, DATEADD("${startDate}", -1, "days"))
      )`,
      fields: ["Bike ID"],
    })
    .all();

  return records.length;
}

const TOTAL_BIKES = 10;

// Bikes are available for rental May 1 – Sep 30 only.
export const RENTAL_SEASON = { start: "05-01", end: "09-30" };

/**
 * Returns true if the entire rental period falls within the May–Sep rental season.
 */
export function isPeriodInRentalSeason(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cursor = new Date(start);
  while (cursor <= end) {
    const mmdd = `${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (mmdd < "05-01" || mmdd > "09-30") return false;
    cursor.setDate(cursor.getDate() + 1);
  }
  return true;
}

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
    minRentalDays: (r.get("Min Rental Days") as number) ?? 3,
    seasonStart: (r.get("Season Start MM-DD") as string) ?? undefined,
    seasonEnd: (r.get("Season End MM-DD") as string) ?? undefined,
    notes: (r.get("Notes") as string) ?? undefined,
  }));
}

export function getPriceForDate(
  date: Date,
  rules: PricingRule[]
): PricingRule {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  for (const rule of rules) {
    if (!rule.seasonStart || !rule.seasonEnd) continue;
    if (mmdd >= rule.seasonStart && mmdd <= rule.seasonEnd) return rule;
  }

  // Fallback to cheapest active rule
  return rules.sort((a, b) => a.dailyRateUsd - b.dailyRateUsd)[0];
}

export function calculateRentalPrice(
  startDate: string,
  endDate: string,
  numberOfBikes: number,
  rules: PricingRule[]
): { dailyRate: number; totalDays: number; totalPrice: number; minDays: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const rule = getPriceForDate(start, rules);
  const dailyRate = rule.dailyRateUsd;
  const totalPrice = dailyRate * totalDays * numberOfBikes;

  return { dailyRate, totalDays, totalPrice, minDays: rule.minRentalDays };
}

// ── Bikes ──────────────────────────────────────────────────────────────────

export async function getAllBikes(): Promise<Bike[]> {
  const records = await base(Tables.Bikes)
    .select({ filterByFormula: `{Status} = "Available"` })
    .all();

  return records.map((r) => ({
    id: r.id,
    name: (r.get("Bike Name") as string) ?? "",
    serialNumber: (r.get("Serial Number") as string) ?? undefined,
    year: (r.get("Year") as number) ?? 2024,
    color: (r.get("Color") as string) ?? "",
    mileage: (r.get("Mileage (mi)") as number) ?? 0,
    status: (r.get("Status") as Bike["status"]) ?? "Available",
    notes: (r.get("Notes") as string) ?? undefined,
    lastServiceDate: (r.get("Last Service Date") as string) ?? undefined,
  }));
}
