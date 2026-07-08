import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PICKUP_LOCATION, PICKUP_DIRECTIONS_URL, PICKUP_MAP_EMBED_URL, GOOGLE_LISTING_URL } from "@/lib/location";

const REVIEWS = [
  {
    quote:
      "The scenery brought me to the Black Hills, but Vintage Rides USA and the Royal Enfield Himalayan 450 made the trip truly unforgettable. Everything was easy and well organized, the bike perfectly suited to the terrain, and the included park pass and off-road riding made it real value.",
    author: "Trai Hunt",
    badge: "Local Guide",
  },
  {
    quote:
      "Highly recommend for exploring the Black Hills and surrounding area. I called Mike last second, he had me set up on a bike in no time. We went over the bike and he gave me some guidance on which sites to see and which roads to take. I will be returning to the area and using Vintage Rides!",
    author: "Brandon Kuuzi",
    badge: null,
  },
  {
    quote:
      "Mike was amazing, knowledgeable and couldn't be happier with the service. The bike is everything you need for these amazing hills, perfect on the scenic roads, stable and great suspension for the dirt. Thanks again Mike, the trip was awesome and so was the bike!",
    author: "Seth Loskot",
    badge: null,
  },
  {
    quote:
      "Great experience! Highly recommend. Mike was extremely accommodating and flexible. He gave us his cell and was very responsive. He was also full of local knowledge. Don't forget to pet Katy, the shop dog!",
    author: "M S",
    badge: null,
  },
  {
    quote: "Great service, great bikes worth every penny!",
    author: "Charlie Pearce",
    badge: null,
  },
  {
    quote: "Recommend! A+++++ service and routes.",
    author: "Cultural Enigma",
    badge: null,
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative h-screen min-h-[600px] bg-[#2e3b23] flex items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-himalayan-meadow-rider.jpg')" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2e3b23]/85 via-[#2e3b23]/25 to-transparent" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2e3b23]/55 via-transparent to-transparent" aria-hidden />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Motorcycle Rental · Rapid City & Black Hills
              </p>
              <h1 className="text-white text-5xl md:text-7xl font-light leading-[1.05] tracking-tight mb-6">
                Ride the<br />
                <span className="italic text-[#d9a32b]">Black Hills</span>
              </h1>
              <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
                Rent a Royal Enfield Himalayan 450 in Rapid City and explore
                the Black Hills, Badlands, and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-8 py-4 rounded-sm transition-colors text-center text-sm uppercase shadow-sm"
                >
                  Book Your Bike
                </Link>
                <Link
                  href="/fleet"
                  className="border border-white/40 hover:border-white hover:bg-white/[0.06] text-white font-medium tracking-wider px-8 py-4 rounded-sm transition-colors text-center text-sm uppercase"
                >
                  Explore the Fleet
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-sm text-white/75">
                <span className="flex items-center gap-2 tracking-wider">
                  <span className="text-[#d9a32b] tracking-[0.18em]" aria-hidden>★★★★★</span>
                  5.0 on Google
                </span>
                <span className="hidden sm:inline text-white/25" aria-hidden>|</span>
                <span className="flex items-center gap-2 tracking-wider">
                  <span aria-hidden>🏆</span>
                  Co-founded by an Iron Butt Rally champion
                </span>
                <span className="hidden sm:inline text-white/25" aria-hidden>|</span>
                <span className="flex items-center gap-2 tracking-wider">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/royal-enfield-logo.svg" alt="Royal Enfield" className="h-3 w-auto [filter:brightness(0)_invert(1)]" />
                  Official Royal Enfield Partner
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
            <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        <section className="bg-[#2e3b23] border-b border-white/10">
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

        {/* ── Meet Mike & Wendy ────────────────────────────────────────────── */}
        <section id="our-story" className="bg-[#faf5ea] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="relative order-2 md:order-1">
                <div
                  className="aspect-[4/3] bg-[#e8e3d3] bg-cover bg-center rounded-sm overflow-hidden border border-[#e8e3d3]"
                  style={{ backgroundImage: "url('/mike-wendy-garage.jpg')" }}
                  role="img"
                  aria-label="Mike and Wendy with their dog Katie in the Vintage Rides USA garage in Rapid City"
                />
                <div className="absolute -bottom-6 -right-6 bg-[#d9a32b] text-[#1a1a17] px-6 py-4 rounded-sm shadow-md hidden md:block">
                  <div className="text-sm font-semibold italic">Mike &amp; Wendy</div>
                  <div className="text-xs tracking-wider uppercase opacity-70">Rapid City, SD</div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Your Local Hosts · Black Hills since 2018</p>
                <h2 className="text-[#1a1a17] text-4xl md:text-5xl font-light leading-tight mb-5">
                  Meet Mike<br />
                  <span className="font-semibold">&amp; Wendy</span>
                </h2>
                <div className="inline-flex items-center gap-2.5 border border-[#d9a32b]/50 bg-[#d9a32b]/10 rounded-sm px-3.5 py-2 mb-7">
                  <span className="text-[#a9781a] text-base leading-none" aria-hidden>🏆</span>
                  <span className="text-[#57534a] text-xs tracking-wider uppercase">
                    Wendy: first woman to win the Iron Butt Rally · 2019
                  </span>
                </div>
                <div className="space-y-5 text-[#57534a] text-lg leading-relaxed mb-8">
                  <p>
                    Mike was born and raised right here in the Black Hills. He went off to
                    work in Hollywood for a while, but these roads have a way of calling you
                    home. We came back in 2018, certain this was the best adventure-riding
                    country in America that nobody was talking about yet.
                  </p>
                  <p>
                    Wendy knows long roads better than just about anyone. In 2019 she became
                    the first woman ever to win the Iron Butt Rally, riding 13,000 miles of
                    nonstop endurance over eleven days. So when we tell you these bikes are
                    ready for whatever the Black Hills throw at you, that comes from real
                    experience.
                  </p>
                  <p>
                    Stop by our shop in Rapid City and you&apos;ll get the keys from us in
                    person, plus a warm welcome from Katie, our dog and unofficial greeter.
                    We&apos;ll give you the honest local rundown on which roads are riding
                    best that week, the kind of knowledge you only get from people who ride
                    these passes all season long.
                  </p>
                  <p>
                    Ask us where to go. We&apos;ll send you down Nemo Road for something the
                    maps won&apos;t show you, out along the Wildlife Loop in Custer, or up
                    Needles Highway at first light. And we&apos;ll happily point you to our
                    favorite coffee stop, Essence of Coffee, a proper Australian café with
                    the meat pies to match.
                  </p>
                </div>
                <p className="text-[#1a1a17] text-base italic">
                  Come ride with us. We&apos;ll treat you like a neighbor, not a number.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Bike Feature ─────────────────────────────────────────────── */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The Machine</p>
                <h2 className="text-[#1a1a17] text-4xl md:text-5xl font-light leading-tight mb-6">
                  Royal Enfield<br />
                  <span className="font-semibold">Himalayan 450</span>
                </h2>
                <div className="inline-flex items-center gap-3 border border-[#1a1a17]/15 bg-white rounded-sm px-4 py-2.5 mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/royal-enfield-logo.svg" alt="Royal Enfield" className="h-4 w-auto" />
                  <span className="text-[#1a1a17]/70 text-xs font-semibold tracking-wider uppercase">Official Partner</span>
                </div>
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
        <section id="how-it-works" className="bg-[#2e3b23] py-24">
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
                  <div className="text-[#d9a32b]/35 text-7xl font-bold leading-none mb-4 select-none">
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
              <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Why Us</p>
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

        {/* ── Reviews ──────────────────────────────────────────────────────── */}
        <section className="bg-[#2e3b23] py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Reviews</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-[#d9a32b] text-2xl tracking-[0.2em]" aria-hidden>★★★★★</span>
                <span className="text-white text-3xl font-light">5.0</span>
              </div>
              <p className="text-white/50 text-sm tracking-wider">Five-star rated on Google</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {REVIEWS.map((review) => (
                <figure
                  key={review.author}
                  className="bg-[#26301c] border border-white/10 rounded-sm p-8 flex flex-col"
                >
                  <div className="text-[#d9a32b] text-sm tracking-[0.2em] mb-5" aria-hidden>★★★★★</div>
                  <blockquote className="text-white/80 text-lg font-light leading-relaxed italic mb-6 flex-1">
                    &ldquo;{review.quote}&rdquo;
                  </blockquote>
                  <figcaption className="text-sm tracking-wider">
                    <span className="text-white font-medium">{review.author}</span>
                    {review.badge && (
                      <span className="text-[#d9a32b]"> · {review.badge}</span>
                    )}
                    <span className="text-white/30"> · via Google</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="text-center">
              <a
                href={GOOGLE_LISTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-[#d9a32b] text-[#d9a32b] hover:bg-[#d9a32b] hover:text-[#1a1a17] font-medium tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
              >
                Read all reviews on Google →
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="bg-white py-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">FAQ</p>
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
                {
                  q: "Can I rent year-round, or just in summer?",
                  a: "We rent year-round. May through September is the prime season: mild weather, every road open, and wildlife active. Winter rides are weather-dependent, some mountain roads like Needles Highway close for snow, and you should be comfortable riding in the cold. Tell us your dates and we'll tell you what's rideable.",
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
        <section className="bg-[#faf5ea] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Find Us</p>
                <h2 className="text-[#1a1a17] text-4xl md:text-5xl font-light leading-tight mb-6">
                  Our garage in<br />
                  <span className="font-semibold">Rapid City</span>
                </h2>
                <p className="text-[#57534a] text-lg leading-relaxed mb-8 max-w-md">
                  Pick up your bike at our base on the western edge of Rapid City — minutes from
                  Highway 16 and the gateway to Mount Rushmore, the Black Hills, and beyond.
                </p>
                <address className="not-italic text-[#1a1a17] text-base leading-relaxed mb-4">
                  <span className="block font-semibold tracking-wide">{PICKUP_LOCATION.name}</span>
                  <span className="block text-[#57534a]">{PICKUP_LOCATION.street}</span>
                  <span className="block text-[#57534a]">
                    {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
                  </span>
                </address>
                <p className="text-[#57534a] text-sm mb-6">
                  Pickup every half hour, <span className="text-[#1a1a17] font-medium">8:00 AM to 6:00 PM</span> · drop-off &amp; after-hours by appointment
                </p>
                <a
                  href={PICKUP_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-[#455324] text-[#455324] hover:bg-[#455324] hover:text-white font-medium tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
                >
                  Get Directions
                </a>
              </div>
              <div className="aspect-[4/3] md:aspect-auto md:h-[420px] rounded-sm overflow-hidden border border-[#e8e3d3]">
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
              className="bg-[#2e3b23] hover:bg-[#3a4a2c] text-white font-semibold tracking-wider px-10 py-4 rounded-sm transition-colors text-sm uppercase inline-block"
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
