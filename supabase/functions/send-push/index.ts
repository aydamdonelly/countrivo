// Sends an APNs push to all of a user's device tokens.
// Invoke with JSON: { user_id, title, body, data? }.
// Secrets required (supabase secrets set): APNS_KEY_ID, APNS_TEAM_ID,
// APNS_BUNDLE_ID (= com.countrivo.app, used as apns-topic), APNS_PRIVATE_KEY
// (the .p8 contents), APNS_ENV ('sandbox' while testing from Xcode, else 'production').
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const KEY_ID = Deno.env.get("APNS_KEY_ID")!;
const TEAM_ID = Deno.env.get("APNS_TEAM_ID")!;
const BUNDLE = Deno.env.get("APNS_BUNDLE_ID")!;
const P8 = Deno.env.get("APNS_PRIVATE_KEY")!;
const HOST =
  (Deno.env.get("APNS_ENV") ?? "production") === "sandbox"
    ? "https://api.development.push.apple.com"
    : "https://api.push.apple.com";

async function importKey(): Promise<CryptoKey> {
  const pem = P8.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

let cached: { jwt: string; at: number } | null = null;
async function apnsJwt(): Promise<string> {
  // APNs rejects a token whose iat is > 1h old; refresh well inside that.
  if (cached && Date.now() - cached.at < 50 * 60_000) return cached.jwt;
  const jwt = await create(
    { alg: "ES256", kid: KEY_ID },
    { iss: TEAM_ID, iat: getNumericDate(0) },
    await importKey(),
  );
  cached = { jwt, at: Date.now() };
  return jwt;
}

Deno.serve(async (req) => {
  // Internal-only: callers (the streak-reminder cron) must present the shared
  // secret. Without this, any authenticated user could invoke this function with
  // an arbitrary user_id and spam pushes with attacker-controlled text.
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const { user_id, title, body, data } = await req.json().catch(() => ({}));
  if (
    typeof user_id !== "string" ||
    typeof title !== "string" || !title.trim() || title.length > 150 ||
    typeof body !== "string" || body.length > 300
  ) {
    return new Response("bad request", { status: 400 });
  }
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: tokens } = await admin
    .from("device_tokens")
    .select("token")
    .eq("user_id", user_id);

  const jwt = await apnsJwt();
  const payload = JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, ...data });

  for (const { token } of tokens ?? []) {
    const res = await fetch(`${HOST}/3/device/${token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": BUNDLE,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: payload,
    });
    // 410 Gone = the token is no longer valid; prune it.
    if (res.status === 410) await admin.from("device_tokens").delete().eq("token", token);
  }
  return new Response("ok");
});
