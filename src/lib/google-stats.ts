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

export interface GaStats {
  connected: boolean;
  error?: string;
  rangeDays: number;
  totals: {
    sessions: number;
    activeUsers: number;
    newUsers: number;
    pageViews: number;
    engagementRate: number; // 0..1
    avgSessionDurationSec: number;
  };
  byDay: { date: string; sessions: number }[];
  topChannels: { label: string; sessions: number }[];
  topPages: { path: string; views: number }[];
  topCountries: { label: string; sessions: number }[];
}

function emptyGa(rangeDays: number, error?: string): GaStats {
  return {
    connected: false,
    error,
    rangeDays,
    totals: {
      sessions: 0,
      activeUsers: 0,
      newUsers: 0,
      pageViews: 0,
      engagementRate: 0,
      avgSessionDurationSec: 0,
    },
    byDay: [],
    topChannels: [],
    topPages: [],
    topCountries: [],
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

    const dateRanges = [{ startDate: `${rangeDays}daysAgo`, endDate: "today" }];
    const body = {
      requests: [
        // 0: headline totals
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
        // 1: sessions by day
        {
          dateRanges,
          dimensions: [{ name: "date" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        },
        // 2: channels
        {
          dateRanges,
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "8",
        },
        // 3: top pages
        {
          dateRanges,
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: "10",
        },
        // 4: top countries
        {
          dateRanges,
          dimensions: [{ name: "country" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "6",
        },
      ],
    };

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    if (!res.ok) return emptyGa(rangeDays, `GA4 API ${res.status}: ${(await res.text()).slice(0, 200)}`);

    const json = (await res.json()) as { reports?: GaReport[] };
    const reports = json.reports ?? [];
    const num = (v?: string) => (v ? Number(v) : 0);

    const t = reports[0]?.rows?.[0]?.metricValues ?? [];
    const byDay = (reports[1]?.rows ?? []).map((r) => {
      const raw = r.dimensionValues?.[0]?.value ?? ""; // YYYYMMDD
      const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
      return { date, sessions: num(r.metricValues?.[0]?.value) };
    });
    const topChannels = (reports[2]?.rows ?? []).map((r) => ({
      label: r.dimensionValues?.[0]?.value ?? "—",
      sessions: num(r.metricValues?.[0]?.value),
    }));
    const topPages = (reports[3]?.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "—",
      views: num(r.metricValues?.[0]?.value),
    }));
    const topCountries = (reports[4]?.rows ?? []).map((r) => ({
      label: r.dimensionValues?.[0]?.value ?? "—",
      sessions: num(r.metricValues?.[0]?.value),
    }));

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
      byDay,
      topChannels,
      topPages,
      topCountries,
    };
  } catch (e) {
    return emptyGa(rangeDays, e instanceof Error ? e.message : "Unknown GA4 error.");
  }
}

// ── Search Console ───────────────────────────────────────────────────────────

export interface GscStats {
  connected: boolean;
  error?: string;
  startDate: string;
  endDate: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
}

function emptyGsc(startDate: string, endDate: string, error?: string): GscStats {
  return {
    connected: false,
    error,
    startDate,
    endDate,
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
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

    const query = async (dimensions: string[], rowLimit: number) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`GSC API ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return (await res.json()) as {
        rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
      };
    };

    const [totalsRes, queriesRes, pagesRes] = await Promise.all([
      query([], 1),
      query(["query"], 10),
      query(["page"], 10),
    ]);

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
      topQueries: (queriesRes.rows ?? []).map((r) => ({
        query: r.keys?.[0] ?? "—",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topPages: (pagesRes.rows ?? []).map((r) => ({
        page: r.keys?.[0] ?? "—",
        clicks: r.clicks,
        impressions: r.impressions,
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
    recent: { author: string; rating: number; comment: string; date: string }[];
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
    reviews: { averageRating: 0, totalCount: 0, recent: [] },
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
        }[];
      };
      out.reviews = {
        averageRating: revJson.averageRating ?? 0,
        totalCount: revJson.totalReviewCount ?? 0,
        recent: (revJson.reviews ?? []).slice(0, 6).map((r) => ({
          author: r.reviewer?.displayName ?? "Anonymous",
          rating: STAR_TO_NUM[r.starRating ?? ""] ?? 0,
          comment: r.comment ?? "",
          date: r.createTime?.slice(0, 10) ?? "",
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
