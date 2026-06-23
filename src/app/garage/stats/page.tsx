import { getTurnoverStats, B2B_BIKE_DAY_RATE } from "@/lib/airtable";
import { getGaStats, getGscStats, getGbpStats } from "@/lib/google-stats";
import { Globe, Search, Star, TrendingUp, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const int = new Intl.NumberFormat("en-US");
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const MONTH_LABEL = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
};

// ── Small presentational helpers ─────────────────────────────────────────────

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 font-serif text-2xl text-[var(--brand-olive-700)]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline gap-2.5">
      <Icon className="size-5 translate-y-0.5 text-[var(--brand-olive-700)]" />
      <h2 className="font-serif text-lg">{title}</h2>
      {meta ? <span className="text-xs text-muted-foreground">· {meta}</span> : null}
    </div>
  );
}

function NotConnected({ error, hint }: { error?: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-5 text-sm shadow-sm">
      <div className="flex items-center gap-2 font-medium text-amber-800">
        <AlertCircle className="size-4" /> Not connected yet
      </div>
      <p className="mt-1.5 text-amber-900/80">{hint}</p>
      {error ? (
        <p className="mt-2 font-mono text-xs break-words text-amber-900/60">{error}</p>
      ) : null}
    </div>
  );
}

/** Horizontal labelled bar, value-proportional. */
function BarList({
  rows,
  max,
  unit = "",
}: {
  rows: { label: string; value: number; right?: string }[];
  max: number;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-muted-foreground" title={r.label}>
            {r.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-[var(--brand-cream)]">
            <div
              className="h-full rounded bg-[var(--brand-olive-700)]"
              style={{ width: `${max > 0 ? Math.max(2, (r.value / max) * 100) : 0}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right tabular-nums">
            {r.right ?? `${int.format(r.value)}${unit}`}
          </span>
        </div>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No data.</p> : null}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const [turnover, ga, gsc, gbp] = await Promise.all([
    getTurnoverStats(),
    getGaStats(30),
    getGscStats(28),
    getGbpStats(90),
  ]);

  const maxMonth = Math.max(1, ...turnover.byMonth.map((m) => m.total));
  const website = turnover.byChannel.find((c) => c.channel === "WEBSITE")!;
  const b2b = turnover.byChannel.find((c) => c.channel === "B2B")!;

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header>
        <h1 className="font-serif text-2xl text-[var(--brand-olive-700)]">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Turnover &amp; marketing performance · live from Airtable, Google Analytics, Search Console
          &amp; Business Profile
        </p>
      </header>

      {/* ── Turnover ───────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={TrendingUp} title="Turnover" meta="bookings excl. cancelled" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="All-time" value={usd.format(turnover.total)} sub={`${turnover.bookings} bookings`} />
          <Kpi label="This year" value={usd.format(turnover.thisYear)} />
          <Kpi label="This month" value={usd.format(turnover.thisMonth)} />
          <Kpi
            label="Avg / booking"
            value={usd.format(turnover.bookings ? turnover.total / turnover.bookings : 0)}
          />
        </div>

        {/* Channel split */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">Direct (website)</p>
              <span className="font-serif text-lg text-[var(--brand-olive-700)]">
                {usd.format(website.turnover)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {website.bookings} bookings · real booking totals (incl. tax)
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">B2B / marketplace</p>
              <span className="font-serif text-lg text-amber-600">
                {usd.format(b2b.turnover)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {b2b.bookings} bookings · {int.format(b2b.bikeDays)} bike-days × ${B2B_BIKE_DAY_RATE}/bike-day
            </p>
          </div>
        </div>

        {/* 12-month chart */}
        <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">Last 12 months</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[var(--brand-olive-700)]" /> Direct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-amber-600" /> B2B
              </span>
            </div>
          </div>
          <div className="flex h-44 items-end gap-1.5">
            {turnover.byMonth.map((m) => {
              // Explicit pixel heights: percentage heights collapse here because
              // the column's own height is content-derived (no fixed reference).
              const MAX_BAR_PX = 150;
              const barPx = m.total > 0 ? Math.max(3, (m.total / maxMonth) * MAX_BAR_PX) : 0;
              const webPx = m.total > 0 ? (m.website / m.total) * barPx : 0;
              const b2bPx = m.total > 0 ? (m.b2b / m.total) * barPx : 0;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                    style={{ height: `${barPx}px` }}
                    title={`${m.month}: ${usd.format(m.total)}`}
                  >
                    <div className="w-full bg-[var(--brand-olive-700)]" style={{ height: `${webPx}px` }} />
                    <div className="w-full bg-amber-600" style={{ height: `${b2bPx}px` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{MONTH_LABEL(m.month)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Google Analytics ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Globe} title="Website traffic" meta={`Google Analytics · last ${ga.rangeDays} days`} />
        {ga.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Sessions" value={int.format(ga.totals.sessions)} />
              <Kpi label="Users" value={int.format(ga.totals.activeUsers)} />
              <Kpi label="New users" value={int.format(ga.totals.newUsers)} />
              <Kpi label="Page views" value={int.format(ga.totals.pageViews)} />
              <Kpi label="Engagement" value={pct(ga.totals.engagementRate)} />
              <Kpi
                label="Avg session"
                value={`${Math.round(ga.totals.avgSessionDurationSec)}s`}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top channels</p>
                <BarList
                  rows={ga.topChannels.map((c) => ({ label: c.label, value: c.sessions }))}
                  max={Math.max(1, ...ga.topChannels.map((c) => c.sessions))}
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top countries</p>
                <BarList
                  rows={ga.topCountries.map((c) => ({ label: c.label, value: c.sessions }))}
                  max={Math.max(1, ...ga.topCountries.map((c) => c.sessions))}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-3 font-medium">Top pages</p>
              <BarList
                rows={ga.topPages.map((p) => ({ label: p.path, value: p.views }))}
                max={Math.max(1, ...ga.topPages.map((p) => p.views))}
              />
            </div>
          </div>
        ) : (
          <NotConnected
            error={ga.error}
            hint="Grant the service account Viewer access in GA4 Admin → Property Access, then set GA4_PROPERTY_ID (numeric)."
          />
        )}
      </section>

      {/* ── Search Console ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Search}
          title="Search performance"
          meta={`Search Console · ${gsc.startDate} → ${gsc.endDate}`}
        />
        {gsc.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Clicks" value={int.format(gsc.totals.clicks)} />
              <Kpi label="Impressions" value={int.format(gsc.totals.impressions)} />
              <Kpi label="CTR" value={pct(gsc.totals.ctr)} />
              <Kpi label="Avg position" value={gsc.totals.position.toFixed(1)} />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top queries</p>
                <BarList
                  rows={gsc.topQueries.map((q) => ({
                    label: q.query,
                    value: q.clicks,
                    right: `${int.format(q.clicks)} clk`,
                  }))}
                  max={Math.max(1, ...gsc.topQueries.map((q) => q.clicks))}
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top pages</p>
                <BarList
                  rows={gsc.topPages.map((p) => ({
                    label: p.page.replace(/^https?:\/\/[^/]+/, "") || "/",
                    value: p.clicks,
                    right: `${int.format(p.clicks)} clk`,
                  }))}
                  max={Math.max(1, ...gsc.topPages.map((p) => p.clicks))}
                />
              </div>
            </div>
          </div>
        ) : (
          <NotConnected
            error={gsc.error}
            hint="Add the service account as a user on the Search Console property, then set GSC_SITE_URL (e.g. sc-domain:vintageridesusa.com)."
          />
        )}
      </section>

      {/* ── Google Business Profile ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Star}
          title="Google Business Profile"
          meta={`reviews · performance last ${gbp.rangeDays} days`}
        />
        {gbp.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              <Kpi
                label="Rating"
                value={gbp.reviews.totalCount ? `${gbp.reviews.averageRating.toFixed(1)}★` : "—"}
                sub={gbp.reviews.totalCount ? `${gbp.reviews.totalCount} reviews` : undefined}
              />
              <Kpi label="Calls" value={int.format(gbp.performance.callClicks)} />
              <Kpi label="Website clicks" value={int.format(gbp.performance.websiteClicks)} />
              <Kpi label="Directions" value={int.format(gbp.performance.directionRequests)} />
              <Kpi label="Search views" value={int.format(gbp.performance.searchImpressions)} />
              <Kpi label="Maps views" value={int.format(gbp.performance.mapsImpressions)} />
              <Kpi
                label="Total views"
                value={int.format(
                  gbp.performance.searchImpressions + gbp.performance.mapsImpressions
                )}
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-3 font-medium">Recent reviews</p>
              {gbp.reviews.recent.length > 0 ? (
                <ul className="space-y-3">
                  {gbp.reviews.recent.map((r, i) => (
                    <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.author}</span>
                        <span className="text-amber-600">{"★".repeat(r.rating)}</span>
                      </div>
                      {r.comment ? (
                        <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground italic">No comment</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{r.date}</p>
                    </li>
                  ))}
                </ul>
              ) : gbp.reviewsError ? (
                <p className="font-mono text-xs break-words text-muted-foreground">
                  Reviews unavailable: {gbp.reviewsError}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </div>
          </div>
        ) : (
          <NotConnected
            error={gbp.error}
            hint="Add the service account as a Manager on the Business Profile (and ensure the Business Profile APIs are approved for the project). Optionally set GBP_ACCOUNT_ID / GBP_LOCATION_ID."
          />
        )}
      </section>
    </div>
  );
}
