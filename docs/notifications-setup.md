# Friend-Challenge Email Notifications — Setup

The scaffolding is in place. To go live, complete these one-time steps.

## 1. Resend account

1. Sign up at https://resend.com.
2. Create an API key (Dashboard → API Keys → Create).
3. Add and verify the sending domain `countrivo.com`:
   - Add the DKIM, SPF, and (recommended) DMARC records that Resend gives you to the DNS for `countrivo.com`.
   - Wait until Resend shows the domain as Verified.

## 2. Supabase Edge Function secret

The function `send-challenge-email` is already deployed. It silently no-ops until the key is set.

In the Supabase Dashboard:

- Edge Functions → Secrets → add `RESEND_API_KEY` = `<your-resend-key>`.

Or via CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxx --project-ref reqvdyfzwkrtlvgapnyq
```

## 3. Postgres custom setting (for the trigger)

The trigger `trg_notify_friend_challenge` reads `app.settings.service_role_key` to authorize its call to the edge function. Set it once in the Supabase Dashboard:

- Project Settings → Database → Custom Postgres config (or via the SQL editor as a superuser):

```sql
ALTER DATABASE postgres SET app.settings.service_role_key TO '<service-role-jwt>';
```

The service-role JWT comes from Project Settings → API → service_role. Treat it like a secret; it stays inside the database.

Without this value, the trigger still fires but the HTTP call to the edge function will fail auth, and the function will return 401. The INSERT into `friend_challenges` still succeeds.

## 4. Smoke test

```sql
INSERT INTO friend_challenges (challenger_id, challenged_id, game_slug, daily_date, status)
VALUES ('<your-uuid>', '<friend-uuid>', 'country-draft', current_date, 'pending');
```

Then check Supabase Dashboard → Edge Functions → `send-challenge-email` → Logs. With no key set you should see `would send to ...`. With a key + verified domain you should receive a real email.

## 5. In-app badge

The header already sums pending friend requests + pending challenges into the badge on the Friends nav link via `getPendingChallengeCount()` in `src/app/actions/challenges.ts`. No further wiring needed.
