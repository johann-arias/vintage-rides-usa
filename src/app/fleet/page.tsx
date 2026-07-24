import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Royal Enfield Himalayan 450 Rental — Black Hills & Rapid City | Vintage Rides USA",
  description:
    "Rent a 2025 Royal Enfield Himalayan 450 in Rapid City, SD. $130/day. Explore the Black Hills, Badlands, and Needles Highway. Available year-round.",
};

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
  "Full-face helmet in your size",
  "Custer State Park entrance pass",
  "Black Hills National Forest trail pass",
  "Panniers (2× 28L side cases)",
  "Tank bag (15L)",
  "Phone / GPS RAM mount",
  "Basic tool kit + puncture repair kit",
  "24/7 emergency support contact",
  "GPX route suggestions on request",
  "Pre-ride orientation & safety check",
];

const NOT_INCLUDED = [
  "Riding gear beyond the helmet (bring your jacket, gloves and boots)",
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
        <section className="bg-[#2e3b23] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The Fleet</p>
            <h1 className="text-white text-4xl md:text-6xl font-light leading-tight mb-4">
              Royal Enfield<br />
              <span className="font-semibold">Himalayan 450</span>
            </h1>
            <p className="text-white/60 text-lg max-w-lg">
              10 bikes. All 2025. Maintained to the same standard we use for our
              guided tours across 4 continents.
            </p>
          </div>
        </section>

        {/* Bike hero image */}
        <section className="bg-[#26301c]">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div
              className="aspect-[16/7] bg-[#2e3b23] bg-cover bg-center rounded-sm overflow-hidden"
              style={{ backgroundImage: "url('/hero-bike-outdoor.jpg')" }}
              role="img"
              aria-label="Royal Enfield Himalayan 450 in the Black Hills"
            />
          </div>
        </section>

        {/* Specs */}
        <section className="bg-[#faf5ea] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-6">Technical Specs</p>
                <div className="space-y-0">
                  {SPECS.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`grid grid-cols-2 gap-4 py-3 ${
                        i < SPECS.length - 1 ? "border-b border-[#e8e3d3]" : ""
                      }`}
                    >
                      <span className="text-[#6e6a5e] text-sm">{spec.label}</span>
                      <span className="text-[#1a1a17] text-sm font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-12">
                  <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-6">What&apos;s Included</p>
                  <ul className="space-y-3">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#2a2a24]">
                        <span className="text-[#d9a32b] font-bold shrink-0 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4 text-[#6e6a5e]">Not Included</p>
                  <ul className="space-y-3">
                    {NOT_INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#6e6a5e]">
                        <span className="text-[#6e6a5e] shrink-0 mt-0.5">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fleet gallery */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The Fleet</p>
              <h2 className="text-[#1a1a17] text-3xl md:text-4xl font-light">Ten bikes, ready to ride</h2>
            </div>
            <div
              className="aspect-[16/9] bg-cover bg-center rounded-sm overflow-hidden mb-3"
              style={{ backgroundImage: "url('/fleet-lineup-wall.jpg')" }}
              role="img"
              aria-label="The Vintage Rides USA fleet of 10 Royal Enfield Himalayan 450s lined up at our Rapid City base"
            />
            <div className="grid grid-cols-2 gap-3">
              <div
                className="aspect-[4/3] bg-cover bg-center rounded-sm overflow-hidden"
                style={{ backgroundImage: "url('/fleet-lineup-side.jpg')" }}
                role="img"
                aria-label="Fleet lineup, side view"
              />
              <div
                className="aspect-[4/3] bg-cover bg-center rounded-sm overflow-hidden"
                style={{ backgroundImage: "url('/bike-outdoor-cliff.jpg')" }}
                role="img"
                aria-label="Royal Enfield Himalayan 450 in the Black Hills"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-[#2e3b23] py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Pricing</p>
            <h2 className="text-white text-4xl font-light mb-12">Simple, transparent rates</h2>
            <div className="flex justify-center mb-10">
              <div className="bg-[#d9a32b] text-[#1a1a17] px-12 py-8 rounded-sm text-center">
                <div className="text-xs font-semibold tracking-widest uppercase mb-1 opacity-70">Daily Rate</div>
                <div className="text-5xl font-light mb-1">$130</div>
                <div className="text-sm opacity-70">+ $15.47 tax · per bike / per day</div>
              </div>
            </div>
            <p className="text-white/40 text-sm mb-8">
              Group discounts available for 5+ bikes. Contact us directly.
            </p>
            <Link
              href="/book"
              className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
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
