import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RIDES, mapsUrl } from "@/lib/rides";

const SITE_URL = "https://www.vintageridesusa.com";
const PATH = "/black-hills-motorcycle-rides";
const TITLE = "Black Hills Motorcycle Rides: 10 Best Routes | Vintage Rides USA";
const DESCRIPTION =
  "The best motorcycle rides in the Black Hills and South Dakota: Needles Highway, Iron Mountain Road, Spearfish Canyon, the Badlands. Distances, maps and tips.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "article",
    url: `${SITE_URL}${PATH}`,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/needles-himalayan-road-curve.jpg", width: 1024, height: 768, alt: "Royal Enfield Himalayan on a Black Hills road" }],
  },
};

// This page answers "where should I ride?" (the query people type), not "where
// do I rent?": the rental pages keep that role, and every route links to one.
const FAQ = [
  {
    q: "What is the best motorcycle ride in the Black Hills?",
    a: "The Needles Highway (SD-87) is the most famous: 14 miles of granite spires, hairpins and single-lane tunnels in Custer State Park. For a full day, the classic loop from Rapid City links Iron Mountain Road, Mount Rushmore, the Wildlife Loop and the Needles Highway in about 125 miles.",
  },
  {
    q: "How many days do I need to ride the Black Hills?",
    a: "One day covers the southern loop (Mount Rushmore, Custer State Park, Needles Highway). Two days add Spearfish Canyon and Deadwood, or the Badlands. Three days let you add Devils Tower in Wyoming without rushing.",
  },
  {
    q: "When is the Needles Highway open?",
    a: "From early May to October. Snow closes it in winter. Iron Mountain Road and the lower roads stay rideable most of the year, weather permitting.",
  },
  {
    q: "Can I ride gravel roads on a rental motorcycle?",
    a: "Yes. Our Royal Enfield Himalayan 450 is an adventure bike built for it: Sage Creek Rim Road in the Badlands, the Galena detour near Deadwood and the Black Hills forest roads are all fair game. Ask Mike for the GPX tracks at pickup.",
  },
  {
    q: "Do I need a park pass to ride these roads?",
    a: "Custer State Park and Black Hills National Forest passes are included with every Vintage Rides USA rental. Badlands National Park charges $15 per motorcycle at the entrance, not included.",
  },
  {
    q: "Where do these rides start?",
    a: "From our garage at 1715 Samco Rd #107 in Rapid City: 30 minutes from Sturgis, under an hour from Custer State Park and about an hour from the Badlands.",
  },
];

export default function RidesPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Black Hills Motorcycle Rides", item: `${SITE_URL}${PATH}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Best motorcycle rides in the Black Hills",
      itemListElement: RIDES.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${SITE_URL}${PATH}#${r.id}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[460px] bg-[#2e3b23] flex items-end overflow-hidden">
          <Image
            src="/needles-himalayan-road-curve.jpg"
            alt="Royal Enfield Himalayan 450 on a curve of the Needles Highway, Black Hills"
            fill
            preload
            fetchPriority="high"
            loading="eager"
            sizes="100vw"
            className="object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2e3b23] via-[#2e3b23]/45 to-transparent" aria-hidden />
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pb-14">
            <h1 className="font-sans text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
              Black Hills Motorcycle Rides
            </h1>
            <p className="font-heading text-white text-5xl md:text-7xl font-light leading-[1.05] tracking-tight mb-6">
              The best roads,
              <br />
              <span className="italic text-[#d9a32b]">mapped for you</span>
            </p>
            <p className="text-white/75 text-lg md:text-xl leading-relaxed max-w-2xl">
              Ten routes we send our riders on, from the Needles Highway to the Badlands and Devils Tower. Distances
              from our Rapid City garage, riding times with stops, and a map for each.
            </p>
          </div>
        </section>

        {/* Overview table */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-[#1a1a17] text-3xl md:text-4xl font-light mb-8">All ten rides at a glance</h2>
            {/* Phones get a list: five columns do not fit in 390 px. */}
            <ul className="md:hidden divide-y divide-[#e8e3d3] border border-[#e8e3d3]">
              {RIDES.map((r) => (
                <li key={r.id}>
                  <a href={`#${r.id}`} className="block px-4 py-3">
                    <span className="block font-medium text-[#1a1a17]">{r.name}</span>
                    <span className="block text-xs text-[#6e6a5e] mt-0.5">{r.distance} · {r.time} · {r.surface}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="hidden md:block overflow-x-auto border border-[#e8e3d3]">
              <table className="w-full text-sm">
                <thead className="bg-[#faf5ea] text-left text-[10px] uppercase tracking-[0.18em] text-[#6e6a5e]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ride</th>
                    <th className="px-4 py-3 font-semibold">Distance</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Surface</th>
                    <th className="px-4 py-3 font-semibold">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {RIDES.map((r) => (
                    <tr key={r.id} className="border-t border-[#e8e3d3] align-top">
                      <td className="px-4 py-3">
                        <a href={`#${r.id}`} className="font-medium text-[#1a1a17] hover:text-[#a9781a]">{r.name}</a>
                      </td>
                      <td className="px-4 py-3 text-[#2a2a24]">{r.distance}</td>
                      <td className="px-4 py-3 text-[#2a2a24] whitespace-nowrap">{r.time}</td>
                      <td className="px-4 py-3 text-[#2a2a24] whitespace-nowrap">{r.surface}</td>
                      <td className="px-4 py-3 text-[#6e6a5e]">{r.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Routes */}
        <section className="bg-[#faf5ea] py-20">
          <div className="max-w-5xl mx-auto px-6 space-y-8">
            {RIDES.map((r, i) => (
              <article key={r.id} id={r.id} className="scroll-mt-24 bg-white border border-[#e8e3d3] p-8 md:p-10">
                <h2 className="text-[#1a1a17] text-2xl md:text-3xl font-light mb-4">
                  <span className="text-[#d9a32b] mr-3">{String(i + 1).padStart(2, "0")}</span>
                  {r.name}
                </h2>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                  {[
                    ["Distance", r.distance],
                    ["Riding time", r.time],
                    ["Surface", r.surface],
                    ["Season", r.season],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[#a9781a] text-[10px] font-semibold tracking-[0.18em] uppercase mb-1">{k}</dt>
                      <dd className="text-[#1a1a17]">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[#2a2a24] text-base md:text-lg leading-relaxed mb-6">{r.summary}</p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-[#1a1a17] text-sm font-semibold tracking-wider uppercase mb-3">The route</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-[#2a2a24] text-sm md:text-base marker:text-[#a9781a]">
                      {r.steps.map((s) => <li key={s}>{s}</li>)}
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-[#1a1a17] text-sm font-semibold tracking-wider uppercase mb-3">Tips</h3>
                    <ul className="list-disc pl-5 space-y-2 text-[#2a2a24] text-sm md:text-base marker:text-[#a9781a]">
                      {r.tips.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#e8e3d3] pt-6 text-sm">
                  <a
                    href={mapsUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-[#1a1a17] hover:bg-[#2e3b23] hover:text-white text-[#1a1a17] font-medium tracking-wider px-5 py-2.5 rounded-sm transition-colors uppercase text-xs"
                  >
                    Open the route in Google Maps
                  </a>
                  <Link href={r.rent.href} className="text-[#a9781a] hover:text-[#1a1a17] font-medium">
                    {r.rent.label} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bike + CTA */}
        <section className="bg-[#26301c] py-16">
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <h2 className="text-white text-3xl font-light mb-4">One bike for all ten</h2>
              <p className="text-white/70 leading-relaxed">
                The Royal Enfield Himalayan 450 does the Needles Highway hairpins and the Sage Creek gravel on the
                same tank: 400 miles of range, long-travel suspension, panniers and a phone mount included.
                $130 a day plus tax, insurance included ($1,000 deductible), Custer State Park pass included.
              </p>
            </div>
            <Link
              href="/book"
              className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-8 py-4 rounded-sm transition-colors text-sm uppercase text-center"
            >
              Check availability
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#faf5ea] py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-[#1a1a17] text-3xl md:text-4xl font-light mb-12">Riding the Black Hills: common questions</h2>
            <div className="space-y-8">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <h3 className="text-[#1a1a17] text-lg md:text-xl font-medium mb-3">{f.q}</h3>
                  <p className="text-[#2a2a24] text-sm md:text-base leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
