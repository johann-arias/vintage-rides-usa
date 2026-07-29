// First-party log of every availability check made on /book.
//
// Why a server-side log when the page already fires GA4 events: this one
// records WHICH dates people asked for, survives ad blockers, and needs no
// analytics vendor. It is the only place that answers "what are they actually
// trying to book, and what did we answer".
//
// No personal data is stored, by design: dates, duration, bike count, and the
// answer we gave. Nothing that identifies a visitor.
//
// Rows are purged after RETENTION_DAYS by the daily cron, so the table stays a
// rolling window rather than growing forever inside the shared ops base.

import base, { Tables } from "@/lib/airtable";

export const RETENTION_DAYS = 30;

export type SearchOutcome = "available" | "sold_out" | "below_min_days" | "past_date";

export interface AvailabilitySearch {
  startDate: string;
  endDate: string;
  days: number;
  bikes: number;
  leadTimeDays: number;
  outcome: SearchOutcome;
  availableCount: number;
  dailyRate?: number;
  totalPrice?: number;
  season?: string;
}

/**
 * Fire and forget. The visitor's answer must never wait on, or be broken by,
 * our own bookkeeping, so this swallows everything.
 */
export async function logAvailabilitySearch(s: AvailabilitySearch): Promise<void> {
  try {
    await base(Tables.AvailabilitySearches).create([
      {
        fields: {
          "Searched At": new Date().toISOString(),
          "Start Date": s.startDate,
          "End Date": s.endDate,
          "Start Month": s.startDate.slice(0, 7),
          Days: s.days,
          Bikes: s.bikes,
          "Lead Time Days": s.leadTimeDays,
          Outcome: s.outcome,
          "Available Count": s.availableCount,
          ...(s.dailyRate !== undefined ? { "Daily Rate": s.dailyRate } : {}),
          ...(s.totalPrice !== undefined ? { "Total Price": s.totalPrice } : {}),
          ...(s.season ? { Season: s.season } : {}),
        },
      },
    ]);
  } catch (err) {
    console.error("[availability-log] write failed:", err);
  }
}

export interface SearchDemandRow {
  key: string;
  label: string;
  searches: number;
}

export interface SearchStats {
  rangeDays: number;
  total: number;
  /** Which months visitors are asking for, chronological. */
  byMonth: SearchDemandRow[];
  /** What we answered them. */
  byOutcome: SearchDemandRow[];
  /** How far ahead they are shopping. */
  byLeadTime: SearchDemandRow[];
  /** Rental length asked for. */
  byDuration: SearchDemandRow[];
  /** Share of searches whose dates touch Sturgis Rally week. */
  rallyWeekShare: number;
}

// Rally week is read from the requested dates, not from the pricing rule: since
// 2026-07-29 rally week is priced like any other week, so the season name no
// longer says anything about demand. The dates still do.
const RALLY_START_MMDD = "08-07";
const RALLY_END_MMDD = "08-16";

function touchesRallyWeek(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const cursor = new Date(start);
  // A rental is a few weeks at most; the cap is a defensive guard on bad rows.
  for (let i = 0; i <= 400 && cursor <= end; i++) {
    const mmdd = `${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (mmdd >= RALLY_START_MMDD && mmdd <= RALLY_END_MMDD) return true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

const LEAD_BUCKETS: { label: string; max: number }[] = [
  { label: "Today or tomorrow", max: 1 },
  { label: "2 to 6 days", max: 6 },
  { label: "1 to 2 weeks", max: 14 },
  { label: "2 to 4 weeks", max: 30 },
  { label: "1 to 3 months", max: 90 },
  { label: "More than 3 months", max: Infinity },
];

const DURATION_BUCKETS: { label: string; max: number }[] = [
  { label: "1 day", max: 1 },
  { label: "2 days", max: 2 },
  { label: "3 days", max: 3 },
  { label: "4 to 6 days", max: 6 },
  { label: "A week or more", max: Infinity },
];

function bucket(value: number, buckets: { label: string; max: number }[]): string {
  return buckets.find((b) => value <= b.max)?.label ?? buckets[buckets.length - 1].label;
}

function tally(rows: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r, (m.get(r) ?? 0) + 1);
  return m;
}

const MONTH_LABEL = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

// Airtable pages 100 records at a time, so a busy month would cost dozens of
// API calls on every dashboard render. Two guards: a hard ceiling on how far
// back we read, and a short in-memory cache shared by all renders on the same
// serverless instance. Neither changes what the numbers mean, they just stop
// the panel from hammering the shared ops base.
const MAX_RECORDS = 5000;
const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: { at: number; rangeDays: number; data: SearchStats } | null = null;

/** Reads the rolling log and shapes it for the garage dashboard. */
export async function getSearchStats(rangeDays = 30): Promise<SearchStats> {
  if (cache && cache.rangeDays === rangeDays && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString();
  const records = await base(Tables.AvailabilitySearches)
    .select({
      filterByFormula: `IS_AFTER({Searched At}, '${since}')`,
      fields: ["Start Month", "Start Date", "End Date", "Outcome", "Lead Time Days", "Days"],
      sort: [{ field: "Searched At", direction: "desc" }],
      maxRecords: MAX_RECORDS,
      pageSize: 100,
    })
    .all();

  const months: string[] = [];
  const outcomes: string[] = [];
  const leads: string[] = [];
  const durations: string[] = [];
  let rallyWeek = 0;

  for (const r of records) {
    const f = r.fields as Record<string, unknown>;
    if (typeof f["Start Month"] === "string") months.push(f["Start Month"]);
    if (typeof f.Outcome === "string") outcomes.push(f.Outcome);
    if (typeof f["Lead Time Days"] === "number") leads.push(bucket(f["Lead Time Days"], LEAD_BUCKETS));
    if (typeof f.Days === "number") durations.push(bucket(f.Days, DURATION_BUCKETS));
    if (
      typeof f["Start Date"] === "string" &&
      typeof f["End Date"] === "string" &&
      touchesRallyWeek(f["Start Date"], f["End Date"])
    ) {
      rallyWeek += 1;
    }
  }

  const rows = (m: Map<string, number>, order?: string[]): SearchDemandRow[] => {
    const entries = [...m.entries()];
    if (order) {
      entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    } else {
      entries.sort((a, b) => b[1] - a[1]);
    }
    return entries.map(([key, searches]) => ({ key, label: key, searches }));
  };

  const data: SearchStats = {
    rangeDays,
    total: records.length,
    byMonth: [...tally(months).entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, searches]) => ({ key, label: MONTH_LABEL(key), searches })),
    byOutcome: rows(tally(outcomes)),
    byLeadTime: rows(tally(leads), LEAD_BUCKETS.map((b) => b.label)),
    byDuration: rows(tally(durations), DURATION_BUCKETS.map((b) => b.label)),
    rallyWeekShare: records.length > 0 ? rallyWeek / records.length : 0,
  };
  cache = { at: Date.now(), rangeDays, data };
  return data;
}

/** Deletes rows older than the retention window. Returns how many went. */
export async function purgeOldSearches(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  const stale = await base(Tables.AvailabilitySearches)
    .select({ filterByFormula: `IS_BEFORE({Searched At}, '${cutoff}')`, fields: [], pageSize: 100 })
    .all();

  let deleted = 0;
  // Airtable deletes at most 10 records per call.
  for (let i = 0; i < stale.length; i += 10) {
    const ids = stale.slice(i, i + 10).map((r) => r.id);
    await base(Tables.AvailabilitySearches).destroy(ids);
    deleted += ids.length;
  }
  return deleted;
}
