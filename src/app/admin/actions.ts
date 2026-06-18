"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAuthed, setSession, clearSession } from "@/lib/admin-session";
import {
  createB2BBooking,
  createMaintenanceBlock,
  cancelBooking,
} from "@/lib/airtable";

// Server Functions run as POST to the route they live on. The proxy gates
// /admin, but per the Next.js data-security guidance we re-check auth inside
// every mutating action rather than trusting the proxy alone.
async function requireAuth() {
  if (!(await isAuthed())) redirect("/admin/login");
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin") || "/admin";

  if (password && password === process.env.ADMIN_PASSWORD) {
    await setSession();
    redirect(next.startsWith("/admin") ? next : "/admin");
  }
  redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
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
    redirect("/admin/bookings/new?error=missing");
  }
  if (endDate < startDate) {
    redirect("/admin/bookings/new?error=dates");
  }

  await createB2BBooking({
    firstName,
    lastName,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    startDate,
    endDate,
    bikes,
    platform,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  redirect("/admin/bookings?created=1");
}

export async function createMaintenanceAction(formData: FormData) {
  await requireAuth();

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const bikes = Math.max(1, Math.min(10, Number(formData.get("bikes") ?? 1)));

  if (!startDate || !endDate || endDate < startDate) {
    redirect("/admin/fleet?error=dates");
  }

  await createMaintenanceBlock({
    startDate,
    endDate,
    bikes,
    reason: String(formData.get("reason") ?? "").trim() || undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/fleet");
  redirect("/admin/fleet?maint=1");
}

export async function cancelBookingAction(formData: FormData) {
  await requireAuth();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (bookingId) {
    await cancelBooking(bookingId);
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
  }
  redirect("/admin/bookings?cancelled=1");
}
