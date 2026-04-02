import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vintage Ride USA — Royal Enfield Himalayan 450 Rentals",
  description:
    "Rent a Royal Enfield Himalayan 450 and explore the American West with Vintage Ride USA. Self-guided adventures on world-class adventure motorcycles.",
  keywords: ["motorcycle rental", "Royal Enfield", "Himalayan 450", "adventure riding", "USA", "self-guided"],
  openGraph: {
    title: "Vintage Ride USA — Motorcycle Rentals",
    description: "Ride the American West on a Royal Enfield Himalayan 450.",
    siteName: "Vintage Ride USA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
