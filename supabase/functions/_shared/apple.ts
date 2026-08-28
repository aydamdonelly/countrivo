// Shared Sign in with Apple server helpers: build the client-secret JWT, exchange
// an authorization code for a refresh token, and revoke a token on account
// deletion (Apple Guideline 5.1.1(v)). Everything is gated on the APPLE_* secrets
// so callers no-op safely when they are not configured.
//
// Required secrets (supabase secrets set ...):
//   APPLE_TEAM_ID     10-char Apple Developer Team ID
//   APPLE_KEY_ID      Key ID of a "Sign in with Apple" .p8 key
//   APPLE_PRIVATE_KEY the .p8 contents (PEM)
//   APPLE_CLIENT_ID   com.countrivo.app  (the native app's bundle ID)
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

export function appleConfigured(): boolean {
  return Boolean(
    Deno.env.get("APPLE_TEAM_ID") &&
      Deno.env.get("APPLE_KEY_ID") &&
      Deno.env.get("APPLE_PRIVATE_KEY") &&
      Deno.env.get("APPLE_CLIENT_ID"),
  );
}

async function importKey(): Promise<CryptoKey> {
  const pem = Deno.env.get("APPLE_PRIVATE_KEY")!
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

// Apple client secret: a short-lived ES256 JWT (aud = appleid, sub = client_id).
async function clientSecret(): Promise<string> {
  return await create(
    { alg: "ES256", kid: Deno.env.get("APPLE_KEY_ID")! },
    {
      iss: Deno.env.get("APPLE_TEAM_ID")!,
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 10),
      aud: "https://appleid.apple.com",
      sub: Deno.env.get("APPLE_CLIENT_ID")!,
    },
    await importKey(),
  );
}

async function appleForm(path: string, params: Record<string, string>): Promise<Response> {
  const body = new URLSearchParams({
    client_id: Deno.env.get("APPLE_CLIENT_ID")!,
    client_secret: await clientSecret(),
    ...params,
  });
  return await fetch(`https://appleid.apple.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

/** Exchange an authorization code for tokens. Returns the refresh_token plus the
 *  Apple user id (`sub`) decoded from the returned id_token, so the caller can
 *  bind it to the right account. Returns null on any failure. */
export async function exchangeAppleCode(
  code: string,
): Promise<{ refreshToken: string; sub: string | null } | null> {
  if (!appleConfigured()) return null;
  const res = await appleForm("/auth/token", { grant_type: "authorization_code", code });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const refreshToken = json?.refresh_token as string | undefined;
  if (!refreshToken) return null;
  let sub: string | null = null;
  try {
    const idt = json?.id_token as string | undefined;
    if (idt) {
      const payload = JSON.parse(
        atob(idt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      sub = (payload?.sub as string | undefined) ?? null;
    }
  } catch {
    /* leave sub null — caller fails open when it can't compare */
  }
  return { refreshToken, sub };
}

/** Revoke a stored refresh token on account deletion. Best-effort. */
export async function revokeAppleToken(token: string): Promise<boolean> {
  if (!appleConfigured()) return false;
  const res = await appleForm("/auth/revoke", { token, token_type_hint: "refresh_token" });
  return res.ok;
}
