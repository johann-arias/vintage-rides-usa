import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Motorcycle Rental in Rapid City | Vintage Rides USA",
  description:
    "Book your Royal Enfield Himalayan 450 rental in Rapid City, SD. Check availability, pick your dates, and ride the Black Hills. $130/day + tax.",
  alternates: { canonical: "/book" },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
