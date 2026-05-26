import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let challenge_id: string | number | undefined;
  try {
    const body = await req.json();
    challenge_id = body.challenge_id;
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  if (challenge_id === undefined) return new Response("Missing challenge_id", { status: 400 });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: challenge, error } = await sb
    .from("friend_challenges")
    .select(`
      id, game_slug, created_at,
      challenger:profiles!friend_challenges_challenger_id_fkey(id, username, display_name),
      challenged:profiles!friend_challenges_challenged_id_fkey(id, username, display_name)
    `)
    .eq("id", challenge_id)
    .single();
  if (error || !challenge) return new Response("Challenge not found", { status: 404 });

  const { data: { user }, error: userErr } = await sb.auth.admin.getUserById(challenge.challenged.id);
  if (userErr || !user?.email) return new Response("Recipient has no email", { status: 400 });

  if (!RESEND_API_KEY) {
    // Dev mode / not configured — log the email instead of sending.
    console.log("[send-challenge-email] would send to", user.email, "from challenge", challenge_id);
    return new Response(JSON.stringify({ skipped: "no RESEND_API_KEY configured" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const challengerName = challenge.challenger.display_name ?? challenge.challenger.username ?? "Someone";
  const gameLabel = challenge.game_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Countrivo <noreply@countrivo.com>",
      to: user.email,
      subject: `${challengerName} challenged you · ${gameLabel}`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h1 style="font-size:22px;margin:0 0 12px"><strong>${challengerName}</strong> just challenged you</h1>
          <p style="margin:0 0 16px;color:#444">Game: <strong>${gameLabel}</strong></p>
          <a href="https://countrivo.com/friends"
             style="display:inline-block;background:#b8860b;color:#fafaf8;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            Accept the challenge
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#888">
            Countrivo · One puzzle a day · Since 2026
          </p>
        </div>`,
    }),
  });

  const ok = res.ok;
  let detail: unknown = null;
  try {
    detail = await res.json();
  } catch {
    // ignore parse failure
  }

  return new Response(JSON.stringify({ sent: ok, detail }), {
    status: ok ? 200 : 502,
    headers: { "content-type": "application/json" },
  });
});
