"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAuthed, setSession, clearSession } from "@/lib/admin-session";
import {
  createB2BBooking,
  createMaintenanceBlock,
  cancelBooking,
  updateBooking,
  type RentalBooking,
} from "@/lib/airtable";

const VALID_STATUS = new Set<RentalBooking["status"]>([
  "Pending Payment",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
]);

// Server Functions run as POST to the route they live on. The proxy gates
// /admin, but per the Next.js data-security guidance we re-check auth inside
// every mutating action rather than trusting the proxy alone.
async function requireAuth() {
  if (!(await isAuthed())) redirect("/garage/login");
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/garage") || "/garage";

  if (password && password === process.env.ADMIN_PASSWORD) {
    await setSession();
    redirect(next.startsWith("/garage") ? next : "/garage");
  }
  redirect(`/garage/login?error=1&next=${encodeURIComponent(next)}`);
}

export async function logoutAction() {
  await clearSession();
  redirect("/garage/login");
}

export async function createB2BBookingAction(formData: FormData) {
  await requireAuth();

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const bikes = Math.max(1, Math.min(10, Number(formData.get("bikes") ?? 1)));
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const platform = String(formData.get("platform") ?? "").trim();

  if (!startDate || !endDate || !platform || (!firstName && !lastName)) {
    redirect("/garage/bookings/new?error=missing");
  }
  if (endDate < startDate) {
    redirect("/garage/bookings/new?error=dates");
  }

  await createB2BBooking({
    firstName,
    lastName,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    startDate,
    endDate,
    bikes,
    assignedBikes: formData.getAll("bike").map(String).filter(Boolean),
    platform,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });

  revalidatePath("/garage");
  revalidatePath("/garage/bookings");
  redirect("/garage/bookings?created=1");
}

export async function updateBookingAction(formData: FormData) {
  await requireAuth();

  const recordId = String(formData.get("recordId") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "Confirmed") as RentalBooking["status"];
  const status = VALID_STATUS.has(rawStatus) ? rawStatus : "Confirmed";
  const edit = `/garage/bookings/${recordId}/edit`;

  if (!recordId) redirect("/garage/bookings");
  if (!startDate || !endDate || (!firstName && !lastName)) {
    redirect(`${edit}?error=missing`);
  }
  if (endDate < startDate) {
    redirect(`${edit}?error=dates`);
  }

  await updateBooking(recordId, {
    firstName,
    lastName,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    startDate,
    endDate,
    numberOfBikes: Math.max(1, Math.min(10, Number(formData.get("bikes") ?? 1))),
    assignedBikes: formData.getAll("bike").map(String).filter(Boolean),
    status,
    platform: String(formData.get("platform") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });

  revalidatePath("/garage");
  revalidatePath("/garage/bookings");
  redirect("/garage/bookings?updated=1");
}

export async function createMaintenanceAction(formData: FormData) {
  await requireAuth();

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const bikes = Math.max(1, Math.min(10, Number(formData.get("bikes") ?? 1)));

  if (!startDate || !endDate || endDate < startDate) {
    redirect("/garage/fleet?error=dates");
  }

  await createMaintenanceBlock({
    startDate,
    endDate,
    bikes,
    reason: String(formData.get("reason") ?? "").trim() || undefined,
  });

  revalidatePath("/garage");
  revalidatePath("/garage/fleet");
  redirect("/garage/fleet?maint=1");
}

export async function cancelBookingAction(formData: FormData) {
  await requireAuth();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (bookingId) {
    await cancelBooking(bookingId);
    revalidatePath("/garage");
    revalidatePath("/garage/bookings");
  }
  redirect("/garage/bookings?cancelled=1");
}
