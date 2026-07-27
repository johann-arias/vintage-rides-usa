import type { Metadata } from "next";
import Script from "next/script";
import { GoogleTagManager } from "@next/third-parties/google";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import ContactButton from "@/components/ContactButton";
import { PICKUP_LOCATION, CONTACT } from "@/lib/location";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

const GA_ID = GA_MEASUREMENT_ID;
const GTM_ID = "GTM-T22FLRVR";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vintageridesusa.com"),
  title: "Motorcycle Rental Rapid City & Black Hills | Vintage Rides USA",
  description:
    "Rent a Royal Enfield Himalayan 450 in Rapid City, SD. Explore the Black Hills, Badlands, and Sturgis on a world-class adventure motorcycle. Daily rentals available year-round.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "motorcycle rental Rapid City",
    "motorcycle rental Black Hills",
    "bike rental Rapid City SD",
    "Royal Enfield rental South Dakota",
    "Himalayan 450 rental",
    "Black Hills motorcycle rental",
    "Badlands motorcycle rental",
    "Sturgis motorcycle rental",
    "adventure motorcycle rental South Dakota",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: "https://www.vintageridesusa.com",
    title: "Motorcycle Rental in Rapid City & Black Hills | Vintage Rides USA",
    description:
      "Rent a Royal Enfield Himalayan 450 in Rapid City and ride the Black Hills. $130/day + tax.",
    siteName: "Vintage Rides USA",
    images: [
      {
        url: "/mike-wendy-garage.jpg",
        width: 1600,
        height: 1200,
        alt: "Mike & Wendy, your Vintage Rides USA hosts in Rapid City, South Dakota",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Motorcycle Rental in Rapid City & Black Hills | Vintage Rides USA",
    description:
      "Rent a Royal Enfield Himalayan 450 in Rapid City and ride the Black Hills. $130/day + tax.",
    images: ["/mike-wendy-garage.jpg"],
  },
};

const SITE_URL = "https://www.vintageridesusa.com";

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["MotorcycleDealer", "LocalBusiness"],
  "@id": `${SITE_URL}#business`,
  name: "Vintage Rides USA",
  alternateName: "Vintage Rides USA — Royal Enfield Rentals",
  description:
    "Motorcycle rental in Rapid City, SD. Premium adventure motorcycle rentals from $130/day on a fleet of 10 brand-new 2025 Royal Enfield Himalayan 450s. Ride the Black Hills, Badlands, Needles Highway, Spearfish Canyon, Mount Rushmore, Custer State Park, and Sturgis.",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: [
    `${SITE_URL}/hero-bike-outdoor.jpg`,
    `${SITE_URL}/fleet-lineup-wall.jpg`,
    `${SITE_URL}/bike-studio.jpg`,
  ],
  telephone: CONTACT.phone.e164,
  email: CONTACT.email,
  priceRange: "$130/day",
  currenciesAccepted: "USD",
  paymentAccepted: "Credit Card",
  address: {
    "@type": "PostalAddress",
    streetAddress: PICKUP_LOCATION.street,
    addressLocality: PICKUP_LOCATION.city,
    addressRegion: PICKUP_LOCATION.state,
    postalCode: PICKUP_LOCATION.zip,
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 44.0918,
    longitude: -103.2747,
  },
  hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${PICKUP_LOCATION.street}, ${PICKUP_LOCATION.city}, ${PICKUP_LOCATION.state} ${PICKUP_LOCATION.zip}`
  )}`,
  areaServed: [
    { "@type": "AdministrativeArea", name: "Black Hills" },
    { "@type": "AdministrativeArea", name: "South Dakota" },
    { "@type": "Place", name: "Badlands National Park" },
    { "@type": "Place", name: "Needles Highway" },
    { "@type": "Place", name: "Mount Rushmore" },
    { "@type": "Place", name: "Spearfish Canyon" },
    { "@type": "Place", name: "Custer State Park" },
    { "@type": "Place", name: "Sturgis" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:00",
      closes: "17:00",
      validFrom: "2026-05-01",
      validThrough: "2026-09-30",
    },
  ],
  knowsAbout: [
    "Motorcycle rental",
    "Royal Enfield Himalayan 450",
    "Adventure motorcycle touring",
    "Black Hills motorcycle routes",
    "Badlands motorcycle touring",
    "Sturgis motorcycle rental",
  ],
  brand: {
    "@type": "Brand",
    name: "Royal Enfield",
  },
  parentOrganization: {
    "@type": "Organization",
    name: "Vintage Rides",
    url: "https://www.vintagerides.com",
    description:
      "Premium guided motorcycle touring company with 20 years of experience across the Himalayas, Andes, and Atlas.",
  },
  makesOffer: {
    "@type": "Offer",
    "@id": `${SITE_URL}#daily-rental-offer`,
    name: "Royal Enfield Himalayan 450 daily rental",
    priceCurrency: "USD",
    price: "130",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "130",
      priceCurrency: "USD",
      unitText: "DAY",
    },
    availability: "https://schema.org/InStock",
    availabilityStarts: "2026-05-01",
    availabilityEnds: "2026-09-30",
    seller: { "@id": `${SITE_URL}#business` },
    itemOffered: { "@id": `${SITE_URL}#himalayan-450` },
  },
  sameAs: [
    "https://www.vintagerides.com",
    "https://share.google/lzlz2jYsuFtaHkgAO",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "Vintage Rides USA",
  publisher: { "@id": `${SITE_URL}#business` },
  inLanguage: "en-US",
};

const motorcycleJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Motorcycle", "Product"],
  "@id": `${SITE_URL}#himalayan-450`,
  name: "2025 Royal Enfield Himalayan 450",
  description:
    "Brand-new 2025 Royal Enfield Himalayan 450 adventure motorcycle available for rent at Vintage Rides USA in Rapid City, SD. 452cc single-cylinder engine, long-travel suspension, ideal for the Black Hills, Badlands, and Needles Highway.",
  image: [
    `${SITE_URL}/bike-studio.jpg`,
    `${SITE_URL}/hero-bike-outdoor.jpg`,
  ],
  brand: { "@type": "Brand", name: "Royal Enfield" },
  manufacturer: { "@type": "Organization", name: "Royal Enfield" },
  model: "Himalayan 450",
  vehicleModelDate: "2025",
  vehicleEngine: {
    "@type": "EngineSpecification",
    engineDisplacement: { "@type": "QuantitativeValue", value: 452, unitCode: "CMQ" },
  },
  fuelType: "Gasoline",
  numberOfForwardGears: 6,
  category: "Adventure motorcycle rental",
  offers: {
    "@type": "Offer",
    url: `${SITE_URL}/book`,
    priceCurrency: "USD",
    price: "130",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "130",
      priceCurrency: "USD",
      unitText: "DAY",
    },
    availability: "https://schema.org/InStock",
    availabilityStarts: "2026-05-01",
    availabilityEnds: "2026-09-30",
    seller: { "@id": `${SITE_URL}#business` },
    areaServed: { "@type": "AdministrativeArea", name: "South Dakota" },
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
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <GoogleTagManager gtmId={GTM_ID} />
      <body className="min-h-full flex flex-col">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(motorcycleJsonLd) }}
        />
        {children}
        <ContactButton />
      </body>
    </html>
  );
}
