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
  rangeDays: number;
  performance: {
    callClicks: number;
    websiteClicks: number;
    directionRequests: number;
    searchImpressions: number;
    mapsImpressions: number;
  };
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
    performance: {
      callClicks: 0,
      websiteClicks: 0,
      directionRequests: 0,
      searchImpressions: 0,
      mapsImpressions: 0,
    },
    reviews: { averageRating: 0, totalCount: 0, recent: [] },
  };
}

const STAR_TO_NUM: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/** Resolve the account + location resource names, honouring env overrides. */
async function resolveGbpLocation(
  token: string
): Promise<{ accountName: string; locationId: string } | null> {
  const envLoc = process.env.GBP_LOCATION_ID; // "locations/123" or "123"
  const envAcc = process.env.GBP_ACCOUNT_ID; // "accounts/123" or "123"
  if (envLoc && envAcc) {
    return {
      accountName: envAcc.startsWith("accounts/") ? envAcc : `accounts/${envAcc}`,
      locationId: envLoc.replace(/^locations\//, ""),
    };
  }

  const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!accRes.ok) throw new Error(`accounts ${accRes.status}: ${(await accRes.text()).slice(0, 160)}`);
  const accJson = (await accRes.json()) as { accounts?: { name: string }[] };
  const accountName = accJson.accounts?.[0]?.name;
  if (!accountName) throw new Error("Service account sees no Business Profile accounts (not granted manager access yet).");

  if (envLoc) return { accountName, locationId: envLoc.replace(/^locations\//, "") };

  const locRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title&pageSize=10`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!locRes.ok) throw new Error(`locations ${locRes.status}: ${(await locRes.text()).slice(0, 160)}`);
  const locJson = (await locRes.json()) as { locations?: { name: string }[] };
  const locName = locJson.locations?.[0]?.name; // "locations/123"
  if (!locName) throw new Error("No locations found for the Business Profile account.");
  return { accountName, locationId: locName.replace(/^locations\//, "") };
}

export async function getGbpStats(rangeDays = 90): Promise<GbpStats> {
  if (!hasCredentials()) return emptyGbp(rangeDays, "Service account not configured (GOOGLE_SA_KEY_B64).");

  try {
    const token = await getAccessToken(
      ["https://www.googleapis.com/auth/business.manage"],
      process.env.GBP_IMPERSONATE // set to a GBP manager email once DWD is authorised
    );
    if (!token) return emptyGbp(rangeDays, "Could not mint an access token.");

    const loc = await resolveGbpLocation(token);
    if (!loc) return emptyGbp(rangeDays, "Could not resolve a Business Profile location.");

    const out = emptyGbp(rangeDays);
    out.connected = true;

    // Performance metrics (last `rangeDays`, ending 1 day ago — GBP also lags).
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - rangeDays);
    const ymd = (d: Date) => ({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() });
    const s = ymd(start);
    const e = ymd(end);
    const metrics = [
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    ];
    const params = new URLSearchParams();
    metrics.forEach((m) => params.append("dailyMetrics", m));
    params.set("dailyRange.start_date.year", String(s.y));
    params.set("dailyRange.start_date.month", String(s.m));
    params.set("dailyRange.start_date.day", String(s.d));
    params.set("dailyRange.end_date.year", String(e.y));
    params.set("dailyRange.end_date.month", String(e.m));
    params.set("dailyRange.end_date.day", String(e.d));

    const perfRes = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/locations/${loc.locationId}:fetchMultiDailyMetricsTimeSeries?${params}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (perfRes.ok) {
      const perfJson = (await perfRes.json()) as {
        multiDailyMetricTimeSeries?: {
          dailyMetricTimeSeries?: {
            dailyMetric?: string;
            timeSeries?: { datedValues?: { value?: string }[] };
          }[];
        }[];
      };
      const sumFor = (metric: string) => {
        let total = 0;
        for (const multi of perfJson.multiDailyMetricTimeSeries ?? []) {
          for (const series of multi.dailyMetricTimeSeries ?? []) {
            if (series.dailyMetric !== metric) continue;
            for (const dv of series.timeSeries?.datedValues ?? []) total += Number(dv.value ?? 0);
          }
        }
        return total;
      };
      out.performance = {
        callClicks: sumFor("CALL_CLICKS"),
        websiteClicks: sumFor("WEBSITE_CLICKS"),
        directionRequests: sumFor("BUSINESS_DIRECTION_REQUESTS"),
        searchImpressions:
          sumFor("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") + sumFor("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"),
        mapsImpressions:
          sumFor("BUSINESS_IMPRESSIONS_DESKTOP_MAPS") + sumFor("BUSINESS_IMPRESSIONS_MOBILE_MAPS"),
      };
    } else {
      out.error = `Performance API ${perfRes.status}: ${(await perfRes.text()).slice(0, 160)}`;
    }

    // Reviews (legacy My Business v4 — may require allowlisting; handled softly).
    const revRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${loc.accountName}/locations/${loc.locationId}/reviews?pageSize=20&orderBy=updateTime%20desc`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
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
      out.reviewsError = `Reviews API ${revRes.status}: ${(await revRes.text()).slice(0, 160)}`;
    }

    return out;
  } catch (e) {
    return emptyGbp(rangeDays, e instanceof Error ? e.message : "Unknown GBP error.");
  }
}
