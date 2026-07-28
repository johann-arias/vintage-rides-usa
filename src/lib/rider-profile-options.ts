// Shapes shared by the rider profile form (a client component) and the server
// that saves it. Kept out of rider-profile.ts because importing that module
// from the browser would drag the Airtable SDK into the bundle, where there is
// no API key and the page dies on module evaluation.

/** What Airtable accepts for a licence photo, and what a phone camera produces. */
export const LICENSE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

/**
 * Airtable's upload endpoint caps attachments at 5 MB, and Vercel caps a
 * request body below that again. Images are downscaled in the browser before
 * they get here, so this is the backstop for a PDF or an odd file type.
 */
export const MAX_LICENSE_PHOTO_BYTES = 4 * 1024 * 1024;

export interface LicensePhotoUpload {
  filename: string;
  contentType: string;
  /** Base64 payload, no data: prefix. */
  data: string;
}

export interface RiderProfileInput {
  phone?: string;
  licenseNumber?: string;
  specialRequests?: string;
}
