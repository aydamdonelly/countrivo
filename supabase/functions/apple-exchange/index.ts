// Exchanges a Sign in with Apple authorization code for a refresh token and
// stores it, so account deletion can revoke it (Guideline 5.1.1(v)). The client
// invokes this right after a native Apple sign-in. No-op (returns stored:false)
// when the APPLE_* secrets are absent — the app keeps working and deletion falls
// back to a data-only delete (documented in docs/APP-STORE-MASTER.md).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { appleConfigured, exchangeAppleCode } from "../_shared/apple.ts";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("unauthorized", { status: 401 });
  if (!appleConfigured()) {
    return new Response(JSON.stringify({ stored: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return new Response("unauthorized", { status: 401 });

  const { authorizationCode } = await req.json().catch(() => ({}));
  if (typeof authorizationCode !== "string" || !authorizationCode) {
    return new Response("bad request", { status: 400 });
  }

  const result = await exchangeAppleCode(authorizationCode);
  if (!result?.refreshToken) {
    return new Response(JSON.stringify({ stored: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Token-swap defense: the code must resolve to THIS user's Apple identity.
  // Fail open if either sub is unavailable (can't compare) so a configured
  // exchange is never broken by a missing field.
  const appleIdentity = user.identities?.find((i) => i.provider === "apple");
  const expectedSub =
    (appleIdentity?.identity_data?.sub as string | undefined) ?? appleIdentity?.id ?? null;
  if (result.sub && expectedSub && result.sub !== expectedSub) {
    return new Response("identity_mismatch", { status: 403 });
  }

  await admin.from("apple_credentials").upsert(
    { user_id: user.id, refresh_token: result.refreshToken, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  return new Response(JSON.stringify({ stored: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
