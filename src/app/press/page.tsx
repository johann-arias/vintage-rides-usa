import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ROYAL_ENFIELD_PARTNER_URL,
  PRESS_COVERAGE,
  ALSO_COVERED_BY,
  PRESS_PULL_QUOTE,
} from "@/lib/press";

export const metadata: Metadata = {
  title: "Press & Royal Enfield Partnership | Vintage Rides USA",
  description:
    "Royal Enfield North America partnered with Vintage Rides in August 2026 to bring Royal Enfield motorcycle travel to the United States. Coverage from RideApart, Cycle News, ADV Rider, ADV Pulse and others, plus Royal Enfield's own page about the Rapid City fleet.",
  alternates: { canonical: "https://www.vintageridesusa.com/press" },
};

export default function PressPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <section className="bg-[#2e3b23] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-5">Press</p>
            <h1 className="text-white text-4xl md:text-5xl font-light leading-tight mb-6">
              Royal Enfield chose us to bring<br />
              <span className="font-semibold">their motorcycles to America</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
              In August 2026, Royal Enfield North America announced its partnership
              with Vintage Rides at the Sturgis Motorcycle Rally. Our Black Hills
              fleet in Rapid City is the North American home of that partnership.
              Here is what was written about it, and where to check it for yourself.
            </p>
          </div>
        </section>

        {/* ── The proof that matters most ──────────────────────────────────── */}
        {/* Not press: the manufacturer describing this exact rental on their own
            .com, down to the park passes and Mike & Wendy by name. Everything
            else on this page is a rewrite of the same release, so this one gets
            the top slot and its own visual weight. */}
        <section className="bg-[#faf5ea] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white border border-[#e8e3d3] rounded-sm p-8 md:p-10">
              {/* Stacks under the logo on phones: side by side, the wordmark eats
                  the row and the label gets squeezed against the floating
                  contact button. */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/royal-enfield-logo.svg" alt="Royal Enfield" className="h-5 w-auto self-start" />
                <span className="text-[#a9781a] text-[11px] font-semibold tracking-[0.2em] uppercase sm:border-l sm:border-[#1a1a17]/15 sm:pl-3">
                  From the manufacturer
                </span>
              </div>
              <h2 className="text-[#1a1a17] text-2xl md:text-3xl font-light leading-snug mb-5">
                Royal Enfield&apos;s own page about<br />
                <span className="font-semibold">Vintage Rides USA</span>
              </h2>
              <p className="text-[#57534a] text-lg leading-relaxed mb-7">
                Royal Enfield describes the Rapid City shop, the fleet of Himalayan
                450s, the Black Hills Blast self-guided package, the included Custer
                State Park and National Forest passes, and the 24/7 support from Mike
                and Wendy Crockett. If you want one link to verify who you are
                renting from, this is it.
              </p>
              <a
                href={ROYAL_ENFIELD_PARTNER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#2e3b23] hover:bg-[#3a4a2c] text-white font-semibold tracking-wider px-7 py-3.5 rounded-sm transition-colors text-sm uppercase"
              >
                Read it on royalenfield.com →
              </a>
            </div>
          </div>
        </section>

        {/* ── Pull quote ───────────────────────────────────────────────────── */}
        <section className="bg-white py-16 md:py-20 border-y border-[#e8e3d3]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <figure>
              <blockquote className="font-serif text-[#1a1a17] text-2xl md:text-4xl font-light italic leading-snug">
                &ldquo;{PRESS_PULL_QUOTE.text}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-sm tracking-wider text-[#6e6a5e]">
                <a
                  href={PRESS_PULL_QUOTE.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a1a17] font-medium hover:text-[#a9781a] transition-colors"
                >
                  {PRESS_PULL_QUOTE.outlet}
                </a>
                <span className="text-[#1a1a17]/25"> · </span>
                {PRESS_PULL_QUOTE.date}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── Coverage ─────────────────────────────────────────────────────── */}
        <section className="bg-[#faf5ea] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-3">Coverage</p>
            <h2 className="text-[#1a1a17] text-3xl md:text-4xl font-light mb-4">
              What was written
            </h2>
            <p className="text-[#6e6a5e] leading-relaxed mb-10 max-w-2xl">
              Most of these pieces cover the guided and self-guided tours launching
              across the US. The Rapid City rental is the same fleet, the same team,
              and the same partnership.
            </p>

            <ul className="space-y-4">
              {PRESS_COVERAGE.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-white border border-[#e8e3d3] hover:border-[#1a1a17]/30 rounded-sm p-6 md:p-7 transition-colors"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                      <span className="text-[#1a1a17] text-sm font-semibold tracking-[0.12em] uppercase">
                        {item.outlet}
                      </span>
                      <span className="text-[#1a1a17]/20" aria-hidden>·</span>
                      <span className="text-[#6e6a5e] text-xs tracking-wider">{item.date}</span>

                    </div>
                    <p className="text-[#1a1a17] text-lg md:text-xl font-light leading-snug group-hover:text-[#a9781a] transition-colors">
                      {item.headline}
                    </p>
                    {item.quote && (
                      <p className="text-[#57534a] text-base leading-relaxed italic mt-4 pl-4 border-l-2 border-[#d9a32b]">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    )}
                    <span className="inline-block mt-4 text-xs tracking-wider uppercase text-[#6e6a5e] group-hover:text-[#1a1a17] transition-colors">
                      Read the article →
                    </span>
                  </a>
                  {item.alsoAt && (
                    <p className="text-[#6e6a5e] text-xs tracking-wider mt-2 ml-6 md:ml-7">
                      Also syndicated on{" "}
                      <a
                        href={item.alsoAt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1a1a17]/70 hover:text-[#a9781a] font-medium border-b border-[#1a1a17]/20 transition-colors"
                      >
                        {item.alsoAt.outlet}
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-12 pt-8 border-t border-[#1a1a17]/10">
              <p className="text-[#6e6a5e] text-[11px] tracking-[0.25em] uppercase mb-4">Also covered by</p>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {ALSO_COVERED_BY.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1a1a17]/60 hover:text-[#1a1a17] text-sm font-medium tracking-[0.12em] uppercase border-b border-transparent hover:border-[#1a1a17]/30 transition-colors"
                    >
                      {item.outlet}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Who we are ───────────────────────────────────────────────────── */}
        {/* The press says "nearly two decades of expertise" and the site never
            did. A cold US rider has no idea the shop belongs to a twenty-year-old
            touring company; that is the reassurance the coverage actually buys. */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-3">Background</p>
            <h2 className="text-[#1a1a17] text-3xl md:text-4xl font-light mb-7">
              Twenty years of motorcycle travel,<br />now in the Black Hills
            </h2>
            <div className="space-y-5 text-[#57534a] text-lg leading-relaxed">
              <p>
                Vintage Rides was founded in 2006 and has been running premium
                guided motorcycle tours ever since, across the Himalayas, the Andes,
                the Atlas Mountains and a dozen other ranges. Royal Enfield has been
                our partner on those roads for years.
              </p>
              <p>
                Vintage Rides USA is the American chapter of that company. Ten brand
                new 2025 Himalayan 450s, one shop in Rapid City, and two local hosts
                who hand you the keys in person: Mike, born and raised in the Black
                Hills, and Wendy Crockett, the first woman to win the Iron Butt Rally.
              </p>
              <p>
                So when you rent from us, you are renting from a twenty-year-old
                touring outfit with a fleet down the road from Mount Rushmore, not
                from a listing.
              </p>
            </div>
          </div>
        </section>

        {/* ── Media contact + CTA ──────────────────────────────────────────── */}
        <section className="bg-[#2e3b23] py-16">
          <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-white text-2xl font-light mb-3">Writing about us?</h2>
              <p className="text-white/70 leading-relaxed">
                Press enquiries, imagery and ride-along requests:{" "}
                <a
                  href="mailto:wendy@vintagerides.travel"
                  className="text-[#d9a32b] hover:text-[#e2ae2c] transition-colors"
                >
                  wendy@vintagerides.travel
                </a>
              </p>
            </div>
            <div className="md:text-right">
              <Link
                href="/book"
                className="inline-block bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-8 py-4 rounded-sm transition-colors text-sm uppercase"
              >
                Book your bike
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
