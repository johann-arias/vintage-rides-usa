import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { verifyProfileToken } from "@/lib/booking-token";
import { getRiderProfileBooking } from "@/lib/rider-profile";
import { PICKUP_LOCATION } from "@/lib/location";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

// A booking page is nobody else's business, and a search engine has no reason
// to index one.
export const metadata: Metadata = {
  title: "Your ride details — Vintage Rides USA",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 bg-[#faf5ea] min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-16">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export default async function RiderProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { bookingId } = await params;
  const { t } = await searchParams;

  if (!verifyProfileToken(bookingId, t)) {
    return (
      <Shell>
        <h1 className="text-[#1a1a17] text-2xl font-light mb-3">This link isn&apos;t valid</h1>
        <p className="text-[#6e6a5e]">
          It may have been truncated by your email app. Open the link from the original confirmation
          email, or just reply to it and we&apos;ll take your details by hand.
        </p>
      </Shell>
    );
  }

  const booking = await getRiderProfileBooking(bookingId);
  if (!booking) {
    return (
      <Shell>
        <h1 className="text-[#1a1a17] text-2xl font-light mb-3">Booking not found</h1>
        <p className="text-[#6e6a5e]">
          Reply to your confirmation email and we&apos;ll sort it out.
        </p>
      </Shell>
    );
  }

  const dates = `${new Date(`${booking.startDate}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })} → ${new Date(`${booking.endDate}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;

  return (
    <Shell>
      <p className="text-[#a9781a] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
        Booking {booking.bookingId}
      </p>
      <h1 className="text-[#1a1a17] text-3xl font-light mb-3">
        {booking.firstName ? `Almost set, ${booking.firstName}.` : "Almost set."}
      </h1>
      <p className="text-[#6e6a5e] leading-relaxed mb-2">
        Your bike is booked for <span className="text-[#1a1a17] font-medium">{dates}</span>
        {booking.numberOfBikes > 1 ? `, ${booking.numberOfBikes} bikes` : ""}
        {booking.pickupTime ? `, pickup at ${booking.pickupTime}` : ""}. Two minutes of details and
        we can have everything ready when you walk in at {PICKUP_LOCATION.city}.
      </p>
      <p className="text-[#6e6a5e] text-sm mb-8">
        Nothing here is required. It just saves time at the counter.
      </p>
      <ProfileForm booking={booking} token={t!} />
    </Shell>
  );
}
