import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PICKUP_LOCATION, PICKUP_DIRECTIONS_URL, PICKUP_MAP_EMBED_URL } from "@/lib/location";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative h-screen min-h-[600px] bg-[#1f2817] flex items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url('/hero-bike-outdoor.jpg')" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1f2817] via-[#1f2817]/70 to-transparent" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f2817] via-transparent to-transparent" aria-hidden />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Motorcycle Rental · Rapid City & Black Hills
              </p>
              <h1 className="text-white text-5xl md:text-7xl font-light leading-[1.05] tracking-tight mb-6">
                Ride the<br />
                <span className="italic text-[#d9a32b]">Black Hills</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
                Rent a Royal Enfield Himalayan 450 in Rapid City and explore
                the Black Hills, Badlands, and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-8 py-4 rounded-sm transition-colors text-center text-sm uppercase"
                >
                  Book Your Bike
                </Link>
                <Link
                  href="/fleet"
                  className="border border-white/30 hover:border-white text-white font-medium tracking-wider px-8 py-4 rounded-sm transition-colors text-center text-sm uppercase"
                >
                  Explore the Fleet
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
            <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        <section className="bg-[#26301c] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "10", label: "Bikes Available" },
              { value: "450cc", label: "Engine" },
              { value: "$130", label: "Per Day + Tax" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[#d9a32b] text-2xl md:text-3xl font-light">{stat.value}</div>
                <div className="text-white/50 text-xs tracking-widest uppercase mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── The Bike Feature ─────────────────────────────────────────────── */}
        <section className="bg-[#faf5ea] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The Machine</p>
                <h2 className="text-[#1a1a17] text-4xl md:text-5xl font-light leading-tight mb-6">
                  Royal Enfield<br />
                  <span className="font-semibold">Himalayan 450</span>
                </h2>
                <p className="text-[#6e6a5e] text-lg leading-relaxed mb-8">
                  The same bikes we trust to take our riders through the Himalayas
                  and across the Andes. Reliable, capable, and perfectly sized for
                  both highways and dirt roads.
                </p>
                <ul className="space-y-3 mb-10">
                  {[
                    "452cc liquid-cooled DOHC single-cylinder engine",
                    "40 hp · 40 Nm torque · 6-speed gearbox",
                    "Long-travel suspension — 200mm front / 210mm rear",
                    "USB-C charging · GPS mount · all-day comfort seat",
                    "Panniers, phone mount & tank bag included",
                    "Custer State Park + Black Hills National Forest passes included",
                  ].map((spec) => (
                    <li key={spec} className="flex items-start gap-3 text-sm text-[#2a2a24]">
                      <span className="text-[#d9a32b] mt-0.5 shrink-0">—</span>
                      {spec}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/fleet"
                  className="inline-block border border-[#1a1a17] hover:bg-[#2e3b23] hover:text-white text-[#1a1a17] font-medium tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
                >
                  See Full Specs
                </Link>
              </div>
              <div className="relative">
                <div
                  className="aspect-[4/3] bg-[#e8e3d3] bg-cover bg-center rounded-sm overflow-hidden"
                  style={{ backgroundImage: "url('/bike-studio.jpg')" }}
                  role="img"
                  aria-label="Royal Enfield Himalayan 450"
                />
                <div className="absolute -bottom-6 -left-6 bg-[#d9a32b] text-[#1a1a17] px-6 py-4 rounded-sm hidden md:block">
                  <div className="text-2xl font-light">$130/day</div>
                  <div className="text-xs font-semibold tracking-wider uppercase">+ tax</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-[#1f2817] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Process</p>
              <h2 className="text-white text-4xl md:text-5xl font-light">How It Works</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Choose Your Dates",
                  desc: "Pick your start and end date. We'll show you real-time availability across our fleet of 10 Himalayan 450s.",
                },
                {
                  step: "02",
                  title: "Select Your Bikes",
                  desc: "Riding solo or with a group? Choose how many bikes you need — up to the full fleet of 10.",
                },
                {
                  step: "03",
                  title: "Book & Pay",
                  desc: "Secure checkout via Stripe. Full payment upfront. Instant confirmation sent to your inbox.",
                },
                {
                  step: "04",
                  title: "Ride",
                  desc: "Pick up your bike in Rapid City. Luggage racks and support contact included. The Black Hills are waiting.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <div className="text-[#d9a32b]/20 text-7xl font-bold leading-none mb-4 select-none">
                    {item.step}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <Link
                href="/book"
                className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
              >
                Start Booking
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why Vintage Ride ─────────────────────────────────────────────── */}
        <section className="bg-[#faf5ea] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Why Us</p>
              <h2 className="text-[#1a1a17] text-4xl md:text-5xl font-light">
                Born from 20 years of<br />guided adventures
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🌍",
                  title: "World-Class Bikes",
                  desc: "The exact same Royal Enfield Himalayan 450s we use in our guided tours across the Himalayas, Andes, and Atlas. Maintained to tour operator standards.",
                },
                {
                  icon: "🛡",
                  title: "Full Support",
                  desc: "24/7 emergency contact, roadside assistance network, and a team that has resolved every breakdown scenario imaginable — because we've seen them all.",
                },
                {
                  icon: "🗺",
                  title: "Local Knowledge",
                  desc: "Not sure where to go? We'll suggest the best routes through the Black Hills, Badlands, and Spearfish Canyon — the same roads our guides ride every season.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-white p-8 rounded-sm border border-[#e8e3d3]">
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <h3 className="text-[#1a1a17] font-semibold text-lg mb-3">{card.title}</h3>
                  <p className="text-[#6e6a5e] text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonial ──────────────────────────────────────────────────── */}
        <section className="bg-[#2e3b23] py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="text-[#d9a32b] text-4xl mb-6">&ldquo;</div>
            <blockquote className="text-white text-xl md:text-2xl font-light leading-relaxed mb-8 italic">
              Three weeks in the American West on a Himalayan 450. Best trip of my
              life. The bike never missed a beat — from asphalt to gravel to dirt.
              Vintage Rides&apos; support team was always one call away.
            </blockquote>
            <div className="text-white/50 text-sm tracking-wider">
              Marcus T. — Denver, CO
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="bg-[#faf5ea] py-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">FAQ</p>
              <h2 className="text-[#1a1a17] text-4xl font-light">Common Questions</h2>
            </div>
            <div className="space-y-6">
              {[
                {
                  q: "What license do I need?",
                  a: "A valid motorcycle endorsement on your driver's license is required. International riders need an International Driving Permit plus their home country license.",
                },
                {
                  q: "What's included in the rental?",
                  a: "The bike, panniers, a tank bag, a phone/GPS mount, your Custer State Park entrance pass, your Black Hills National Forest trail pass, and 24/7 support contact. Fuel and accommodation are not included.",
                },
                {
                  q: "Where can I ride?",
                  a: "Anywhere you like from our Rapid City base. Popular rides include the Black Hills, Badlands National Park, Needles Highway, Spearfish Canyon, and Mount Rushmore. We'll share GPX tracks on request.",
                },
                {
                  q: "What happens if the bike breaks down?",
                  a: "Call our 24/7 support line. We have a roadside assistance network and will either repair or replace your bike. You're never left stranded.",
                },
                {
                  q: "Can I book multiple bikes?",
                  a: "Yes. You can book up to all 10 bikes simultaneously — perfect for group rides or small moto-events.",
                },
              ].map((item) => (
                <div key={item.q} className="border-b border-[#e8e3d3] pb-6">
                  <h3 className="text-[#1a1a17] font-semibold mb-2">{item.q}</h3>
                  <p className="text-[#6e6a5e] text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Find Us ──────────────────────────────────────────────────────── */}
        <section className="bg-[#26301c] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Find Us</p>
                <h2 className="text-white text-4xl md:text-5xl font-light leading-tight mb-6">
                  Our garage in<br />
                  <span className="font-semibold">Rapid City</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
                  Pick up your bike at our base on the western edge of Rapid City — minutes from
                  Highway 16 and the gateway to Mount Rushmore, the Black Hills, and beyond.
                </p>
                <address className="not-italic text-white text-base leading-relaxed mb-4">
                  <span className="block font-semibold tracking-wide">{PICKUP_LOCATION.name}</span>
                  <span className="block text-white/70">{PICKUP_LOCATION.street}</span>
                  <span className="block text-white/70">
                    {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
                  </span>
                </address>
                <p className="text-white/60 text-sm mb-6">
                  Pickup at <span className="text-white font-medium">9:00 AM</span> · Return by <span className="text-white font-medium">9:00 AM</span>
                </p>
                <a
                  href={PICKUP_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-[#d9a32b] text-[#d9a32b] hover:bg-[#d9a32b] hover:text-[#1a1a17] font-medium tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
                >
                  Get Directions
                </a>
              </div>
              <div className="aspect-[4/3] md:aspect-auto md:h-[420px] rounded-sm overflow-hidden border border-white/10">
                <iframe
                  title="Vintage Rides USA pickup location"
                  src={PICKUP_MAP_EMBED_URL}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────────── */}
        <section className="bg-[#d9a32b] py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-[#1a1a17] text-4xl md:text-5xl font-light mb-4">Ready to ride?</h2>
            <p className="text-[#1a1a17]/70 text-lg mb-8">
              Check availability and lock in your dates in under 5 minutes.
            </p>
            <Link
              href="/book"
              className="bg-[#1f2817] hover:bg-[#3a4a2c] text-white font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
            >
              Book Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
