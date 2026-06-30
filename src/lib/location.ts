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

// Pickup / drop-off time slots offered at checkout.
// Every 30 minutes from 8:00 AM through 6:00 PM, plus an after-hours option.
// Anything outside this window is arranged directly with the team.
export const AFTER_HOURS_OPTION = "After hours (by appointment)";

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = 8 * 60; minutes <= 18 * 60; minutes += 30) {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h24 < 12 ? "AM" : "PM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    slots.push(`${h12}:${m.toString().padStart(2, "0")} ${period}`);
  }
  return slots;
}

// e.g. ["8:00 AM", "8:30 AM", … , "6:00 PM"]
export const RENTAL_TIME_SLOTS = buildTimeSlots();

// Default standard pickup time. Drop-off is always arranged by appointment.
export const DEFAULT_PICKUP_TIME = "9:00 AM";
export const DROPOFF_BY_APPOINTMENT = "By appointment";
export const DEFAULT_DROPOFF_TIME = DROPOFF_BY_APPOINTMENT;

export const CONTACT_LINKS = {
  phone: `tel:${CONTACT.phone.e164}`,
  whatsapp: `https://wa.me/${CONTACT.whatsapp.e164.replace("+", "")}`,
  email: `mailto:${CONTACT.email}`,
} as const;
