// Pure auth helpers shared by `proxy.ts` (edge/node) and Server Functions.
// IMPORTANT: do NOT import `next/headers` here — this module is loaded by the
// proxy, which runs before the request is rendered and has no request-scoped
// cookie store. Cookie read/write lives in `admin-session.ts` instead.

export const SESSION_COOKIE = "vr_admin_session";

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Opaque session token derived from ADMIN_PASSWORD. The cookie never stores the
 * password itself, and the token can be recomputed anywhere to validate a
 * session without a database.
 */
export async function expectedToken(): Promise<string> {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return sha256hex(`vr-usa-admin:${pw}`);
}
