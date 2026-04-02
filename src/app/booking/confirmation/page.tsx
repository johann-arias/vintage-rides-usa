import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ConfirmationPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 bg-[#f8f6f0] min-h-screen">
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="text-6xl mb-6">🏍</div>
          <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Booking Confirmed
          </div>
          <h1 className="text-[#111110] text-3xl md:text-4xl font-light mb-4">
            You&apos;re all set.
          </h1>
          <p className="text-[#6b6b6b] text-lg leading-relaxed mb-8">
            Your booking is confirmed. A confirmation email is on its way.
            We&apos;ll follow up with pickup details and route suggestions.
          </p>

          <div className="bg-white border border-[#e8e6e0] rounded-sm p-6 text-left mb-8 space-y-3">
            <h2 className="text-[#111110] font-semibold mb-4">What&apos;s next</h2>
            {[
              "Check your inbox for your confirmation email",
              "We'll send pickup location and instructions 7 days before your start date",
              "Request GPX routes or route suggestions by replying to your confirmation",
              "24/7 support: usa@vintagerides.com",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-[#2a2a28]">
                <span className="text-[#c8a45a] font-bold shrink-0">{i + 1}.</span>
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="border border-[#2a2a28] text-[#111110] font-medium tracking-wider px-6 py-3 rounded-sm hover:bg-[#111110] hover:text-white transition-colors text-sm uppercase"
            >
              Back to Home
            </Link>
            <Link
              href="https://www.vintagerides.com"
              target="_blank"
              className="bg-[#c8a45a] hover:bg-[#e8c98a] text-[#111110] font-semibold tracking-wider px-6 py-3 rounded-sm transition-colors text-sm uppercase"
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
