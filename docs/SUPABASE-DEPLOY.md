# Supabase — fertig vorbereitetes Copy-Paste (Projekt: countrivo / reqvdyfzwkrtlvgapnyq)

Werte sind schon eingesetzt: Team **88J7VD74DB**, APNs-Key **J56G5XDVQT**, Bundle **com.countrivo.app**, Project-Ref **reqvdyfzwkrtlvgapnyq**.
Platzhalter `<…>` sind nur Dinge, die ich nicht haben kann (deine `.p8`-Dateien + der NEUE Sign-in-with-Apple-Key).

---

## ✅ Schon von mir erledigt
- Edge Functions in **Production deployed + getestet**: `apple-exchange`, `delete-account`, `send-push` (no-verify-jwt), `streak-reminder` (no-verify-jwt).
  Live-Check: apple-exchange/delete-account → 401 ohne User-JWT, send-push/streak-reminder → 403 ohne Cron-Secret. ✔

---

## 1) SQL einfügen — Supabase ▸ SQL Editor ▸ Run
Beide Statements sind idempotent (`if not exists`), also gefahrlos — auch wenn du sie schon mal liefst.

```sql
-- Apple-Token-Speicher (für 5.1.1(v) Token-Revoke bei Account-Löschung)
create table if not exists public.apple_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.apple_credentials enable row level security;

-- Streak-Freeze (eine verpasste Tageschance bricht den Streak nicht mehr)
alter table public.profiles
  add column if not exists streak_freezes smallint not null default 2,
  add column if not exists streak_frozen_dates date[] not null default '{}';
```

## 2) Sign in with Apple aktivieren — Supabase ▸ Authentication ▸ Providers ▸ Apple
- **Enabled** an.
- **Client IDs:** `com.countrivo.app` eintragen.
- (Für den nativen idToken-Flow KEIN Services-ID/Secret nötig.) Speichern.
> ⛔ Das ist ein **Blocker** — ohne diesen Schritt schlägt der Apple-Login im Review fehl.

## 3) Secrets setzen — Terminal im Projektordner
```bash
cd /Users/adamkahirov/Desktop/code/countrivo

# APNs (Push) — nutzt deinen vorhandenen APNs-Key J56G5XDVQT.
# Lege AuthKey_J56G5XDVQT.p8 in DIESEN Ordner (oder Pfad anpassen).
supabase secrets set \
  APNS_KEY_ID=J56G5XDVQT \
  APNS_TEAM_ID=88J7VD74DB \
  APNS_BUNDLE_ID=com.countrivo.app \
  APNS_ENV=production \
  APNS_PRIVATE_KEY="$(cat AuthKey_J56G5XDVQT.p8)"

# Cron-Secret (für den Abend-Push) — Wert merken, kommt gleich ins Cron-SQL.
supabase secrets set CRON_SECRET="$(openssl rand -hex 16)"

# Apple Token-Revoke (5.1.1(v)) — braucht einen SEPARATEN „Sign in with Apple"-Key.
# Der APNs-Key J56G5XDVQT funktioniert dafür NICHT.
# Lege zuerst im Apple-Portal ▸ Keys einen Key mit „Sign in with Apple" an, lade die .p8.
supabase secrets set \
  APPLE_TEAM_ID=88J7VD74DB \
  APPLE_KEY_ID=<NEUE_SIWA_KEY_ID> \
  APPLE_CLIENT_ID=com.countrivo.app \
  APPLE_PRIVATE_KEY="$(cat AuthKey_<NEUE_SIWA_KEY_ID>.p8)"
```
> Den `CRON_SECRET`-Wert siehst du nicht im Klartext zurück. Wenn du ihn fürs Cron-SQL brauchst, generier ihn einmal separat und nutz denselben Wert in beiden:
> `S=$(openssl rand -hex 16); echo "$S"; supabase secrets set CRON_SECRET="$S"` → den ausgegebenen Wert unten einsetzen.

## 4) Abend-Push planen (optional, Retention — nach Release ok)
Supabase ▸ Database ▸ Extensions: **pg_cron** + **pg_net** an. Dann SQL Editor (deinen CRON_SECRET einsetzen):
```sql
select cron.schedule('streak-reminder', '0 18 * * *', $$
  select net.http_post(
    url     => 'https://reqvdyfzwkrtlvgapnyq.supabase.co/functions/v1/streak-reminder',
    headers => jsonb_build_object('x-cron-secret', '<DEIN_CRON_SECRET>', 'Content-Type', 'application/json'),
    body    => '{}'::jsonb
  ) $$);
```
(`0 18 * * *` UTC = 19:00 Berlin im Winter / 20:00 im Sommer — abends, passt.)

## 5) URL-Konfiguration — Supabase ▸ Authentication ▸ URL Configuration
Redirect URLs ergänzen (falls noch nicht): `https://countrivo.com/auth/callback` und `com.countrivo.app://login-callback`.

---

### Was wovon ein Blocker ist
- **⛔ Pflicht für Review:** Schritt 1 (apple_credentials) + 2 (Apple-Provider) + der `APPLE_*`-Teil von 3 — sonst Apple-Login/Löschung-Revoke nicht testbar.
- **🟡 Optional (nach Release ok):** APNs-Push-Secrets + Cron (4) + Streak-Freeze-Spalten (Retention).
