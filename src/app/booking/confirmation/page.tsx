import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  PICKUP_LOCATION,
  PICKUP_ADDRESS_INLINE,
  PICKUP_DIRECTIONS_URL,
  PICKUP_MAP_EMBED_URL,
} from "@/lib/location";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const { pending } = await searchParams;
  const isPending = pending === "1";
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 bg-[#faf5ea] min-h-screen">
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="text-6xl mb-6">🏍</div>
          <div
            className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 ${
              isPending ? "bg-[#f6e6c4] text-[#8a6516]" : "bg-green-100 text-green-700"
            }`}
          >
            {isPending ? "Request received" : "Booking Confirmed"}
          </div>
          <h1 className="text-[#1a1a17] text-3xl md:text-4xl font-light mb-4">
            {isPending ? "We're on it." : "You're all set."}
          </h1>
          <p className="text-[#6e6a5e] text-lg leading-relaxed mb-8">
            {isPending
              ? "Because you're riding today, your card is authorized but not yet charged. Our team is confirming a bike and will finalize your booking shortly — watch your inbox for the confirmation. If we can't confirm, the hold is released and you're not charged."
              : "Your booking is confirmed. A confirmation email is on its way with your booking reference."}
          </p>

          <div className="bg-white border border-[#e8e3d3] rounded-sm overflow-hidden text-left mb-6">
            <div className="p-6 pb-4">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#d9a32b] mb-2">Pickup location</p>
              <p className="text-[#1a1a17] font-semibold text-base">{PICKUP_LOCATION.name}</p>
              <p className="text-[#2a2a24] text-sm mt-1">{PICKUP_LOCATION.street}</p>
              <p className="text-[#2a2a24] text-sm">{PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}</p>
              <p className="text-[#2a2a24] text-sm mt-3">
                Your selected pickup &amp; drop-off times are in your confirmation email.
              </p>
              <a
                href={PICKUP_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-[#d9a32b] hover:text-[#966b14] font-medium"
              >
                Get directions →
              </a>
            </div>
            <iframe
              title="Pickup location map"
              src={PICKUP_MAP_EMBED_URL}
              className="w-full h-64 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="bg-white border border-[#e8e3d3] rounded-sm p-6 text-left mb-8 space-y-3">
            <h2 className="text-[#1a1a17] font-semibold mb-4">What&apos;s next</h2>
            {[
              "Check your inbox for your confirmation email — your booking reference is your check-in code.",
              `Head to ${PICKUP_ADDRESS_INLINE} at your selected pickup time on your start date, and return your bike by your drop-off time on your end date — both are listed in your confirmation email.`,
              "Request GPX routes or route suggestions for the Black Hills, Badlands, or Needles Highway by replying to your confirmation.",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-[#2a2a24]">
                <span className="text-[#d9a32b] font-bold shrink-0">{i + 1}.</span>
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="border border-[#3a4730] text-[#1a1a17] font-medium tracking-wider px-6 py-3 rounded-sm hover:bg-[#2e3b23] hover:text-white transition-colors text-sm uppercase"
            >
              Back to Home
            </Link>
            <Link
              href="https://www.vintagerides.com"
              target="_blank"
              className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] font-semibold tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
            >
              Explore Guided Tours
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
