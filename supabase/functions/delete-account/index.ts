// Deletes the authenticated caller's own account (App Store Guideline 5.1.1(v)).
// Invoke from the client with the user's session (supabase.functions.invoke),
// which forwards the Authorization: Bearer <jwt> header. Uses the service-role
// key (auto-provided to Edge Functions) to perform the privileged delete, but
// only ever deletes the account that owns the presented JWT.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { revokeAppleToken } from "../_shared/apple.ts";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("unauthorized", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);
  if (error || !user) return new Response("unauthorized", { status: 401 });

  // Guideline 5.1.1(v): revoke the Sign in with Apple token before deleting.
  // Best-effort and never blocks the delete — if the APPLE_* secrets aren't set,
  // revokeAppleToken no-ops and the user is told to revoke access at
  // appleid.apple.com (documented fallback in docs/APP-STORE-MASTER.md).
  const { data: cred } = await admin
    .from("apple_credentials")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();
  if (cred?.refresh_token) {
    try {
      await revokeAppleToken(cred.refresh_token);
    } catch {
      /* non-fatal — proceed with the data delete regardless */
    }
  }

  // Cascades to game_runs / profiles / device_tokens / friendships /
  // apple_credentials via FKs.
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return new Response(delErr.message, { status: 500 });

  return new Response("ok");
});
