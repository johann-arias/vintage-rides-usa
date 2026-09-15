import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PICKUP_LOCATION, CONTACT } from "@/lib/location";

// Mirrors RETENTION_DAYS in lib/availability-log.ts. Not imported: that module
// pulls in the Airtable client, which has no business in a static legal page.
const RETENTION_DAYS = 30;

export const metadata: Metadata = {
  title: "Privacy Policy | Vintage Rides USA",
  description:
    "How Vintage Rides LLC collects, uses and shares personal information when you visit vintageridesusa.com or rent a motorcycle from us in Rapid City, SD.",
  alternates: { canonical: "https://www.vintageridesusa.com/privacy" },
};

// Bump when the text below changes in substance. Every statement on this page
// was checked against the code on that date (Stripe checkout, Airtable fields,
// Brevo emails, GTM/GA4, Meta Pixel + CAPI, ad click capture): if you add a
// vendor, a form field or a tracking tag, update the matching section here.
const LAST_UPDATED = "September 15, 2026";

const EMAIL = CONTACT.email;

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

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1a1a17] border-b border-[#1a1a17]/25 hover:text-[#a9781a] hover:border-[#a9781a] transition-colors"
    >
      {children}
    </a>
  );
}

function Mail() {
  return (
    <a
      href={`mailto:${EMAIL}?subject=Privacy%20request`}
      className="text-[#1a1a17] border-b border-[#1a1a17]/25 hover:text-[#a9781a] hover:border-[#a9781a] transition-colors"
    >
      {EMAIL}
    </a>
  );
}

const TOC = [
  { id: "who-we-are", label: "Who we are" },
  { id: "what-we-collect", label: "What we collect" },
  { id: "how-we-use-it", label: "How we use it" },
  { id: "who-we-share-it-with", label: "Who we share it with" },
  { id: "cookies", label: "Cookies and advertising" },
  { id: "retention", label: "How long we keep it" },
  { id: "your-rights", label: "Your choices and rights" },
  { id: "security", label: "Security" },
  { id: "international", label: "International transfers" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact us" },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <section className="bg-[#2e3b23] py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[#d9a32b] text-xs font-semibold tracking-[0.25em] uppercase mb-5">Legal</p>
            <h1 className="text-white text-4xl md:text-5xl font-light leading-tight mb-6">Privacy Policy</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              What we collect when you visit this site or rent a motorcycle from us,
              why we need it, and who else sees it. Written in plain English, and
              kept in line with what the site actually does.
            </p>
            <p className="text-white/50 text-sm tracking-wider mt-6">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="bg-[#faf5ea] py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-6">
            {/* ── Short version ─────────────────────────────────────────────── */}
            <div className="bg-white border border-[#e8e3d3] rounded-sm p-7 md:p-9 mb-14">
              <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-4">The short version</p>
              <ul className="space-y-3 text-[#57534a] leading-relaxed list-disc pl-5 marker:text-[#a9781a]">
                <li>We collect what we need to rent you a bike: your name, contact details, booking dates and, after you book, your driver&apos;s license.</li>
                <li>Payments are handled by Stripe. We never see or store your full card number.</li>
                <li>We use Google and Meta tools to measure the site and our ads. You can opt out of both.</li>
                <li>We do not sell your personal information for money.</li>
                <li>You can ask us to see, correct or delete your information at any time: <Mail />.</li>
              </ul>
            </div>

            {/* ── Contents ──────────────────────────────────────────────────── */}
            <nav aria-label="Contents" className="mb-14">
              <p className="text-[#6e6a5e] text-[11px] tracking-[0.25em] uppercase mb-4">Contents</p>
              <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm list-decimal pl-5 marker:text-[#a9781a]">
                {TOC.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-[#1a1a17]/80 hover:text-[#a9781a] transition-colors">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-14">
              <Section id="who-we-are" title="1. Who we are">
                <p>
                  This site, <strong className="text-[#1a1a17] font-medium">vintageridesusa.com</strong>, is run by
                  Vintage Rides LLC (&ldquo;Vintage Rides USA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), which rents
                  Royal Enfield motorcycles from {PICKUP_LOCATION.street}, {PICKUP_LOCATION.city},{" "}
                  {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}. Vintage Rides LLC is part of the Vintage Rides group,
                  a motorcycle touring company founded in 2006 and based in France.
                </p>
                <p>
                  This policy covers the website, online bookings, and the ways you reach us by email, phone or
                  WhatsApp. It does not cover the guided tours sold on vintagerides.com, which have their own policy.
                </p>
              </Section>

              <Section id="what-we-collect" title="2. What we collect">
                <p className="text-[#1a1a17] font-medium">When you book</p>
                <List>
                  <li>Your name, email address and phone number, entered on the Stripe checkout page.</li>
                  <li>Your rental details: dates, number of bikes, pickup time, any promo code, and the amount paid.</li>
                  <li>
                    Payment information. Stripe collects your card or payment method and billing details directly.
                    We receive only a confirmation, the payment status, and limited details such as the card brand
                    and last four digits.
                  </li>
                </List>

                <p className="text-[#1a1a17] font-medium pt-2">After you book (rider profile)</p>
                <List>
                  <li>Your mobile number, driver&apos;s license number and a photo of your license.</li>
                  <li>Any special requests you write to us, and an emergency contact if you give us one.</li>
                </List>
                <p>
                  The profile is optional online, but we check a valid motorcycle license before handing over the
                  keys, so we will ask for it at pickup if you have not sent it.
                </p>

                <p className="text-[#1a1a17] font-medium pt-2">When you contact us</p>
                <p>
                  The content of your emails, calls, texts and WhatsApp messages, and the contact details you use to
                  send them.
                </p>

                <p className="text-[#1a1a17] font-medium pt-2">Automatically, when you browse</p>
                <List>
                  <li>
                    Pages visited, how you got here (referring site, search or ad, including campaign tags and ad
                    click identifiers), device and browser type, and approximate location derived from your IP
                    address. This is collected by the cookies and tags described in{" "}
                    <a href="#cookies" className="text-[#1a1a17] border-b border-[#1a1a17]/25 hover:text-[#a9781a]">section 5</a>.
                  </li>
                  <li>
                    When you start a checkout, your IP address and browser user agent are passed to Stripe with the
                    booking so the purchase can be attributed to the ad or visit that led to it.
                  </li>
                  <li>
                    The dates you search for on the booking page. This log contains no name, email or IP address and
                    is deleted after {RETENTION_DAYS} days.
                  </li>
                </List>
              </Section>

              <Section id="how-we-use-it" title="3. How we use it">
                <List>
                  <li>To take and confirm your booking, collect payment, and issue refunds or cancellations.</li>
                  <li>
                    To reach you about your rental: confirmation, pickup arrangements, reminders to complete your
                    rider profile, and anything that changes on our side.
                  </li>
                  <li>To check that you are licensed to ride, and to handle damage, insurance or traffic matters.</li>
                  <li>
                    If you start a checkout and leave before paying, to send you one email with a link to finish it,
                    when we have your address.
                  </li>
                  <li>To understand how the site is used and to measure and improve our advertising.</li>
                  <li>To prevent fraud, keep the site secure, and meet our legal, tax and accounting obligations.</li>
                </List>
                <p>We do not send marketing newsletters from this site.</p>
              </Section>

              <Section id="who-we-share-it-with" title="4. Who we share it with">
                <p>
                  We share personal information only with the companies that help us run the rental, each for its
                  own part of the job:
                </p>
                <List>
                  <li><strong className="text-[#1a1a17] font-medium">Stripe</strong>: payment processing, fraud screening, and the recovery link for unfinished checkouts.</li>
                  <li><strong className="text-[#1a1a17] font-medium">Airtable</strong>: where booking records, rider profiles and license photos are stored.</li>
                  <li><strong className="text-[#1a1a17] font-medium">Brevo</strong>: sending booking and reminder emails.</li>
                  <li><strong className="text-[#1a1a17] font-medium">Vercel</strong>: hosting the website.</li>
                  <li><strong className="text-[#1a1a17] font-medium">Google</strong>: Analytics, Tag Manager, Ads measurement, and the map on our booking page.</li>
                  <li>
                    <strong className="text-[#1a1a17] font-medium">Meta</strong> (Facebook, Instagram): ad measurement. When a booking is paid we
                    tell Meta a purchase happened, with your email, phone and name in hashed (scrambled, one-way)
                    form, so Meta can match it to an ad you saw without us handing over the details in clear.
                  </li>
                  <li>
                    <strong className="text-[#1a1a17] font-medium">The Vintage Rides group</strong>: our parent company&apos;s team helps operate
                    bookings and customer service, using the same systems.
                  </li>
                  <li>Our insurers, and law enforcement or authorities when the law requires it or a claim needs it.</li>
                  <li>A buyer or successor, if the business is ever sold or reorganized.</li>
                </List>
                <p>
                  We do not sell your personal information for money. Some US state laws treat advertising cookies
                  from Google and Meta as &ldquo;sharing&rdquo; or &ldquo;targeted advertising&rdquo;. You can opt
                  out of that as described in the next section, or by emailing <Mail />.
                </p>
              </Section>

              <Section id="cookies" title="5. Cookies and advertising">
                <p>We and our partners use cookies and similar technologies:</p>
                <List>
                  <li><strong className="text-[#1a1a17] font-medium">Essential</strong>: needed for the booking page and checkout to work.</li>
                  <li><strong className="text-[#1a1a17] font-medium">Analytics</strong>: Google Analytics, loaded directly and through Google Tag Manager, to count visits and see where the booking process loses people.</li>
                  <li>
                    <strong className="text-[#1a1a17] font-medium">Advertising</strong>: the Meta Pixel and Google Ads tags, which set cookies such
                    as <code className="text-sm bg-[#1a1a17]/5 px-1 rounded">_fbp</code>,{" "}
                    <code className="text-sm bg-[#1a1a17]/5 px-1 rounded">_fbc</code> and{" "}
                    <code className="text-sm bg-[#1a1a17]/5 px-1 rounded">_gcl_aw</code> to tell us which ads lead to
                    bookings and to show our ads to people likely to be interested.
                  </li>
                  <li>
                    <strong className="text-[#1a1a17] font-medium">Session storage</strong>: if you arrive from an ad, the click identifier is kept
                    in your browser for that visit only, so the booking can be attributed to it.
                  </li>
                </List>
                <p>To opt out:</p>
                <List>
                  <li>Block or delete cookies in your browser settings. The site and checkout still work without advertising cookies.</li>
                  <li>Google Analytics: install the <ExtLink href="https://tools.google.com/dlpage/gaoptout">Google Analytics opt-out add-on</ExtLink>.</li>
                  <li>Google ads: <ExtLink href="https://adssettings.google.com">Google Ad Settings</ExtLink>.</li>
                  <li>Meta ads: <ExtLink href="https://www.facebook.com/adpreferences">Meta ad preferences</ExtLink>.</li>
                  <li>
                    Industry opt-outs: <ExtLink href="https://optout.aboutads.info">DAA WebChoices</ExtLink> and{" "}
                    <ExtLink href="https://optout.networkadvertising.org">NAI opt-out</ExtLink>.
                  </li>
                </List>
              </Section>

              <Section id="retention" title="6. How long we keep it">
                <List>
                  <li>
                    Booking and payment records: as long as needed for accounting, tax and legal purposes, generally
                    up to seven years after your rental.
                  </li>
                  <li>
                    License number and photo: kept with your booking. Once your rental is closed and any damage or
                    insurance matter is settled, you can ask us to delete them.
                  </li>
                  <li>Search log on the booking page: {RETENTION_DAYS} days.</li>
                  <li>Analytics and advertising data: according to the retention settings of Google and Meta.</li>
                </List>
              </Section>

              <Section id="your-rights" title="7. Your choices and rights">
                <p>Wherever you live, you can ask us to:</p>
                <List>
                  <li>tell you what personal information we hold about you and send you a copy;</li>
                  <li>correct anything that is wrong;</li>
                  <li>delete your information, except what we must keep by law (such as payment records);</li>
                  <li>stop using your information for targeted advertising.</li>
                </List>
                <p>
                  Email <Mail /> from the address you booked with, or call us. We may ask you to confirm your
                  identity before acting, and we answer within 45 days. You can use an authorized agent, and we will
                  never charge you more or treat you differently for making a request. If we refuse a request, you
                  can reply to ask us to reconsider.
                </p>
                <p>
                  Visitors from the European Union or the United Kingdom also have the rights granted by the GDPR,
                  including the right to object to processing and to complain to your local data protection
                  authority.
                </p>
              </Section>

              <Section id="security" title="8. Security">
                <p>
                  The site runs over HTTPS, payments are processed on Stripe&apos;s PCI-compliant checkout, and access
                  to booking records is limited to the staff who run the rentals. No system is perfectly secure, so
                  if we ever learn of a breach affecting your information, we will notify you as the law requires.
                </p>
              </Section>

              <Section id="international" title="9. International transfers">
                <p>
                  We are based in the United States and part of our team works from France. Your information may be
                  stored or accessed in the United States, the European Union and wherever our service providers
                  operate. We use providers that apply appropriate safeguards to data they handle for us.
                </p>
              </Section>

              <Section id="children" title="10. Children">
                <p>
                  Renting a motorcycle requires a valid motorcycle license, and this site is not meant for children.
                  We do not knowingly collect personal information from anyone under 16. If you believe a child has
                  given us information, contact us and we will delete it.
                </p>
              </Section>

              <Section id="changes" title="11. Changes to this policy">
                <p>
                  When we change how we handle personal information, we update this page and the date at the top.
                  If a change is significant, we will say so on the site or by email before it applies to
                  information we already hold.
                </p>
              </Section>

              <Section id="contact" title="12. Contact us">
                <address className="not-italic bg-white border border-[#e8e3d3] rounded-sm p-6 md:p-7 leading-relaxed">
                  <span className="text-[#1a1a17] font-medium">Vintage Rides LLC</span>
                  <br />
                  {PICKUP_LOCATION.street}
                  <br />
                  {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
                  <br />
                  Email: <Mail />
                  <br />
                  Phone:{" "}
                  <a
                    href={`tel:${CONTACT.phone.e164}`}
                    className="text-[#1a1a17] border-b border-[#1a1a17]/25 hover:text-[#a9781a] hover:border-[#a9781a] transition-colors"
                  >
                    {CONTACT.phone.display}
                  </a>
                </address>
              </Section>
            </div>
          </div>
        </section>

        <section className="bg-[#2e3b23] py-14">
          <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="text-white/70 leading-relaxed">Questions about your data? We answer every email ourselves.</p>
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
