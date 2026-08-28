// Scheduled evening "streak at risk" reminder — the highest-leverage retention
// push. Selects users who have a LIVE streak but have NOT played today
// (Europe/Berlin, the app's daily boundary) and sends each one APNs push via the
// send-push function. Anyone who already played today is hard-suppressed.
//
// SETUP (manual — see docs/APP-STORE-MASTER.md and docs/GROWTH-ROADMAP.md):
//   1) Supabase ▸ Database ▸ Extensions: enable pg_cron and pg_net.
//   2) supabase secrets set CRON_SECRET=<random>   (send-push already reads it)
//   3) deploy: supabase functions deploy streak-reminder
//   4) schedule ~19:00 Berlin (= 18:00 UTC in winter, 17:00 UTC in summer DST):
//      select cron.schedule('streak-reminder', '0 18 * * *', $$
//        select net.http_post(
//          url     => 'https://<project-ref>.supabase.co/functions/v1/streak-reminder',
//          headers => jsonb_build_object('x-cron-secret', '<random>', 'Content-Type', 'application/json'),
//          body    => '{}'::jsonb
//        ) $$);
// Frequency cap: the cron fires once/day, so this is at most one push per user
// per day. Keep it that way — never add a second daily push lever without a cap.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

Deno.serve(async (req) => {
  // Internal-only: pg_cron must present the shared secret (same guard as send-push).
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const admin = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // The same Europe/Berlin boundary the whole app resets on.
  const todayBerlin = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });

  // Only users with a registered device can be reached — fetch that set first
  // so we never fan out a send-push call into the void.
  const { data: tokenRows } = await admin.from("device_tokens").select("user_id");
  const withTokens = new Set((tokenRows ?? []).map((r) => r.user_id as string));
  if (withTokens.size === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Live streak AND has not played today → exactly the at-risk cohort.
  const { data: due, error } = await admin
    .from("profiles")
    .select("id, streak_current, last_daily_date")
    .gt("streak_current", 0)
    .lt("last_daily_date", todayBerlin);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const row of due ?? []) {
    const userId = row.id as string;
    if (!withTokens.has(userId)) continue;
    const n = row.streak_current as number;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": CRON_SECRET },
      body: JSON.stringify({
        user_id: userId,
        title: "Keep your streak alive",
        body: `Play today's daily to hold your ${n}-day streak.`,
        // gameSlug drives the native deep-link on tap (handled in bootstrap.ts).
        data: { gameSlug: "country-draft" },
      }),
    });
    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
