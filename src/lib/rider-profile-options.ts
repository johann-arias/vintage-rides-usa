// The choice lists for the rider profile, in their own module because the form
// is a client component: importing them from rider-profile.ts would drag the
// Airtable SDK into the browser bundle, where there is no API key and the page
// dies on module evaluation.

export const HELMET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Bringing my own"] as const;

export const EXPERIENCE_LEVELS = [
  "First big bike",
  "Occasional rider",
  "Experienced",
  "Very experienced",
] as const;

export interface RiderProfileInput {
  phone?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  helmetSize?: string;
  ridingExperience?: string;
  specialRequests?: string;
}
