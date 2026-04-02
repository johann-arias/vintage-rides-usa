import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative h-screen min-h-[600px] bg-[#111110] flex items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url('/hero-placeholder.jpg')" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111110] via-[#111110]/70 to-transparent" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111110] via-transparent to-transparent" aria-hidden />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Royal Enfield Himalayan 450 · Self-Guided
              </p>
              <h1 className="text-white text-5xl md:text-7xl font-light leading-[1.05] tracking-tight mb-6">
                Ride America<br />
                <span className="italic text-[#c8a45a]">Your Way</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
                Rent a Royal Enfield Himalayan 450 and carve your own path
                through the American West. No guides. No schedule. Just the road.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="bg-[#c8a45a] hover:bg-[#e8c98a] text-[#111110] font-semibold tracking-wider px-8 py-4 rounded-sm transition-colors text-center text-sm uppercase"
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
        <section className="bg-[#1a1a18] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "10", label: "Bikes Available" },
              { value: "450cc", label: "Engine" },
              { value: "3 days", label: "Minimum Rental" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[#c8a45a] text-2xl md:text-3xl font-light">{stat.value}</div>
                <div className="text-white/50 text-xs tracking-widest uppercase mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── The Bike Feature ─────────────────────────────────────────────── */}
        <section className="bg-[#f8f6f0] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The Machine</p>
                <h2 className="text-[#111110] text-4xl md:text-5xl font-light leading-tight mb-6">
                  Royal Enfield<br />
                  <span className="font-semibold">Himalayan 450</span>
                </h2>
                <p className="text-[#6b6b6b] text-lg leading-relaxed mb-8">
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
                  ].map((spec) => (
                    <li key={spec} className="flex items-start gap-3 text-sm text-[#2a2a28]">
                      <span className="text-[#c8a45a] mt-0.5 shrink-0">—</span>
                      {spec}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/fleet"
                  className="inline-block border border-[#111110] hover:bg-[#111110] hover:text-white text-[#111110] font-medium tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
                >
                  See Full Specs
                </Link>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] bg-[#e8e6e0] rounded-sm overflow-hidden flex items-center justify-center">
                  <div className="text-center text-[#6b6b6b]">
                    <div className="text-5xl mb-3">🏍</div>
                    <p className="text-sm tracking-wider uppercase">Bike photo placeholder</p>
                    <p className="text-xs mt-1 opacity-60">Royal Enfield Himalayan 450</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-[#c8a45a] text-[#111110] px-6 py-4 rounded-sm hidden md:block">
                  <div className="text-2xl font-light">from $135</div>
                  <div className="text-xs font-semibold tracking-wider uppercase">per day</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-[#111110] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Process</p>
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
                  desc: "Pick up your bike at our designated location. Luggage racks and support contact included.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <div className="text-[#c8a45a]/20 text-7xl font-bold leading-none mb-4 select-none">
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
                className="bg-[#c8a45a] hover:bg-[#e8c98a] text-[#111110] font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
              >
                Start Booking
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why Vintage Ride ─────────────────────────────────────────────── */}
        <section className="bg-[#f8f6f0] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Why Us</p>
              <h2 className="text-[#111110] text-4xl md:text-5xl font-light">
                Born from 15 years of<br />guided adventures
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
                  title: "Route Expertise",
                  desc: "Not sure where to go? We'll suggest routes, share GPX tracks, and point you to the same roads our Freedom Tour guides use.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-white p-8 rounded-sm border border-[#e8e6e0]">
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <h3 className="text-[#111110] font-semibold text-lg mb-3">{card.title}</h3>
                  <p className="text-[#6b6b6b] text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonial ──────────────────────────────────────────────────── */}
        <section className="bg-[#2a2a28] py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="text-[#c8a45a] text-4xl mb-6">&ldquo;</div>
            <blockquote className="text-white text-xl md:text-2xl font-light leading-relaxed mb-8 italic">
              Three weeks in the American West on a Himalayan 450. Best trip of my
              life. The bike never missed a beat — from asphalt to gravel to dirt.
              Vintage Ride&apos;s support team was always one call away.
            </blockquote>
            <div className="text-white/50 text-sm tracking-wider">
              Marcus T. — Denver, CO
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="bg-[#f8f6f0] py-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#c8a45a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">FAQ</p>
              <h2 className="text-[#111110] text-4xl font-light">Common Questions</h2>
            </div>
            <div className="space-y-6">
              {[
                {
                  q: "What license do I need?",
                  a: "A valid motorcycle endorsement on your driver's license is required. International riders need an International Driving Permit plus their home country license.",
                },
                {
                  q: "What's included in the rental?",
                  a: "The bike, panniers, a tank bag, a phone/GPS mount, and 24/7 support contact. Fuel and accommodation are not included.",
                },
                {
                  q: "What's the minimum rental period?",
                  a: "3 days minimum year-round. For peak season (May–October) we recommend at least 5 days to make the most of the region.",
                },
                {
                  q: "Can I pick my own route?",
                  a: "Absolutely — that's the whole point. We can suggest itineraries and share GPX tracks, but your schedule is your own.",
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
                <div key={item.q} className="border-b border-[#e8e6e0] pb-6">
                  <h3 className="text-[#111110] font-semibold mb-2">{item.q}</h3>
                  <p className="text-[#6b6b6b] text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────────── */}
        <section className="bg-[#c8a45a] py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-[#111110] text-4xl md:text-5xl font-light mb-4">Ready to ride?</h2>
            <p className="text-[#111110]/70 text-lg mb-8">
              Check availability and lock in your dates in under 5 minutes.
            </p>
            <Link
              href="/book"
              className="bg-[#111110] hover:bg-[#2a2a28] text-white font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
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
