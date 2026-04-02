import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SPECS = [
  { label: "Engine", value: "452cc liquid-cooled DOHC single" },
  { label: "Power", value: "40 hp @ 8,000 rpm" },
  { label: "Torque", value: "40 Nm @ 5,500 rpm" },
  { label: "Gearbox", value: "6-speed with slip & assist clutch" },
  { label: "Front suspension", value: "USD forks, 200mm travel" },
  { label: "Rear suspension", value: "Monoshock, 210mm travel" },
  { label: "Front brake", value: "320mm disc, Bybre 2-piston" },
  { label: "Rear brake", value: "270mm disc, Bybre 1-piston" },
  { label: "Fuel tank", value: "17 litres (~400 mi range)" },
  { label: "Seat height", value: "825mm (adjustable)" },
  { label: "Kerb weight", value: "196 kg" },
  { label: "Ground clearance", value: "230mm" },
];

const INCLUDED = [
  "Panniers (2× 28L side cases)",
  "Tank bag (15L)",
  "Phone / GPS RAM mount",
  "Basic tool kit + puncture repair kit",
  "24/7 emergency support contact",
  "GPX route suggestions on request",
  "Pre-ride orientation & safety check",
];

const NOT_INCLUDED = [
  "Helmet (available on request for a deposit)",
  "Fuel",
  "Accommodation",
  "Insurance (required — see FAQ)",
  "One-way drop-off (contact us for availability)",
];

export default function FleetPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <section className="bg-[#111110] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The Fleet</p>
            <h1 className="text-white text-4xl md:text-6xl font-light leading-tight mb-4">
              Royal Enfield<br />
              <span className="font-semibold">Himalayan 450</span>
            </h1>
            <p className="text-white/60 text-lg max-w-lg">
              10 bikes. All 2024. Maintained to the same standard we use for our
              guided tours across 4 continents.
            </p>
          </div>
        </section>

        {/* Bike hero image */}
        <section className="bg-[#1a1a18]">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="aspect-[16/7] bg-[#2a2a28] rounded-sm overflow-hidden flex items-center justify-center">
              <div className="text-center text-white/30">
                <div className="text-8xl mb-4">🏍</div>
                <p className="text-sm tracking-widest uppercase">Hero bike photo</p>
                <p className="text-xs mt-1 opacity-50">Royal Enfield Himalayan 450 — Sleet Grey</p>
              </div>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section className="bg-[#f8f6f0] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-6">Technical Specs</p>
                <div className="space-y-0">
                  {SPECS.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`grid grid-cols-2 gap-4 py-3 ${
                        i < SPECS.length - 1 ? "border-b border-[#e8e6e0]" : ""
                      }`}
                    >
                      <span className="text-[#6b6b6b] text-sm">{spec.label}</span>
                      <span className="text-[#111110] text-sm font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-12">
                  <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-6">What&apos;s Included</p>
                  <ul className="space-y-3">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#2a2a28]">
                        <span className="text-[#c8a45a] font-bold shrink-0 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4 text-[#6b6b6b]">Not Included</p>
                  <ul className="space-y-3">
                    {NOT_INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                        <span className="text-[#6b6b6b] shrink-0 mt-0.5">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fleet gallery placeholder */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-8 text-center">The Fleet</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#f0ede6] rounded-sm flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">🏍</span>
                  <span className="text-[#6b6b6b] text-xs tracking-wider">#{String(i + 1).padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-[#111110] py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Pricing</p>
            <h2 className="text-white text-4xl font-light mb-12">Simple, transparent rates</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { season: "Off Season", period: "Nov – Feb", rate: "$135", note: "Min. 3 days" },
                { season: "Shoulder", period: "Mar – Apr", rate: "$165", note: "Min. 3 days", featured: true },
                { season: "Peak Season", period: "May – Oct", rate: "$195", note: "Min. 3 days" },
              ].map((tier) => (
                <div
                  key={tier.season}
                  className={`p-8 rounded-sm ${
                    tier.featured
                      ? "bg-[#c8a45a] text-[#111110]"
                      : "bg-[#1a1a18] text-white border border-white/10"
                  }`}
                >
                  <div className="text-xs font-semibold tracking-widest uppercase mb-1 opacity-70">
                    {tier.season}
                  </div>
                  <div className="text-sm mb-4 opacity-60">{tier.period}</div>
                  <div className="text-4xl font-light mb-1">{tier.rate}</div>
                  <div className="text-xs opacity-60">per bike / per day</div>
                  <div className="mt-3 text-xs opacity-50">{tier.note}</div>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-sm mb-8">
              Group discounts available for 5+ bikes. Contact us directly.
            </p>
            <Link
              href="/book"
              className="bg-[#c8a45a] hover:bg-[#e8c98a] text-[#111110] font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
            >
              Check Availability
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
