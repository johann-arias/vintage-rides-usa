// Google data sources for the /garage stats dashboard: GA4 (Data API),
// Search Console, and Business Profile (performance + reviews).
//
// All three authenticate with ONE service account, supplied as a base64-encoded
// JSON key in `GOOGLE_SA_KEY_B64`. Each fetcher is defensive: if the env / access
// / property id is missing or the API errors, it returns `{ connected: false }`
// with a human-readable `error` instead of throwing, so the dashboard degrades
// gracefully while access is still being granted.

import { GoogleAuth } from "google-auth-library";

// ── Auth ─────────────────────────────────────────────────────────────────────

function loadCredentials(): Record<string, unknown> | null {
  const b64 = process.env.GOOGLE_SA_KEY_B64;
  if (!b64) return null;
  try {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

const authCache = new Map<string, GoogleAuth>();

// `subject` impersonates a user via domain-wide delegation. Needed for Business
// Profile: a service account can't accept a GBP manager invite, so once DWD is
// authorised in Workspace admin we impersonate a real GBP manager instead.
async function getAccessToken(scopes: string[], subject?: string): Promise<string | null> {
  const credentials = loadCredentials();
  if (!credentials) return null;
  const key = `${subject ?? ""}|${scopes.join(" ")}`;
  let auth = authCache.get(key);
  if (!auth) {
    auth = new GoogleAuth({
      credentials,
      scopes,
      ...(subject ? { clientOptions: { subject } } : {}),
    });
    authCache.set(key, auth);
  }
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token ?? null;
}

function hasCredentials(): boolean {
  return Boolean(process.env.GOOGLE_SA_KEY_B64);
}

/** Date `n` days ago, formatted YYYY-MM-DD (UTC). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Google Analytics 4 (Data API) ────────────────────────────────────────────

export interface GaTotals {
  sessions: number;
  activeUsers: number;
  newUsers: number;
  pageViews: number;
  engagementRate: number; // 0..1
  avgSessionDurationSec: number;
}

export interface GaStats {
  connected: boolean;
  error?: string;
  rangeDays: number;
  totals: GaTotals;
  /**
   * Same metrics over the window of equal length immediately before this one.
   * `null` when the comparison call failed — the dashboard then just hides the
   * deltas instead of pretending the previous period was zero.
   */
  previousTotals: GaTotals | null;
  /** Bounds of the comparison window, for the "vs …" label. */
  previousRange: { startDate: string; endDate: string } | null;
  byDay: { date: string; sessions: number }[];
  // `previous` is null when unavailable, 0 when the row genuinely didn't exist.
  topChannels: { label: string; sessions: number; previous: number | null }[];
  topPages: { path: string; views: number; previous: number | null }[];
  topCountries: { label: string; sessions: number; previous: number | null }[];
  /**
   * Sites that sent us a click, i.e. every session whose medium is `referral`.
   * Deliberately wider than the "Referral" channel group: a click from
   * facebook.com also carries medium=referral but GA4 files it under Organic
   * Social, and it is still a site sending traffic.
   */
  topReferrers: { label: string; sessions: number; previous: number | null }[];
}

function zeroTotals(): GaTotals {
  return {
    sessions: 0,
    activeUsers: 0,
    newUsers: 0,
    pageViews: 0,
    engagementRate: 0,
    avgSessionDurationSec: 0,
  };
}

function emptyGa(rangeDays: number, error?: string): GaStats {
  return {
    connected: false,
    error,
    rangeDays,
    totals: zeroTotals(),
    previousTotals: null,
    previousRange: null,
    byDay: [],
    topChannels: [],
    topPages: [],
    topCountries: [],
    topReferrers: [],
  };
}

type GaReport = {
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
};

export async function getGaStats(rangeDays = 30): Promise<GaStats> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!hasCredentials()) return emptyGa(rangeDays, "Service account not configured (GOOGLE_SA_KEY_B64).");
  if (!propertyId) return emptyGa(rangeDays, "Missing GA4_PROPERTY_ID (numeric property id).");

  try {
    const token = await getAccessToken(["https://www.googleapis.com/auth/analytics.readonly"]);
    if (!token) return emptyGa(rangeDays, "Could not mint an access token.");

    // Current window is `rangeDays`+1 days long (inclusive of today), so the
    // comparison window is shifted back by exactly that many days.
    const span = rangeDays + 1;
    const current = [{ startDate: `${rangeDays}daysAgo`, endDate: "today" }];
    const previous = [{ startDate: `${rangeDays + span}daysAgo`, endDate: `${span}daysAgo` }];

    // The comparison batch reaches deeper into each dimension than the current
    // one: a row that ranks 4th today may have ranked 30th before, and we still
    // want its previous value to compute the delta.
    const COMPARE_LIMIT = "100";
    // Referring sites. GA4 caps a batch at 5 reports, and the current window
    // already uses its five, so this one rides along in the comparison batch
    // (which has no by-day series) and runs on its own for the current window.
    const referrersRequest = (dateRanges: typeof current, limit: string) => ({
      dateRanges,
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: "sessionMedium",
          stringFilter: { matchType: "EXACT", value: "referral" },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit,
    });

    const requests = (
      dateRanges: typeof current,
      withByDay: boolean,
      limits: [string, string, string],
      withReferrers = false
    ) =>
      [
        // headline totals
        {
          dateRanges,
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "screenPageViews" },
            { name: "engagementRate" },
            { name: "averageSessionDuration" },
          ],
        },
        // sessions by day (current window only — the comparison needs totals, not a series)
        ...(withByDay
          ? [
              {
                dateRanges,
                dimensions: [{ name: "date" }],
                metrics: [{ name: "sessions" }],
                orderBys: [{ dimension: { dimensionName: "date" } }],
              },
            ]
          : []),
        // channels
        {
          dateRanges,
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: limits[0],
        },
        // top pages
        {
          dateRanges,
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: limits[1],
        },
        // top countries
        {
          dateRanges,
          dimensions: [{ name: "country" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: limits[2],
        },
        // referring sites — appended last so the report indices above are stable
        ...(withReferrers ? [referrersRequest(dateRanges, COMPARE_LIMIT)] : []),
      ];

    const runBatch = async (reqs: unknown[]) =>
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests: reqs }),
        cache: "no-store",
      });

    const runReport = async (req: unknown) =>
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(req),
        cache: "no-store",
      });

    const [res, prevRes, referrersRes] = await Promise.all([
      runBatch(requests(current, true, ["8", "10", "6"])),
      runBatch(requests(previous, false, [COMPARE_LIMIT, COMPARE_LIMIT, COMPARE_LIMIT], true)),
      runReport(referrersRequest(current, "10")),
    ]);
    if (!res.ok) return emptyGa(rangeDays, `GA4 API ${res.status}: ${(await res.text()).slice(0, 200)}`);

    const json = (await res.json()) as { reports?: GaReport[] };
    const reports = json.reports ?? [];
    const num = (v?: string) => (v ? Number(v) : 0);

    // A failed comparison call is not fatal: show the period on its own.
    const prevReports = prevRes.ok ? ((await prevRes.json()) as { reports?: GaReport[] }).reports ?? [] : null;
    const prevTotalValues = prevReports?.[0]?.rows?.[0]?.metricValues;
    const previousTotals: GaTotals | null = prevReports
      ? {
          sessions: num(prevTotalValues?.[0]?.value),
          activeUsers: num(prevTotalValues?.[1]?.value),
          newUsers: num(prevTotalValues?.[2]?.value),
          pageViews: num(prevTotalValues?.[3]?.value),
          engagementRate: num(prevTotalValues?.[4]?.value),
          avgSessionDurationSec: num(prevTotalValues?.[5]?.value),
        }
      : null;
    // Previous-window lookups keyed by dimension value. Index 0 is the totals
    // report, so the three dimension reports sit at 1, 2, 3.
    const prevMap = (reportIndex: number): Map<string, number> | null => {
      if (!prevReports) return null;
      const m = new Map<string, number>();
      for (const r of prevReports[reportIndex]?.rows ?? []) {
        m.set(r.dimensionValues?.[0]?.value ?? "—", num(r.metricValues?.[0]?.value));
      }
      return m;
    };
    const prevChannels = prevMap(1);
    const prevPages = prevMap(2);
    const prevCountries = prevMap(3);
    const prevReferrers = prevMap(4);
    /** 0 (not null) for a key absent from a successful comparison call: it really was zero. */
    const lookup = (m: Map<string, number> | null, key: string) => (m ? (m.get(key) ?? 0) : null);

    const t = reports[0]?.rows?.[0]?.metricValues ?? [];
    const byDay = (reports[1]?.rows ?? []).map((r) => {
      const raw = r.dimensionValues?.[0]?.value ?? ""; // YYYYMMDD
      const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
      return { date, sessions: num(r.metricValues?.[0]?.value) };
    });
    const topChannels = (reports[2]?.rows ?? []).map((r) => {
      const label = r.dimensionValues?.[0]?.value ?? "—";
      return { label, sessions: num(r.metricValues?.[0]?.value), previous: lookup(prevChannels, label) };
    });
    const topPages = (reports[3]?.rows ?? []).map((r) => {
      const path = r.dimensionValues?.[0]?.value ?? "—";
      return { path, views: num(r.metricValues?.[0]?.value), previous: lookup(prevPages, path) };
    });
    const topCountries = (reports[4]?.rows ?? []).map((r) => {
      const label = r.dimensionValues?.[0]?.value ?? "—";
      return { label, sessions: num(r.metricValues?.[0]?.value), previous: lookup(prevCountries, label) };
    });
    // Its own call, so a referrer failure leaves the rest of the section intact.
    const referrerRows = referrersRes.ok
      ? ((await referrersRes.json()) as GaReport).rows ?? []
      : [];
    const topReferrers = referrerRows.map((r) => {
      const label = r.dimensionValues?.[0]?.value ?? "—";
      return { label, sessions: num(r.metricValues?.[0]?.value), previous: lookup(prevReferrers, label) };
    });

    return {
      connected: true,
      rangeDays,
      totals: {
        sessions: num(t[0]?.value),
        activeUsers: num(t[1]?.value),
        newUsers: num(t[2]?.value),
        pageViews: num(t[3]?.value),
        engagementRate: num(t[4]?.value),
        avgSessionDurationSec: num(t[5]?.value),
      },
      previousTotals,
      previousRange: previousTotals
        ? { startDate: daysAgo(rangeDays + span), endDate: daysAgo(span) }
        : null,
      byDay,
      topChannels,
      topPages,
      topCountries,
      topReferrers,
    };
  } catch (e) {
    return emptyGa(rangeDays, e instanceof Error ? e.message : "Unknown GA4 error.");
  }
}

// ── Booking funnel (GA4 events fired by /book) ───────────────────────────────
//
// The /book page encodes every breakdown in the event NAME (book_step_details,
// book_avail_sold_out, book_missing_license_number, …) rather than in event
// parameters. GA4 exposes event names through the Data API out of the box,
// while parameters would each have to be registered as a custom dimension in
// the GA4 UI first. So this whole report needs zero GA4 configuration, and a
// new milestone becomes readable here the day it ships.

export interface FunnelStep {
  key: string;
  label: string;
  users: number;
  events: number;
  /** Share of the step above, 0..1. Null on the first step. */
  ofPrevious: number | null;
  /** Share of the first step, 0..1. */
  ofTop: number | null;
}

export interface FunnelBreakdownRow {
  key: string;
  label: string;
  users: number;
  events: number;
}

export interface BookingFunnelStats {
  connected: boolean;
  error?: string;
  rangeDays: number;
  /** True when the page has been instrumented but no event landed yet. */
  empty: boolean;
  steps: FunnelStep[];
  /** Same funnel restricted to sessions carrying a campaign name, i.e. the ads. */
  campaignSteps: FunnelStep[];
  /** Campaign names seen in the window, most sessions first. */
  campaignNames: string[];
  outcomes: FunnelBreakdownRow[];
  exits: FunnelBreakdownRow[];
  missingFields: FunnelBreakdownRow[];
  checkoutErrors: number;
}

// Ordered spine of the funnel. Keys are GA4 event names.
// Ordered spine of the funnel, matching the single-step booking page. The
// details and review steps were removed on 2026-07-28; their events survive in
// GA4 history but can never fire again, so listing them would show three rows
// collapsing to zero and read as a catastrophe rather than a redesign.
// Since 2026-07-30 the page opens on a suggested date range and prices it
// straight away, so "saw a price" now comes before any engagement and applies
// to nearly everyone. Picking their own dates is the real intent signal and
// sits after it. Rows read before that date keep the old meaning, where a
// price only ever appeared once the visitor had typed dates themselves.
const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: "book_step_dates", label: "Landed on /book" },
  { key: "__availability", label: "Saw a price" },
  { key: "book_dates_started", label: "Chose their own dates" },
  { key: "book_checkout_click", label: "Clicked pay" },
  { key: "book_checkout_redirect", label: "Sent to Stripe" },
];

const OUTCOME_LABELS: Record<string, string> = {
  book_avail_available: "Bikes available",
  book_avail_sold_out: "Sold out for those dates",
  book_avail_below_min_days: "Below the minimum duration",
  book_avail_past_date: "Pickup date in the past",
  book_avail_out_of_season: "Out of season",
  book_avail_error: "Availability check failed",
};

const EXIT_LABELS: Record<string, string> = {
  book_exit_dates: "Left on step 1 (dates)",
  book_exit_details: "Left on step 2 (details)",
  book_exit_review: "Left on step 3 (review)",
};

const MISSING_LABELS: Record<string, string> = {
  book_missing_first_name: "First name",
  book_missing_last_name: "Last name",
  book_missing_email: "Email",
  book_missing_license_number: "Motorcycle license number",
};

function emptyFunnel(rangeDays: number, error?: string): BookingFunnelStats {
  return {
    connected: false,
    error,
    rangeDays,
    empty: true,
    steps: [],
    campaignSteps: [],
    campaignNames: [],
    outcomes: [],
    exits: [],
    missingFields: [],
    checkoutErrors: 0,
  };
}

export async function getBookingFunnel(rangeDays = 30): Promise<BookingFunnelStats> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!hasCredentials()) return emptyFunnel(rangeDays, "Service account not configured (GOOGLE_SA_KEY_B64).");
  if (!propertyId) return emptyFunnel(rangeDays, "Missing GA4_PROPERTY_ID (numeric property id).");

  try {
    const token = await getAccessToken(["https://www.googleapis.com/auth/analytics.readonly"]);
    if (!token) return emptyFunnel(rangeDays, "Could not mint an access token.");

    const dateRanges = [{ startDate: `${rangeDays}daysAgo`, endDate: "today" }];
    // Only our own events: everything the booking page fires is prefixed
    // `book_`, so one filter keeps GA4's automatic events out.
    const bookEventsOnly = {
      filter: { fieldName: "eventName", stringFilter: { matchType: "BEGINS_WITH", value: "book_" } },
    };

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          requests: [
            // All traffic, one row per event name.
            {
              dateRanges,
              dimensions: [{ name: "eventName" }],
              metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
              dimensionFilter: bookEventsOnly,
              limit: "200",
            },
            // Same, split by campaign. Deliberately NOT by channel group: the
            // Meta ads have been arriving tagged utm_medium=social, which GA4
            // files under "Organic Social", so a channel filter would drop
            // almost all of the paid traffic. A campaign name is set by the ad
            // whatever medium it declares.
            {
              dateRanges,
              dimensions: [{ name: "eventName" }, { name: "sessionCampaignName" }],
              metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
              dimensionFilter: bookEventsOnly,
              limit: "1000",
            },
          ],
        }),
      }
    );
    if (!res.ok) return emptyFunnel(rangeDays, `GA4 API ${res.status}: ${(await res.text()).slice(0, 200)}`);

    const json = (await res.json()) as { reports?: GaReport[] };
    const num = (v?: string) => (v ? Number(v) : 0);

    // eventName -> { events, users }
    const all = new Map<string, { events: number; users: number }>();
    for (const r of json.reports?.[0]?.rows ?? []) {
      const name = r.dimensionValues?.[0]?.value ?? "";
      all.set(name, { events: num(r.metricValues?.[0]?.value), users: num(r.metricValues?.[1]?.value) });
    }
    // GA4 fills the campaign dimension with these placeholders when a session
    // came from anywhere but an ad.
    const NOT_A_CAMPAIGN = new Set([
      "",
      "(not set)",
      "(none)",
      "(direct)",
      "(organic)",
      "(referral)",
      "(data deleted)",
    ]);
    const campaign = new Map<string, { events: number; users: number }>();
    const campaignSessions = new Map<string, number>();
    for (const r of json.reports?.[1]?.rows ?? []) {
      const name = r.dimensionValues?.[0]?.value ?? "";
      const campaignName = r.dimensionValues?.[1]?.value ?? "";
      if (NOT_A_CAMPAIGN.has(campaignName.toLowerCase())) continue;
      const events = num(r.metricValues?.[0]?.value);
      const users = num(r.metricValues?.[1]?.value);
      const prev = campaign.get(name) ?? { events: 0, users: 0 };
      campaign.set(name, { events: prev.events + events, users: prev.users + users });
      campaignSessions.set(campaignName, (campaignSessions.get(campaignName) ?? 0) + events);
    }

    // "Saw a price" is any availability answer, whatever it said.
    const sumAvailability = (m: Map<string, { events: number; users: number }>) => {
      let events = 0;
      let users = 0;
      for (const [name, v] of m) {
        if (!name.startsWith("book_avail_")) continue;
        events += v.events;
        users += v.users; // upper bound: a visitor searching twice with two outcomes counts twice
      }
      return { events, users };
    };

    const buildSteps = (m: Map<string, { events: number; users: number }>): FunnelStep[] => {
      const raw = FUNNEL_STEPS.map((s) => {
        const v = s.key === "__availability" ? sumAvailability(m) : (m.get(s.key) ?? { events: 0, users: 0 });
        return { ...s, users: v.users, events: v.events };
      });
      const top = raw[0]?.users ?? 0;
      return raw.map((s, i) => {
        const above = i === 0 ? null : raw[i - 1].users;
        return {
          ...s,
          ofPrevious: above && above > 0 ? s.users / above : null,
          ofTop: top > 0 ? s.users / top : null,
        };
      });
    };

    const breakdown = (labels: Record<string, string>): FunnelBreakdownRow[] =>
      Object.entries(labels)
        .map(([key, label]) => {
          const v = all.get(key) ?? { events: 0, users: 0 };
          return { key, label, users: v.users, events: v.events };
        })
        .filter((r) => r.events > 0)
        .sort((a, b) => b.events - a.events);

    const steps = buildSteps(all);

    return {
      connected: true,
      rangeDays,
      empty: all.size === 0,
      steps,
      campaignSteps: campaign.size > 0 ? buildSteps(campaign) : [],
      campaignNames: [...campaignSessions.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name]) => name),
      outcomes: breakdown(OUTCOME_LABELS),
      exits: breakdown(EXIT_LABELS),
      missingFields: breakdown(MISSING_LABELS),
      checkoutErrors: all.get("book_checkout_error")?.events ?? 0,
    };
  } catch (e) {
    return emptyFunnel(rangeDays, e instanceof Error ? e.message : "Unknown GA4 error.");
  }
}

// ── Search Console ───────────────────────────────────────────────────────────

export interface GscTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscStats {
  connected: boolean;
  error?: string;
  startDate: string;
  endDate: string;
  totals: GscTotals;
  /** Same window length immediately before this one; null if the call failed. */
  previousTotals: GscTotals | null;
  previousRange: { startDate: string; endDate: string } | null;
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    previousClicks: number | null;
  }[];
  topPages: { page: string; clicks: number; impressions: number; previousClicks: number | null }[];
}

function emptyGsc(startDate: string, endDate: string, error?: string): GscStats {
  return {
    connected: false,
    error,
    startDate,
    endDate,
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    previousTotals: null,
    previousRange: null,
    topQueries: [],
    topPages: [],
  };
}

export async function getGscStats(rangeDays = 28): Promise<GscStats> {
  // GSC data lags ~2-3 days; end the window 3 days back so it isn't mostly empty.
  const endDate = daysAgo(3);
  const startDate = daysAgo(3 + rangeDays);
  const siteUrl = process.env.GSC_SITE_URL;

  if (!hasCredentials()) return emptyGsc(startDate, endDate, "Service account not configured (GOOGLE_SA_KEY_B64).");
  if (!siteUrl)
    return emptyGsc(startDate, endDate, "Missing GSC_SITE_URL (e.g. sc-domain:vintageridesusa.com).");

  try {
    const token = await getAccessToken(["https://www.googleapis.com/auth/webmasters.readonly"]);
    if (!token) return emptyGsc(startDate, endDate, "Could not mint an access token.");

    const base = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`;

    type GscRows = {
      rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    };

    const query = async (dimensions: string[], rowLimit: number, range = { startDate, endDate }) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...range, dimensions, rowLimit }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`GSC API ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return (await res.json()) as GscRows;
    };

    // Window of equal length ending the day before the current one starts.
    const previousRange = {
      startDate: daysAgo(3 + rangeDays * 2 + 1),
      endDate: daysAgo(3 + rangeDays + 1),
    };
    // Deeper row limits on the comparison side: today's #3 query may have been
    // ranked far lower before, and we still need its old click count.
    const compare = async (): Promise<[GscRows, GscRows, GscRows] | null> => {
      try {
        return await Promise.all([
          query([], 1, previousRange),
          query(["query"], 500, previousRange),
          query(["page"], 500, previousRange),
        ]);
      } catch {
        return null; // comparison is a nicety, never a reason to blank the panel
      }
    };

    const [totalsRes, queriesRes, pagesRes, prev] = await Promise.all([
      query([], 1),
      query(["query"], 10),
      query(["page"], 10),
      compare(),
    ]);

    const prevTot = prev?.[0].rows?.[0];
    const clicksByKey = (rows: GscRows | undefined) => {
      if (!rows) return null;
      const m = new Map<string, number>();
      for (const r of rows.rows ?? []) m.set(r.keys?.[0] ?? "—", r.clicks);
      return m;
    };
    const prevQueryClicks = clicksByKey(prev?.[1]);
    const prevPageClicks = clicksByKey(prev?.[2]);
    const lookup = (m: Map<string, number> | null, key: string) => (m ? (m.get(key) ?? 0) : null);

    const tot = totalsRes.rows?.[0];
    return {
      connected: true,
      startDate,
      endDate,
      totals: {
        clicks: tot?.clicks ?? 0,
        impressions: tot?.impressions ?? 0,
        ctr: tot?.ctr ?? 0,
        position: tot?.position ?? 0,
      },
      previousTotals: prev
        ? {
            clicks: prevTot?.clicks ?? 0,
            impressions: prevTot?.impressions ?? 0,
            ctr: prevTot?.ctr ?? 0,
            position: prevTot?.position ?? 0,
          }
        : null,
      previousRange: prev ? previousRange : null,
      topQueries: (queriesRes.rows ?? []).map((r) => ({
        query: r.keys?.[0] ?? "—",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        previousClicks: lookup(prevQueryClicks, r.keys?.[0] ?? "—"),
      })),
      topPages: (pagesRes.rows ?? []).map((r) => ({
        page: r.keys?.[0] ?? "—",
        clicks: r.clicks,
        impressions: r.impressions,
        previousClicks: lookup(prevPageClicks, r.keys?.[0] ?? "—"),
      })),
    };
  } catch (e) {
    return emptyGsc(startDate, endDate, e instanceof Error ? e.message : "Unknown GSC error.");
  }
}

// ── Google Business Profile (performance + reviews) ──────────────────────────

export interface GbpStats {
  connected: boolean;
  error?: string;
  reviewsError?: string;
  keywordsError?: string;
  rangeDays: number;
  startDate: string;
  endDate: string;
  profile?: { title: string; mapsUri?: string; newReviewUri?: string };
  performance: {
    callClicks: number;
    websiteClicks: number;
    directionRequests: number;
    searchImpressions: number;
    mapsImpressions: number;
  };
  /** Daily series over the window, for the trend chart. */
  byDay: { date: string; views: number; actions: number }[];
  /**
   * Keywords people searched before landing on the profile. Google withholds
   * exact counts for low-volume terms and returns a threshold instead, so
   * `isThreshold` means "fewer than `impressions`", not "equal to".
   */
  searchKeywords: { keyword: string; impressions: number; isThreshold: boolean }[];
  reviews: {
    averageRating: number;
    totalCount: number;
    /** Fetched reviews with no owner reply — these need answering. */
    unanswered: number;
    recent: { author: string; rating: number; comment: string; date: string; replied: boolean }[];
  };
}

function emptyGbp(rangeDays: number, error?: string): GbpStats {
  return {
    connected: false,
    error,
    rangeDays,
    startDate: "",
    endDate: "",
    performance: {
      callClicks: 0,
      websiteClicks: 0,
      directionRequests: 0,
      searchImpressions: 0,
      mapsImpressions: 0,
    },
    byDay: [],
    searchKeywords: [],
    reviews: { averageRating: 0, totalCount: 0, unanswered: 0, recent: [] },
  };
}

const STAR_TO_NUM: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/**
 * Unwrap a Google API error body to its `error.message`. Raw bodies are JSON
 * blobs that read as gibberish when surfaced in the dashboard.
 */
async function googleErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message ?? text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

/** A disabled-API 403 is an ops task, not a bug — say so in plain words. */
function explainApiError(message: string, apiLabel: string, consoleApi: string): string {
  if (/has not been used in project|is disabled/i.test(message)) {
    return `${apiLabel} is not enabled on the Google Cloud project. Enable "${consoleApi}" in the API library, then reload.`;
  }
  if (/quota|429/i.test(message)) {
    return `${apiLabel} has no quota on this project yet. Request access via the Business Profile API form.`;
  }
  return message;
}

interface GbpLocation {
  accountName: string;
  locationId: string;
  title: string;
  mapsUri?: string;
  newReviewUri?: string;
}

const LOCATION_READ_MASK = "name,title,metadata";

/** Resolve the account + location resource names, honouring env overrides. */
async function resolveGbpLocation(token: string): Promise<GbpLocation> {
  const headers = { Authorization: `Bearer ${token}` };
  const envLoc = process.env.GBP_LOCATION_ID?.replace(/^locations\//, ""); // "locations/123" or "123"
  const envAcc = process.env.GBP_ACCOUNT_ID; // "accounts/123" or "123"

  const toLocation = (
    accountName: string,
    loc: { name?: string; title?: string; metadata?: { mapsUri?: string; newReviewUri?: string } }
  ): GbpLocation => ({
    accountName,
    locationId: (loc.name ?? "").replace(/^locations\//, ""),
    title: loc.title ?? "Business Profile",
    mapsUri: loc.metadata?.mapsUri,
    newReviewUri: loc.metadata?.newReviewUri,
  });

  // Explicit location: fetch it directly so we still get title + maps links.
  if (envLoc && envAcc) {
    const accountName = envAcc.startsWith("accounts/") ? envAcc : `accounts/${envAcc}`;
    const res = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${envLoc}?readMask=${LOCATION_READ_MASK}`,
      { headers, cache: "no-store" }
    );
    // Env pins the id, so a failed detail lookup shouldn't break the whole panel.
    if (!res.ok) return { accountName, locationId: envLoc, title: "Business Profile" };
    const loc = (await res.json()) as { name?: string; title?: string };
    return toLocation(accountName, { ...loc, name: `locations/${envLoc}` });
  }

  const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers,
    cache: "no-store",
  });
  if (!accRes.ok) {
    throw new Error(
      explainApiError(await googleErrorMessage(accRes), "The Business Profile API", "My Business Account Management API")
    );
  }
  const accJson = (await accRes.json()) as { accounts?: { name: string }[] };
  const accountName = accJson.accounts?.[0]?.name;
  if (!accountName) {
    throw new Error("Service account sees no Business Profile accounts (not granted manager access yet).");
  }

  const locRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${LOCATION_READ_MASK}&pageSize=10`,
    { headers, cache: "no-store" }
  );
  if (!locRes.ok) {
    throw new Error(
      explainApiError(await googleErrorMessage(locRes), "The Business Information API", "My Business Business Information API")
    );
  }
  const locJson = (await locRes.json()) as {
    locations?: { name?: string; title?: string; metadata?: { mapsUri?: string; newReviewUri?: string } }[];
  };
  const match = envLoc
    ? locJson.locations?.find((l) => l.name?.endsWith(envLoc))
    : locJson.locations?.[0];
  if (!match) throw new Error("No locations found for the Business Profile account.");
  return toLocation(accountName, match);
}

const PERF_METRICS = [
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
] as const;

type DatedValue = { date?: { year?: number; month?: number; day?: number }; value?: string };

function ymdKey(d?: { year?: number; month?: number; day?: number }): string {
  if (!d?.year || !d.month || !d.day) return "";
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export async function getGbpStats(rangeDays = 90): Promise<GbpStats> {
  if (!hasCredentials()) return emptyGbp(rangeDays, "Service account not configured (GOOGLE_SA_KEY_B64).");

  // Performance lags ~1 day, so end the window yesterday.
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - rangeDays);

  try {
    const token = await getAccessToken(
      ["https://www.googleapis.com/auth/business.manage"],
      process.env.GBP_IMPERSONATE // set to a GBP manager email once DWD is authorised
    );
    if (!token) return emptyGbp(rangeDays, "Could not mint an access token.");
    const headers = { Authorization: `Bearer ${token}` };

    const loc = await resolveGbpLocation(token);

    const out = emptyGbp(rangeDays);
    out.connected = true;
    out.startDate = start.toISOString().slice(0, 10);
    out.endDate = end.toISOString().slice(0, 10);
    out.profile = { title: loc.title, mapsUri: loc.mapsUri, newReviewUri: loc.newReviewUri };

    const perfParams = new URLSearchParams();
    PERF_METRICS.forEach((m) => perfParams.append("dailyMetrics", m));
    perfParams.set("dailyRange.start_date.year", String(start.getUTCFullYear()));
    perfParams.set("dailyRange.start_date.month", String(start.getUTCMonth() + 1));
    perfParams.set("dailyRange.start_date.day", String(start.getUTCDate()));
    perfParams.set("dailyRange.end_date.year", String(end.getUTCFullYear()));
    perfParams.set("dailyRange.end_date.month", String(end.getUTCMonth() + 1));
    perfParams.set("dailyRange.end_date.day", String(end.getUTCDate()));

    // Search keywords are monthly-only; span the same months as the daily window.
    const kwParams = new URLSearchParams({
      "monthlyRange.start_month.year": String(start.getUTCFullYear()),
      "monthlyRange.start_month.month": String(start.getUTCMonth() + 1),
      "monthlyRange.end_month.year": String(end.getUTCFullYear()),
      "monthlyRange.end_month.month": String(end.getUTCMonth() + 1),
      pageSize: "25",
    });

    const [perfRes, revRes, kwRes] = await Promise.all([
      fetch(
        `https://businessprofileperformance.googleapis.com/v1/locations/${loc.locationId}:fetchMultiDailyMetricsTimeSeries?${perfParams}`,
        { headers, cache: "no-store" }
      ),
      // Reviews live only on the legacy v4 API, enabled separately from the rest.
      fetch(
        `https://mybusiness.googleapis.com/v4/${loc.accountName}/locations/${loc.locationId}/reviews?pageSize=20&orderBy=updateTime%20desc`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `https://businessprofileperformance.googleapis.com/v1/locations/${loc.locationId}/searchkeywords/impressions/monthly?${kwParams}`,
        { headers, cache: "no-store" }
      ),
    ]);

    if (perfRes.ok) {
      const perfJson = (await perfRes.json()) as {
        multiDailyMetricTimeSeries?: {
          dailyMetricTimeSeries?: {
            dailyMetric?: string;
            timeSeries?: { datedValues?: DatedValue[] };
          }[];
        }[];
      };

      const series = new Map<string, Map<string, number>>();
      for (const multi of perfJson.multiDailyMetricTimeSeries ?? []) {
        for (const s of multi.dailyMetricTimeSeries ?? []) {
          if (!s.dailyMetric) continue;
          const byDate = series.get(s.dailyMetric) ?? new Map<string, number>();
          for (const dv of s.timeSeries?.datedValues ?? []) {
            const key = ymdKey(dv.date);
            if (key) byDate.set(key, (byDate.get(key) ?? 0) + Number(dv.value ?? 0));
          }
          series.set(s.dailyMetric, byDate);
        }
      }
      const sumFor = (metric: string) =>
        [...(series.get(metric)?.values() ?? [])].reduce((a, b) => a + b, 0);
      const on = (metric: string, date: string) => series.get(metric)?.get(date) ?? 0;

      out.performance = {
        callClicks: sumFor("CALL_CLICKS"),
        websiteClicks: sumFor("WEBSITE_CLICKS"),
        directionRequests: sumFor("BUSINESS_DIRECTION_REQUESTS"),
        searchImpressions:
          sumFor("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") + sumFor("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"),
        mapsImpressions:
          sumFor("BUSINESS_IMPRESSIONS_DESKTOP_MAPS") + sumFor("BUSINESS_IMPRESSIONS_MOBILE_MAPS"),
      };

      const dates = [...new Set([...series.values()].flatMap((m) => [...m.keys()]))].sort();
      out.byDay = dates.map((date) => ({
        date,
        views:
          on("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", date) +
          on("BUSINESS_IMPRESSIONS_MOBILE_SEARCH", date) +
          on("BUSINESS_IMPRESSIONS_DESKTOP_MAPS", date) +
          on("BUSINESS_IMPRESSIONS_MOBILE_MAPS", date),
        actions:
          on("CALL_CLICKS", date) + on("WEBSITE_CLICKS", date) + on("BUSINESS_DIRECTION_REQUESTS", date),
      }));
    } else {
      out.error = explainApiError(
        await googleErrorMessage(perfRes),
        "The Business Profile Performance API",
        "Business Profile Performance API"
      );
    }

    if (revRes.ok) {
      const revJson = (await revRes.json()) as {
        averageRating?: number;
        totalReviewCount?: number;
        reviews?: {
          reviewer?: { displayName?: string };
          starRating?: string;
          comment?: string;
          createTime?: string;
          reviewReply?: { comment?: string };
        }[];
      };
      const reviews = revJson.reviews ?? [];
      out.reviews = {
        averageRating: revJson.averageRating ?? 0,
        totalCount: revJson.totalReviewCount ?? 0,
        unanswered: reviews.filter((r) => !r.reviewReply).length,
        recent: reviews.slice(0, 6).map((r) => ({
          author: r.reviewer?.displayName ?? "Anonymous",
          rating: STAR_TO_NUM[r.starRating ?? ""] ?? 0,
          comment: r.comment ?? "",
          date: r.createTime?.slice(0, 10) ?? "",
          replied: Boolean(r.reviewReply),
        })),
      };
    } else {
      out.reviewsError = explainApiError(
        await googleErrorMessage(revRes),
        "The reviews API",
        "Google My Business API"
      );
    }

    if (kwRes.ok) {
      const kwJson = (await kwRes.json()) as {
        searchKeywordsCounts?: {
          searchKeyword?: string;
          insightsValue?: { value?: string; threshold?: string };
        }[];
      };
      out.searchKeywords = (kwJson.searchKeywordsCounts ?? [])
        .map((r) => {
          const exact = r.insightsValue?.value;
          return {
            keyword: r.searchKeyword ?? "—",
            impressions: Number(exact ?? r.insightsValue?.threshold ?? 0),
            isThreshold: exact === undefined,
          };
        })
        .filter((k) => k.keyword !== "—")
        // Exact counts first (descending), then the withheld low-volume terms.
        .sort((a, b) => {
          if (a.isThreshold !== b.isThreshold) return a.isThreshold ? 1 : -1;
          if (a.impressions !== b.impressions) return b.impressions - a.impressions;
          return a.keyword.localeCompare(b.keyword);
        });
    } else {
      out.keywordsError = explainApiError(
        await googleErrorMessage(kwRes),
        "The search keywords API",
        "Business Profile Performance API"
      );
    }

    return out;
  } catch (e) {
    return emptyGbp(rangeDays, e instanceof Error ? e.message : "Unknown GBP error.");
  }
}
