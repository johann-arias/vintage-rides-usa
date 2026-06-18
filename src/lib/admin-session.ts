import { cookies } from "next/headers";
import { SESSION_COOKIE, expectedToken } from "@/lib/admin-auth";

// Request-scoped session helpers for Server Functions / Server Components.
// Kept separate from `admin-auth.ts` so the proxy never imports `next/headers`.

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === (await expectedToken());
}

export async function setSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await expectedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
