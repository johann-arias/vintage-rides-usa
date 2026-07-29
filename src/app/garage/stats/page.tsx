import { getTurnoverStats, B2B_BIKE_DAY_RATE } from "@/lib/airtable";
import { getGaStats, getGscStats, getGbpStats, getBookingFunnel } from "@/lib/google-stats";
import type { FunnelStep } from "@/lib/google-stats";
import { getSearchStats } from "@/lib/availability-log";
import { getAbandonedCheckouts, RECOVERY_DELAY_HOURS } from "@/lib/stripe-abandoned";
import { Globe, Search, Star, TrendingUp, AlertCircle, Filter, CalendarSearch, ShoppingCart } from "lucide-react";

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

function Kpi({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 font-serif text-2xl text-[var(--brand-olive-700)]">{value}</p>
      {delta || sub ? (
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted-foreground">
          {delta}
          {sub ? <span>{sub}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

interface DeltaOptions {
  /** pct = relative change · points = percentage-point gap · abs = raw difference */
  mode?: "pct" | "points" | "abs";
  /** Set when a lower number is the better outcome (e.g. average search position). */
  invert?: boolean;
  /** Used for the "vs X previously" tooltip only. */
  format?: (n: number) => string;
}

/**
 * Change against the previous period, or `undefined` when there is no
 * comparison data — callers use that to drop the column entirely rather than
 * reserving space for a blank.
 */
function deltaOf(current: number, previous: number | null, opts: DeltaOptions = {}) {
  return previous === null ? undefined : <Delta current={current} previous={previous} {...opts} />;
}

function Delta({
  current,
  previous,
  mode = "pct",
  invert = false,
  format = (n: number) => int.format(Math.round(n)),
}: DeltaOptions & { current: number; previous: number }) {
  const title = `vs ${format(previous)} in the previous period`;
  const muted = "text-muted-foreground";
  if (previous === 0) {
    return (
      <span className={current > 0 ? "font-medium text-[var(--brand-olive-700)]" : muted} title={title}>
        {current > 0 ? "New" : "—"}
      </span>
    );
  }

  const diff = current - previous;
  if (diff === 0) return <span className={muted} title={title}>= 0%</span>;

  const improved = invert ? diff < 0 : diff > 0;
  const magnitude =
    mode === "pct"
      ? (() => {
          const rel = Math.abs(diff / previous) * 100;
          return `${rel >= 10 ? rel.toFixed(0) : rel.toFixed(1)}%`;
        })()
      : mode === "points"
        ? `${Math.abs(diff * 100).toFixed(1)} pts`
        : Math.abs(diff).toFixed(1);

  return (
    <span
      className={`font-medium tabular-nums ${improved ? "text-[var(--brand-olive-700)]" : "text-[#9a3b21]"}`}
      title={title}
    >
      {diff > 0 ? "↑" : "↓"} {magnitude}
    </span>
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

/** Compact note for a sub-panel that failed while the rest of the section works. */
function PanelNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900/80">
      <AlertCircle className="size-4 shrink-0 translate-y-px text-amber-700" />
      <p>{children}</p>
    </div>
  );
}

/** Daily bar chart, one thin column per day. */
function DailyBars({ rows }: { rows: { date: string; views: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  const MAX_BAR_PX = 80;
  const label = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return (
    <div>
      <div className="flex h-20 items-end gap-px">
        {rows.map((r) => (
          <div
            key={r.date}
            className="flex-1 rounded-t bg-[var(--brand-olive-700)]"
            style={{ height: `${r.views > 0 ? Math.max(2, (r.views / max) * MAX_BAR_PX) : 1}px` }}
            title={`${label(r.date)}: ${int.format(r.views)} views`}
          />
        ))}
      </div>
      {rows.length > 0 ? (
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>{label(rows[0].date)}</span>
          <span>Peak {int.format(max)} / day</span>
          <span>{label(rows[rows.length - 1].date)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Horizontal labelled bar, value-proportional. */
function BarList({
  rows,
  max,
  unit = "",
  labelClass = "w-36",
}: {
  rows: { label: string; value: number; right?: string; delta?: React.ReactNode }[];
  max: number;
  unit?: string;
  /** Tailwind width class for the label column — wider for long labels. */
  labelClass?: string;
}) {
  // Only reserve the comparison column when at least one row has a delta,
  // so panels without a previous period keep their full label width.
  const withDeltas = rows.some((r) => r.delta !== undefined);
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span
            className={`${labelClass} shrink-0 cursor-default truncate text-muted-foreground`}
            title={r.label}
          >
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
          {withDeltas ? (
            <span className="w-16 shrink-0 text-right text-xs">{r.delta}</span>
          ) : null}
        </div>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No data.</p> : null}
    </div>
  );
}

/**
 * Funnel steps as stacked bars, each width relative to the first step, with the
 * step-to-step rate called out. The biggest drop is the one worth reading, so
 * anything losing more than half its visitors is flagged.
 */
function FunnelList({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.users ?? 0;
  return (
    <div className="space-y-1.5">
      {steps.map((s) => {
        const bad = s.ofPrevious !== null && s.ofPrevious < 0.5;
        return (
          <div key={s.key} className="flex items-center gap-3 text-sm">
            <span className="w-40 shrink-0 cursor-default truncate text-muted-foreground" title={s.label}>
              {s.label}
            </span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-[var(--brand-cream)]">
              <div
                className="h-full rounded bg-[var(--brand-olive-700)]"
                style={{ width: `${top > 0 ? Math.max(s.users > 0 ? 2 : 0, (s.users / top) * 100) : 0}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right tabular-nums">{int.format(s.users)}</span>
            <span
              className={`w-16 shrink-0 text-right text-xs tabular-nums ${
                bad ? "font-medium text-[#9a3b21]" : "text-muted-foreground"
              }`}
              title="Share of the step above"
            >
              {s.ofPrevious === null ? "—" : pct(s.ofPrevious)}
            </span>
            <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground" title="Share of arrivals">
              {s.ofTop === null ? "—" : pct(s.ofTop)}
            </span>
          </div>
        );
      })}
      {steps.length === 0 ? <p className="text-sm text-muted-foreground">No data.</p> : null}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const [turnover, ga, gsc, gbp, funnel, searches, abandoned] = await Promise.all([
    getTurnoverStats(),
    getGaStats(30),
    getGscStats(28),
    getGbpStats(90),
    getBookingFunnel(30),
    getSearchStats(30).catch(() => null),
    getAbandonedCheckouts(30),
  ]);

  const maxMonth = Math.max(1, ...turnover.byMonth.map((m) => m.total));
  const website = turnover.byChannel.find((c) => c.channel === "WEBSITE")!;
  const b2b = turnover.byChannel.find((c) => c.channel === "B2B")!;

  // Previous-period figures, null when the comparison call didn't come back.
  const gaPrev = ga.previousTotals;
  const gscPrev = gsc.previousTotals;

  const totalViews = gbp.performance.searchImpressions + gbp.performance.mapsImpressions;
  const totalActions =
    gbp.performance.callClicks + gbp.performance.websiteClicks + gbp.performance.directionRequests;
  // Google reports exact counts only above a threshold; the rest are "fewer than N".
  const rankedKeywords = gbp.searchKeywords.filter((k) => !k.isThreshold);
  const lowVolumeKeywords = gbp.searchKeywords.filter((k) => k.isThreshold);

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
                  {m.total > 0 ? (
                    <span className="text-[10px] font-medium tabular-nums text-foreground">
                      {usd.format(m.total)}
                    </span>
                  ) : null}
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
        <SectionHeader
          icon={Globe}
          title="Website traffic"
          meta={`Google Analytics · last ${ga.rangeDays} days${
            ga.previousRange ? ` · vs ${ga.previousRange.startDate} → ${ga.previousRange.endDate}` : ""
          }`}
        />
        {ga.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi
                label="Sessions"
                value={int.format(ga.totals.sessions)}
                delta={deltaOf(ga.totals.sessions, gaPrev?.sessions ?? null)}
              />
              <Kpi
                label="Users"
                value={int.format(ga.totals.activeUsers)}
                delta={deltaOf(ga.totals.activeUsers, gaPrev?.activeUsers ?? null)}
              />
              <Kpi
                label="New users"
                value={int.format(ga.totals.newUsers)}
                delta={deltaOf(ga.totals.newUsers, gaPrev?.newUsers ?? null)}
              />
              <Kpi
                label="Page views"
                value={int.format(ga.totals.pageViews)}
                delta={deltaOf(ga.totals.pageViews, gaPrev?.pageViews ?? null)}
              />
              <Kpi
                label="Engagement"
                value={pct(ga.totals.engagementRate)}
                delta={deltaOf(ga.totals.engagementRate, gaPrev?.engagementRate ?? null, {
                  mode: "points",
                  format: pct,
                })}
              />
              <Kpi
                label="Avg session"
                value={`${Math.round(ga.totals.avgSessionDurationSec)}s`}
                delta={deltaOf(ga.totals.avgSessionDurationSec, gaPrev?.avgSessionDurationSec ?? null, {
                  format: (n) => `${Math.round(n)}s`,
                })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top channels</p>
                <BarList
                  rows={ga.topChannels.map((c) => ({
                    label: c.label,
                    value: c.sessions,
                    delta: deltaOf(c.sessions, c.previous),
                  }))}
                  max={Math.max(1, ...ga.topChannels.map((c) => c.sessions))}
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top countries</p>
                <BarList
                  rows={ga.topCountries.map((c) => ({
                    label: c.label,
                    value: c.sessions,
                    delta: deltaOf(c.sessions, c.previous),
                  }))}
                  max={Math.max(1, ...ga.topCountries.map((c) => c.sessions))}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <p className="font-medium">Referring sites</p>
                <p className="text-xs text-muted-foreground">sessions with medium = referral</p>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Every site that sent a click, including the Facebook domains that GA4 files under
                Organic Social rather than Referral.
              </p>
              <BarList
                rows={ga.topReferrers.map((r) => ({
                  label: r.label,
                  value: r.sessions,
                  delta: deltaOf(r.sessions, r.previous),
                }))}
                max={Math.max(1, ...ga.topReferrers.map((r) => r.sessions))}
                labelClass="w-56"
              />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-3 font-medium">Top pages</p>
              <BarList
                rows={ga.topPages.map((p) => ({
                  label: p.path,
                  value: p.views,
                  delta: deltaOf(p.views, p.previous),
                }))}
                max={Math.max(1, ...ga.topPages.map((p) => p.views))}
                labelClass="w-72"
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

      {/* ── Booking funnel ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Filter}
          title="Booking funnel"
          meta={`/book · last ${funnel.rangeDays} days · unique visitors per step`}
        />
        {funnel.connected ? (
          funnel.empty ? (
            <PanelNote>
              No booking events yet. They start landing a few hours after the first visit that
              follows the instrumentation going live.
            </PanelNote>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="font-medium">All traffic</p>
                  <p className="text-xs text-muted-foreground">
                    step-to-step · share of arrivals
                  </p>
                </div>
                <FunnelList steps={funnel.steps} />
              </div>

              {funnel.campaignSteps.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-baseline justify-between gap-4">
                    <p className="font-medium">Ad traffic only</p>
                    <p className="truncate text-xs text-muted-foreground" title={funnel.campaignNames.join(" · ")}>
                      {funnel.campaignNames.join(" · ")}
                    </p>
                  </div>
                  <FunnelList steps={funnel.campaignSteps} />
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="mb-1 font-medium">What the price check told them</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Every availability answer, counted per search.
                  </p>
                  <BarList
                    rows={funnel.outcomes.map((o) => ({ label: o.label, value: o.events }))}
                    max={Math.max(1, ...funnel.outcomes.map((o) => o.events))}
                    labelClass="w-52"
                  />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="mb-1 font-medium">Where they left the page</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Step they were on when the page went away. Leaving for Stripe does not count.
                  </p>
                  <BarList
                    rows={funnel.exits.map((e) => ({ label: e.label, value: e.users }))}
                    max={Math.max(1, ...funnel.exits.map((e) => e.users))}
                    labelClass="w-52"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="mb-1 font-medium">Fields still empty when they gave up</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Required fields on step 2. Field names only, never their content.
                  </p>
                  {funnel.missingFields.length > 0 ? (
                    <BarList
                      rows={funnel.missingFields.map((f) => ({ label: f.label, value: f.users }))}
                      max={Math.max(1, ...funnel.missingFields.map((f) => f.users))}
                      labelClass="w-52"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nobody has abandoned the details form yet.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="mb-1 font-medium">Checkout errors</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Payment refused by our own API: dates taken in the meantime, minimum duration,
                    network.
                  </p>
                  <p className="font-serif text-3xl tabular-nums text-[var(--brand-olive-700)]">
                    {int.format(funnel.checkoutErrors)}
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <NotConnected
            error={funnel.error}
            hint="Same GA4 service account as the traffic section above."
          />
        )}
      </section>

      {/* ── What visitors searched for ─────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={CalendarSearch}
          title="What they tried to book"
          meta={`every date check on /book · last ${searches?.rangeDays ?? 30} days · ${
            searches ? int.format(searches.total) : 0
          } searches`}
        />
        {searches === null ? (
          <PanelNote>Could not read the search log.</PanelNote>
        ) : searches.total === 0 ? (
          <PanelNote>
            No searches logged yet. Every date check on /book lands here from now on, with no
            personal data attached.
          </PanelNote>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <p className="font-medium">Months they asked for</p>
                <p className="text-xs text-muted-foreground">
                  {pct(searches.sturgisShare)} of searches hit the rally rate
                </p>
              </div>
              <BarList
                rows={searches.byMonth.map((m) => ({ label: m.label, value: m.searches }))}
                max={Math.max(1, ...searches.byMonth.map((m) => m.searches))}
                labelClass="w-28"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">What we answered</p>
                <BarList
                  rows={searches.byOutcome.map((o) => ({ label: o.label, value: o.searches }))}
                  max={Math.max(1, ...searches.byOutcome.map((o) => o.searches))}
                  labelClass="w-28"
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">How far ahead</p>
                <BarList
                  rows={searches.byLeadTime.map((l) => ({ label: l.label, value: l.searches }))}
                  max={Math.max(1, ...searches.byLeadTime.map((l) => l.searches))}
                  labelClass="w-32"
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">How long</p>
                <BarList
                  rows={searches.byDuration.map((d) => ({ label: d.label, value: d.searches }))}
                  max={Math.max(1, ...searches.byDuration.map((d) => d.searches))}
                  labelClass="w-28"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Abandoned checkouts ────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={ShoppingCart}
          title="Abandoned checkouts"
          meta={`Stripe · last ${abandoned.rangeDays} days · reached the card form, never paid`}
        />
        {abandoned.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi label="Checkouts started" value={int.format(abandoned.created)} />
              <Kpi label="Paid" value={int.format(abandoned.completed)} />
              <Kpi
                label="Changed their cart"
                value={int.format(abandoned.recovered)}
                sub="booked under another session"
              />
              <Kpi label="Abandoned" value={int.format(abandoned.abandoned)} />
              <Kpi
                label="Left on the table"
                value={usd.format(abandoned.lostValue)}
                sub={`${pct(abandoned.abandonRate)} abandon rate`}
              />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-1 font-medium">Who to follow up</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Three kinds of noise are filtered out. Same-day requests: their card is
                    authorized rather than charged, so Stripe calls them unpaid even though the
                    customer went through. Anyone who adjusted their cart and paid under another
                    session, counted above as &ldquo;changed their cart&rdquo;. And our own
                    traffic: scripts, and the office IPs listed in ABANDONED_IGNORE_IPS. Everyone
                    still listed gets one automatic recovery email 3h after they walked away, when
                    we have an address for them.
              </p>
              {abandoned.sessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Started</th>
                        <th className="pb-2 font-medium">Who</th>
                        <th className="pb-2 font-medium">Rental</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                        <th className="pb-2 text-right font-medium">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abandoned.sessions.map((s) => (
                        <tr key={s.id} className="border-t border-border">
                          <td className="py-2 whitespace-nowrap tabular-nums">
                            {new Date(s.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-2">
                            <span className="block">{s.name ?? "—"}</span>
                            <span className="block text-xs text-muted-foreground">
                              {s.email ?? "no email"}
                            </span>
                          </td>
                          <td className="py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {s.startDate && s.endDate ? `${s.startDate} → ${s.endDate}` : "—"}
                            {s.bikes ? ` · ${s.bikes} bike${s.bikes > 1 ? "s" : ""}` : ""}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {s.amount != null ? usd.format(s.amount) : "—"}
                          </td>
                          <td className="py-2 text-right">
                            {s.recoveryUrl ? (
                              <a
                                href={s.recoveryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--brand-olive-700)] underline underline-offset-2"
                              >
                                recovery link
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">{s.state}</span>
                            )}
                            <span className="block text-xs text-muted-foreground">
                              {s.recoveryEmailSentAt
                                ? `emailed ${new Date(s.recoveryEmailSentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                : "not emailed yet"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nobody has abandoned a checkout in this window.
                </p>
              )}
            </div>
          </div>
        ) : (
          <NotConnected error={abandoned.error} hint="Needs STRIPE_SECRET_KEY on the server." />
        )}
      </section>

      {/* ── Search Console ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Search}
          title="Search performance"
          meta={`Search Console · ${gsc.startDate} → ${gsc.endDate}${
            gsc.previousRange ? ` · vs ${gsc.previousRange.startDate} → ${gsc.previousRange.endDate}` : ""
          }`}
        />
        {gsc.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi
                label="Clicks"
                value={int.format(gsc.totals.clicks)}
                delta={deltaOf(gsc.totals.clicks, gscPrev?.clicks ?? null)}
              />
              <Kpi
                label="Impressions"
                value={int.format(gsc.totals.impressions)}
                delta={deltaOf(gsc.totals.impressions, gscPrev?.impressions ?? null)}
              />
              <Kpi
                label="CTR"
                value={pct(gsc.totals.ctr)}
                delta={deltaOf(gsc.totals.ctr, gscPrev?.ctr ?? null, { mode: "points", format: pct })}
              />
              <Kpi
                label="Avg position"
                value={gsc.totals.position.toFixed(1)}
                // Position 3 beats position 8, so a drop in the number is a win.
                delta={deltaOf(gsc.totals.position, gscPrev?.position ?? null, {
                  mode: "abs",
                  invert: true,
                  format: (n) => n.toFixed(1),
                })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top queries</p>
                <BarList
                  rows={gsc.topQueries.map((q) => ({
                    label: q.query,
                    value: q.clicks,
                    right: `${int.format(q.clicks)} clk`,
                    delta: deltaOf(q.clicks, q.previousClicks),
                  }))}
                  max={Math.max(1, ...gsc.topQueries.map((q) => q.clicks))}
                  labelClass="w-56"
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Top pages</p>
                <BarList
                  rows={gsc.topPages.map((p) => ({
                    label: p.page.replace(/^https?:\/\/[^/]+/, "") || "/",
                    value: p.clicks,
                    right: `${int.format(p.clicks)} clk`,
                    delta: deltaOf(p.clicks, p.previousClicks),
                  }))}
                  max={Math.max(1, ...gsc.topPages.map((p) => p.clicks))}
                  labelClass="w-56"
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
          meta={
            gbp.connected
              ? `${gbp.profile?.title ?? "profile"} · ${gbp.startDate} → ${gbp.endDate}`
              : `last ${gbp.rangeDays} days`
          }
        />
        {gbp.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi
                label="Rating"
                value={gbp.reviews.totalCount ? `${gbp.reviews.averageRating.toFixed(1)}★` : "—"}
                sub={gbp.reviews.totalCount ? `${gbp.reviews.totalCount} reviews` : "No reviews yet"}
              />
              <Kpi label="Total views" value={int.format(totalViews)} sub="search + maps" />
              <Kpi label="Actions" value={int.format(totalActions)} sub="calls, clicks, directions" />
              <Kpi
                label="Action rate"
                value={totalViews ? pct(totalActions / totalViews) : "—"}
                sub="actions per view"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Where people see you</p>
                <BarList
                  rows={[
                    { label: "Google Search", value: gbp.performance.searchImpressions },
                    { label: "Google Maps", value: gbp.performance.mapsImpressions },
                  ]}
                  max={Math.max(1, gbp.performance.searchImpressions, gbp.performance.mapsImpressions)}
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">What they do next</p>
                <BarList
                  rows={[
                    { label: "Directions", value: gbp.performance.directionRequests },
                    { label: "Website clicks", value: gbp.performance.websiteClicks },
                    { label: "Calls", value: gbp.performance.callClicks },
                  ]}
                  max={Math.max(
                    1,
                    gbp.performance.directionRequests,
                    gbp.performance.websiteClicks,
                    gbp.performance.callClicks
                  )}
                />
              </div>
            </div>

            {gbp.byDay.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">Daily views</p>
                <DailyBars rows={gbp.byDay} />
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {/* Search keywords */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-medium">How people found you</p>
                {gbp.keywordsError ? (
                  <PanelNote>{gbp.keywordsError}</PanelNote>
                ) : gbp.searchKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No keyword data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {rankedKeywords.length > 0 ? (
                      <BarList
                        rows={rankedKeywords.map((k) => ({ label: k.keyword, value: k.impressions }))}
                        max={Math.max(1, ...rankedKeywords.map((k) => k.impressions))}
                        labelClass="w-56"
                      />
                    ) : null}
                    {lowVolumeKeywords.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Also found via {lowVolumeKeywords.length} low-volume searches (Google withholds
                          exact counts below {lowVolumeKeywords[0].impressions} impressions):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {lowVolumeKeywords.map((k) => (
                            <span
                              key={k.keyword}
                              className="rounded-full bg-[var(--brand-cream)] px-2.5 py-1 text-xs text-muted-foreground"
                            >
                              {k.keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <p className="font-medium">
                    Recent reviews
                    {gbp.reviews.unanswered > 0 ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {gbp.reviews.unanswered} to answer
                      </span>
                    ) : null}
                  </p>
                  {gbp.profile?.newReviewUri ? (
                    <a
                      href={gbp.profile.newReviewUri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--brand-olive-700)] underline underline-offset-2"
                    >
                      Review link
                    </a>
                  ) : null}
                </div>
                {gbp.reviews.recent.length > 0 ? (
                  <ul className="space-y-3">
                    {gbp.reviews.recent.map((r, i) => (
                      <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium">{r.author}</span>
                          <span className="shrink-0 text-amber-600">
                            {"★".repeat(r.rating)}
                            <span className="text-muted-foreground">{"☆".repeat(5 - r.rating)}</span>
                          </span>
                        </div>
                        {r.comment ? (
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground" title={r.comment}>
                            {r.comment}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground italic">No comment</p>
                        )}
                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{r.date}</span>
                          {r.replied ? (
                            <span className="text-[var(--brand-olive-700)]">· Replied</span>
                          ) : (
                            <span className="font-medium text-amber-700">· Needs a reply</span>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : gbp.reviewsError ? (
                  <PanelNote>{gbp.reviewsError}</PanelNote>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Share the review link with customers after their ride.
                  </p>
                )}
              </div>
            </div>

            {gbp.error ? <PanelNote>{gbp.error}</PanelNote> : null}
            {gbp.profile?.mapsUri ? (
              <p className="text-xs text-muted-foreground">
                <a
                  href={gbp.profile.mapsUri}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  View the profile on Google Maps
                </a>
              </p>
            ) : null}
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
