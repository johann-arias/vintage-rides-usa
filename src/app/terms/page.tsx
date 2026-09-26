import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PICKUP_LOCATION, CONTACT } from "@/lib/location";

export const metadata: Metadata = {
  title: "Rental Terms & Conditions | Vintage Rides USA",
  description:
    "Rental terms for Vintage Rides USA in Rapid City, SD: booking and payment, security deposit, rider requirements, insurance, permitted use, cancellation.",
  alternates: { canonical: "/terms" },
};

// Public summary of the B2C Motorcycle Rental Agreement signed at pickup
// (Google Doc "Vintage Rides USA - Motorcycle Rental Agreement (B2C)").
// Every figure below comes from that agreement, which was aligned on the site
// on 2026-09-26: cancellation as shown at booking (14+ days free, 50% at 7-13
// days), insurance limits from the MBA certificate of 06/08/2026. When either
// changes, update the agreement, this page, /book, the destination pages and
// llms.txt together.
const LAST_UPDATED = "September 26, 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-[#1a1a17] text-2xl md:text-3xl font-light mb-5">{title}</h2>
      <div className="space-y-4 text-[#57534a] text-base md:text-lg leading-relaxed">{children}</div>
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 marker:text-[#a9781a]">{children}</ul>;
}

const TOC = [
  { id: "booking", label: "Booking and payment" },
  { id: "deposit", label: "Security deposit" },
  { id: "riders", label: "Who can ride" },
  { id: "insurance", label: "Insurance and your responsibility" },
  { id: "use", label: "Permitted use" },
  { id: "return", label: "Fuel, return and late return" },
  { id: "incidents", label: "Breakdown, accident and theft" },
  { id: "risk", label: "Safety and assumption of risk" },
  { id: "cancellation", label: "Cancellation and refunds" },
  { id: "termination", label: "Termination" },
  { id: "law", label: "Governing law" },
  { id: "contact", label: "Contact us" },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="bg-[#2e3b23] py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-5">Legal</p>
            <h1 className="text-white text-4xl md:text-5xl font-light leading-tight mb-6">Rental Terms &amp; Conditions</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              The rules of a Vintage Rides USA motorcycle rental, in plain English. This page summarizes the
              Motorcycle Rental Agreement you sign when you pick up your bike; if the two ever differ, the
              signed agreement applies.
            </p>
            <p className="text-white/50 text-sm tracking-wider mt-6">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="bg-[#faf5ea] py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-white border border-[#e8e3d3] rounded-sm p-7 md:p-9 mb-14">
              <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The short version</p>
              <ul className="space-y-3 text-[#57534a] leading-relaxed list-disc pl-5 marker:text-[#a9781a]">
                <li>You pay the full rental when you book. A $600 security deposit is held on your card at pickup and released after the bike is back and checked.</li>
                <li>Riders must be 21 or older with a valid motorcycle license or endorsement. Riders licensed outside the US also need an International Driving Permit.</li>
                <li>Insurance is included. You are responsible for the $1,000 deductible if the bike is damaged, lost or stolen.</li>
                <li>Bring the bike back to Rapid City with a full tank, on time, in the condition you received it.</li>
                <li>Free cancellation 14 or more days before pickup. From 7 to 13 days, 50% is refunded. Within 7 days of pickup, the rental is not refunded.</li>
              </ul>
            </div>

            <nav aria-label="Contents" className="mb-14">
              <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">Contents</p>
              <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-[#57534a] list-decimal pl-5 marker:text-[#a9781a]">
                {TOC.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="hover:text-[#a9781a] transition-colors">{t.label}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-14">
              <Section id="booking" title="Booking and payment">
                <p>
                  Rentals are provided by Vintage Rides USA, LLC, a South Dakota limited liability company. The
                  daily rate is shown when you book. South Dakota sales tax of 11.9% applies to the rental charges.
                  Full payment is due at the time of booking, and the booking is confirmed once payment has been
                  received. All amounts are in U.S. dollars.
                </p>
              </Section>

              <Section id="deposit" title="Security deposit">
                <p>
                  A refundable security deposit of $600 is authorized (held) on your credit card at or before
                  pickup. The hold is released once the motorcycle has been returned and inspected, less any
                  amount due under the rental agreement: the insurance deductible on damage or loss, missing fuel,
                  cleaning, tolls, fines or late-return charges. If those costs exceed the deposit, you remain
                  responsible for the balance not covered by insurance.
                </p>
              </Section>

              <Section id="riders" title="Who can ride">
                <p>The renter, and any additional rider, must:</p>
                <List>
                  <li>be at least 21 years old;</li>
                  <li>hold a valid motorcycle license or motorcycle endorsement for the whole rental period;</li>
                  <li>if licensed outside the United States, carry both their home-country motorcycle license and a valid International Driving Permit.</li>
                </List>
                <p>
                  Only the renter and any additional rider named and approved in writing by us may ride the
                  motorcycle. Letting anyone else ride it breaches the agreement and voids the insurance.
                </p>
              </Section>

              <Section id="insurance" title="Insurance and your responsibility">
                <p>
                  Each motorcycle is covered by our motorcycle insurance (policies placed by MBA Insurance with
                  Agent Alliance Insurance Company), included in the daily rate, with these limits:
                </p>
                <List>
                  <li>Liability, bodily injury: $25,000 per person / $50,000 per accident</li>
                  <li>Liability, property damage: $25,000</li>
                  <li>Excess liability: $1,000,000 combined single limit</li>
                  <li>Uninsured / underinsured motorist: as required by South Dakota law ($25,000 per person / $50,000 per accident)</li>
                  <li>Medical payments: $2,000</li>
                </List>
                <p>
                  You are responsible for the deductible, up to $1,000 per occurrence, for any damage to, loss or
                  theft of the motorcycle, whoever is at fault. The insurance does not apply, and you become
                  responsible for all damage, loss and third-party claims, if the loss happens while the bike is
                  used in breach of the agreement: ridden by an unauthorized or unlicensed person, under the
                  influence of alcohol or drugs, recklessly or competitively, or outside the permitted area.
                </p>
              </Section>

              <Section id="use" title="Permitted use">
                <p>The motorcycle may not be:</p>
                <List>
                  <li>ridden by anyone other than an authorized rider;</li>
                  <li>ridden under the influence of alcohol, cannabis, drugs or any substance that impairs riding;</li>
                  <li>loaded with passengers or cargo beyond the manufacturer&apos;s rated capacity;</li>
                  <li>used in any race, speed test, contest, stunt or riding lesson;</li>
                  <li>used to carry people or goods for hire, or sub-rented;</li>
                  <li>used to push or tow any vehicle or trailer;</li>
                  <li>taken outside the continental United States, including into Canada or Mexico, without our prior written consent;</li>
                  <li>ridden carelessly, recklessly, or off-road beyond the motorcycle&apos;s intended use;</li>
                  <li>ridden in breach of any law.</li>
                </List>
                <p>
                  You must obey traffic and helmet laws, and you are responsible for parking tickets, traffic
                  citations, tolls and related fees incurred during the rental.
                </p>
              </Section>

              <Section id="return" title="Fuel, return and late return">
                <p>
                  You receive the motorcycle in good working order with a full tank, and you inspect it with us at
                  pickup to record any existing damage. Return it to {PICKUP_LOCATION.street}, {PICKUP_LOCATION.city},{" "}
                  {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip} by the agreed date and time, in the same condition
                  (normal wear excepted) and with a full tank.
                </p>
                <List>
                  <li>Returned with less than a full tank: $50 refueling charge.</li>
                  <li>Late return: the full daily rate plus tax for each extra day or part of a day, unless an extension was agreed in writing beforehand. Extensions depend on availability.</li>
                </List>
              </Section>

              <Section id="incidents" title="Breakdown, accident and theft">
                <p>
                  If the motorcycle breaks down, stop riding and call us right away. Do not arrange repairs
                  without our authorization. After an accident, theft, vandalism or any damage:
                </p>
                <List>
                  <li>tell us as soon as reasonably possible;</li>
                  <li>report it to local law enforcement and get a police report;</li>
                  <li>do not admit fault or liability to anyone;</li>
                  <li>collect the names, contact details and insurance information of the other parties and witnesses.</li>
                </List>
                <p>Failing to report promptly, or to obtain a police report where required, can make you fully responsible for the loss.</p>
              </Section>

              <Section id="risk" title="Safety and assumption of risk">
                <p>
                  Riding a motorcycle is inherently dangerous and can lead to serious injury or death. By renting,
                  you accept those risks. You agree to wear a properly fitted helmet and protective gear, to make
                  any passenger do the same, and to ride within your ability, the posted limits and the road
                  conditions. To the fullest extent the law allows, you release and indemnify Vintage Rides USA,
                  LLC, its members, manager, employees and agents against claims arising from your use of the
                  motorcycle, except where caused by our gross negligence or willful misconduct.
                </p>
              </Section>

              <Section id="cancellation" title="Cancellation and refunds">
                <p>Counted from the scheduled pickup date:</p>
                <List>
                  <li>14 days or more before pickup: full refund of the rental charge;</li>
                  <li>7 to 13 days before pickup: 50% refund;</li>
                  <li>fewer than 7 days before pickup: no refund.</li>
                </List>
                <p>A no-show, or a cancellation on the day of pickup, is not refunded. Date changes depend on availability.</p>
              </Section>

              <Section id="termination" title="Termination">
                <p>
                  We may end the rental and take back the motorcycle immediately, at your expense, if the rental
                  terms are breached, if the motorcycle is used in a prohibited way, or if we reasonably believe the
                  motorcycle or the rider is at risk.
                </p>
              </Section>

              <Section id="law" title="Governing law">
                <p>
                  These terms and the rental agreement are governed by the laws of the State of South Dakota. Any
                  dispute will be brought in the state or federal courts of Pennington County, South Dakota.
                </p>
              </Section>

              <Section id="contact" title="Contact us">
                <address className="not-italic">
                  Vintage Rides USA, LLC
                  <br />
                  {PICKUP_LOCATION.street}, {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
                  <br />
                  Email:{" "}
                  <a href={`mailto:${CONTACT.email}`} className="text-[#1a1a17] border-b border-[#1a1a17]/25 hover:text-[#a9781a] hover:border-[#a9781a] transition-colors">
                    {CONTACT.email}
                  </a>
                  <br />
                  Phone:{" "}
                  <a href={`tel:${CONTACT.phone.e164}`} className="text-[#1a1a17] border-b border-[#1a1a17]/25 hover:text-[#a9781a] hover:border-[#a9781a] transition-colors">
                    {CONTACT.phone.display}
                  </a>
                </address>
              </Section>
            </div>
          </div>
        </section>

        <section className="bg-[#2e3b23] py-14">
          <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="text-white/70 leading-relaxed">A question about the rental terms? Ask us before you book.</p>
            <Link
              href="/book"
              className="inline-block self-start sm:self-auto bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-8 py-4 rounded-sm transition-colors text-sm uppercase"
            >
              Book your bike
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
