export const PICKUP_LOCATION = {
  name: "Vintage Rides USA",
  street: "1715 Samco Rd #107",
  city: "Rapid City",
  state: "SD",
  zip: "57702",
} as const;

export const PICKUP_ADDRESS_INLINE = `${PICKUP_LOCATION.street}, ${PICKUP_LOCATION.city}, ${PICKUP_LOCATION.state} ${PICKUP_LOCATION.zip}`;

const QUERY = encodeURIComponent(PICKUP_ADDRESS_INLINE);

// Opens the address in the user's default Google Maps app/site.
export const PICKUP_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${QUERY}`;

// Opens turn-by-turn directions to the pickup location.
export const PICKUP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${QUERY}`;

// Embeddable iframe map (no API key required).
export const PICKUP_MAP_EMBED_URL = `https://maps.google.com/maps?q=${QUERY}&output=embed`;

// Google Business Profile — official "Get more reviews" short link.
// Opens the star-rating dialog directly (one tap). Also used behind shop QR code + post-rental SMS.
export const GOOGLE_REVIEW_URL = "https://g.page/r/CY5YelfIVtMIEBM/review";

// Public GBP listing (shows all existing reviews).
export const GOOGLE_LISTING_URL = "https://share.google/lzlz2jYsuFtaHkgAO";

// Contact channels.
export const CONTACT = {
  phone: { display: "+1 (760) 350-9700", e164: "+17603509700" },
  whatsapp: { display: "+1 (760) 350-9700", e164: "+17603509700" },
  email: "wendy@vintagerides.travel",
} as const;

export const CONTACT_LINKS = {
  phone: `tel:${CONTACT.phone.e164}`,
  whatsapp: `https://wa.me/${CONTACT.whatsapp.e164.replace("+", "")}`,
  email: `mailto:${CONTACT.email}`,
} as const;
