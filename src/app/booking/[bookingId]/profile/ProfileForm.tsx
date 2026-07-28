"use client";

import { useRef, useState } from "react";
import {
  LICENSE_PHOTO_TYPES,
  MAX_LICENSE_PHOTO_BYTES,
  type LicensePhotoUpload,
} from "@/lib/rider-profile-options";
// Type-only, so nothing from the Airtable module reaches the browser bundle.
import type { RiderProfileBooking } from "@/lib/rider-profile";

const LABEL = "block text-xs font-semibold tracking-widest uppercase text-[#6e6a5e] mb-2";
const FIELD =
  "w-full border border-[#e8e3d3] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#d9a32b] focus:ring-1 focus:ring-[#d9a32b]";

/** Longest edge of a resized licence photo. Plenty to read a licence, small to send. */
const MAX_EDGE_PX = 1600;

/**
 * Phone cameras produce 4 to 12 MB files, well past what Airtable's attachment
 * endpoint accepts and what a serverless request body should carry. Redraw the
 * image at a sane size before it ever leaves the device. PDFs and anything the
 * browser cannot decode are passed through untouched and size-checked instead.
 */
async function toUpload(file: File): Promise<LicensePhotoUpload> {
  const asBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Could not read that file"));
      reader.readAsDataURL(blob);
    });

  if (!file.type.startsWith("image/") || file.type === "image/heic" || file.type === "image/heif") {
    return { filename: file.name, contentType: file.type, data: await asBase64(file) };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return { filename: file.name, contentType: file.type, data: await asBase64(file) };
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  );
  if (!blob) {
    return { filename: file.name, contentType: file.type, data: await asBase64(file) };
  }
  return {
    filename: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    contentType: "image/jpeg",
    data: await asBase64(blob),
  };
}

export default function ProfileForm({
  booking,
  token,
}: {
  booking: RiderProfileBooking;
  token: string;
}) {
  const [phone, setPhone] = useState(booking.phone);
  const [licenseNumber, setLicenseNumber] = useState(booking.licenseNumber);
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests);

  const [photo, setPhoto] = useState<LicensePhotoUpload | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(booking.completedAt));
  const [hasPhoto, setHasPhoto] = useState(booking.hasLicensePhoto);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPreparingPhoto(true);
    try {
      const upload = await toUpload(file);
      if ((upload.data.length * 3) / 4 > MAX_LICENSE_PHOTO_BYTES) {
        setError("That file is too big. A photo taken with your phone camera works best.");
        setPhoto(null);
        setPhotoName("");
        return;
      }
      setPhoto(upload);
      setPhotoName(file.name);
      setPhotoPreview(
        upload.contentType.startsWith("image/")
          ? `data:${upload.contentType};base64,${upload.data}`
          : ""
      );
    } catch {
      setError("Could not read that file. Try a photo or a PDF.");
      setPhoto(null);
      setPhotoName("");
    } finally {
      setPreparingPhoto(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoName("");
    setPhotoPreview("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/rider-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          token,
          phone,
          licenseNumber,
          specialRequests,
          licensePhoto: photo ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save. Please try again.");
        return;
      }
      setSaved(true);
      if (data.photoError) {
        setError(data.photoError);
      } else if (photo) {
        setHasPhoto(true);
        clearPhoto();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="rounded-sm border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          <span className="font-semibold">Thank you, that&apos;s all we needed.</span> Your details
          are with the team. You can change anything below and save again any time before pickup.
        </div>
      )}
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-sm border border-[#e8e3d3] p-6 md:p-8 space-y-5">
        <div>
          <label className={LABEL} htmlFor="phone">
            Mobile number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 605 555 0134"
            className={FIELD}
          />
          <p className="mt-1.5 text-xs text-[#6e6a5e]">
            So we can reach you on the day, about the bike or the weather.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="licence">
            Motorcycle license number
          </label>
          <input
            id="licence"
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="The one with your motorcycle endorsement"
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="licencePhoto">
            Photo of your license
          </label>
          {hasPhoto && !photoName ? (
            <div className="flex items-center justify-between gap-4 rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <span>License received. Thank you.</span>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="shrink-0 text-xs font-semibold uppercase tracking-wider underline underline-offset-2"
              >
                Replace
              </button>
            </div>
          ) : null}
          <input
            id="licencePhoto"
            ref={fileInput}
            type="file"
            accept={LICENSE_PHOTO_TYPES.join(",")}
            capture="environment"
            onChange={handleFile}
            className={`${hasPhoto && !photoName ? "sr-only" : ""} block w-full text-sm text-[#6e6a5e] file:mr-4 file:rounded-sm file:border-0 file:bg-[#2e3b23] file:px-4 file:py-2.5 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white hover:file:bg-[#3a4a2c]`}
          />
          {preparingPhoto && (
            <p className="mt-2 text-xs text-[#6e6a5e]">Preparing your photo…</p>
          )}
          {photoName && !preparingPhoto && (
            <div className="mt-3 flex items-center gap-3">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Your license, as it will be sent"
                  className="h-16 w-24 rounded-sm border border-[#e8e3d3] object-cover"
                />
              ) : null}
              <div className="min-w-0 text-xs text-[#6e6a5e]">
                <p className="truncate">{photoName}</p>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-1 font-semibold uppercase tracking-wider underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-[#6e6a5e]">
            A phone photo of the front is enough. We check it before you arrive, so pickup is keys
            and go. Bring the license itself either way, we look at it at the counter.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="requests">
            Anything else
          </label>
          <textarea
            id="requests"
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Luggage, route ideas, riding with someone else…"
            className={`${FIELD} resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || preparingPhoto}
        className="w-full bg-[#2e3b23] hover:bg-[#3a4a2c] disabled:opacity-60 text-white font-semibold tracking-wider py-4 rounded-sm transition-colors text-sm uppercase"
      >
        {saving ? "Saving…" : saved ? "Save changes" : "Save my details"}
      </button>
      <p className="text-center text-xs text-[#6e6a5e]">
        Every field is optional. Whatever you skip, we&apos;ll sort out at the counter.
      </p>
    </form>
  );
}
