# 🚀 Countrivo veröffentlichen — deine Klick-Anleitung

Alles Technische ist fertig und live. Folge diesem Dokument von oben nach unten. Jeder Wert zum **Kopieren** steht direkt hier. Volle Referenz mit Begründungen: `docs/APP-STORE-MASTER.md`.

Legende: **⛔ Pflicht** (sonst keine Freigabe) · 🟡 optional (App läuft auch ohne, Feature aktiviert sich später)

---

## ✅ Schon für dich erledigt
- Website **deployed** → `https://countrivo.com` ist auf dem neuen Stand (Design, Bugfixes, **3 neue Spiele**, Atlas entfernt).
- **App-Store-Screenshots** erzeugt in **1320×2868** (6,9″, PNG, kein Alpha) → Ordner `resources/store-screenshots-6.9/` (`01-home` … `06-games-hub`).
- `tsc` + Production-Build grün. Privacy-Seite nennt Vercel + Supabase. `PrivacyInfo.xcprivacy` liegt bereit unter `ios/App/App/`.

---

## 1) 🟡 Supabase (Retention-Features — KEIN Blocker für die Freigabe; kannst du auch nach dem Release machen)

> ⚠️ Hinweis: Deine Production-DB ist migrations-mäßig versetzt (mehrere lokale Migrationen sind remote nicht verzeichnet). **Führe NICHT `supabase db push` aus** — das könnte ältere Migrationen erneut anwenden. Nutze stattdessen die 2 sicheren Pastes unten (beide `IF NOT EXISTS`, keine Nebenwirkungen).

**1a — Streak-Freeze aktivieren** (eine verpasste Tageschance bricht den Streak nicht mehr). Supabase → SQL Editor → einfügen → Run:
```sql
alter table public.profiles
  add column if not exists streak_freezes smallint not null default 2,
  add column if not exists streak_frozen_dates date[] not null default '{}';
```

**1b — Apple-Token-Speicher** (für Account-Löschung/Token-Revoke, Guideline 5.1.1(v)):
```sql
create table if not exists public.apple_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.apple_credentials enable row level security;
```

**1c — Edge Functions deployen** (Terminal, im Projektordner):
```bash
supabase functions deploy apple-exchange
supabase functions deploy streak-reminder
supabase functions deploy delete-account
```

**1d — Push & Apple-Secrets setzen** (Werte aus Schritt 2 unten):
```bash
supabase secrets set APNS_KEY_ID=XXXXXXXXXX APNS_TEAM_ID=YYYYYYYYYY \
  APNS_BUNDLE_ID=com.countrivo.app APNS_ENV=production \
  APNS_PRIVATE_KEY="$(cat AuthKey_XXXXXXXXXX.p8)"

supabase secrets set CRON_SECRET="$(openssl rand -hex 16)"

# Nur falls du Token-Revoke voll willst (sonst greift der dokumentierte Fallback):
supabase secrets set APPLE_TEAM_ID=YYYYYYYYYY APPLE_KEY_ID=ZZZZZZZZZZ \
  APPLE_CLIENT_ID=com.countrivo.app APPLE_PRIVATE_KEY="$(cat AuthKey_ZZZZZZZZZZ.p8)"
```

**1e — Abend-Push planen** (Streak-Erinnerung 19–20 Uhr Berlin). Supabase → Database → Extensions: `pg_cron` + `pg_net` an. Dann SQL Editor (Projekt-Ref + dein CRON_SECRET einsetzen):
```sql
select cron.schedule('streak-reminder','0 18 * * *', $$
  select net.http_post(
    url => 'https://<DEINE-PROJECT-REF>.supabase.co/functions/v1/streak-reminder',
    headers => jsonb_build_object('x-cron-secret','<DEIN-CRON_SECRET>','Content-Type','application/json'),
    body => '{}'::jsonb) $$);
```

**1f — Apple-Login in Supabase** (für „Sign in with Apple"): Authentication → Providers → **Apple** aktivieren → unter *Authorized Client IDs* `com.countrivo.app` eintragen. Authentication → URL Configuration → Redirect URLs ergänzen: `https://countrivo.com/auth/callback` und `com.countrivo.app://login-callback`.

---

## 2) ⛔ Apple Developer Portal — App-ID + Keys
developer.apple.com → *Certificates, Identifiers & Profiles*:
1. **Identifiers → ➕ → App** → Bundle-ID **`com.countrivo.app`** (explicit). Capabilities ankreuzen: **Push Notifications** + **Sign In with Apple** → Continue → Register.
2. **Keys → ➕** → Name „Countrivo APNs" → **Apple Push Notifications service (APNs)** anhaken → Continue → Register → **`.p8` herunterladen** (geht nur EINMAL!). **Key ID** notieren (= `APNS_KEY_ID`).
3. **Team ID** notieren (Membership-Seite, 10 Zeichen) (= `APNS_TEAM_ID`).
4. 🟡 Für Token-Revoke: noch ein Key mit **Sign in with Apple** anlegen → `.p8` + Key ID notieren (= `APPLE_KEY_ID`).

---

## 3) ⛔ Xcode — bauen & hochladen
Terminal:
```bash
cd /Users/adamkahirov/Desktop/code/countrivo
npx cap sync ios
npx cap open ios
```
In Xcode:
1. Target **App** → **Signing & Capabilities**: **Team** wählen, **Automatically manage signing** an, Bundle = `com.countrivo.app`. **➕ Capability** → **Push Notifications** und **Sign in with Apple** hinzufügen.
2. **`PrivacyInfo.xcprivacy`** in den **App-Target** ziehen (Datei liegt unter `ios/App/App/PrivacyInfo.xcprivacy`; im Projekt-Navigator reinziehen, Häkchen bei Target „App"). → *Product ▸ Archive ▸ Privacy Report* prüfen.
3. Oben: Marketing Version **1.0**, Build **1**. Schema **App**, Ziel **„Any iOS Device (arm64)"**.
4. **Product → Archive**. Im Organizer: **Validate App** → dann **Distribute App → App Store Connect → Upload** (keine Export-Compliance-Frage — Info.plist ist gesetzt).

*(Detail-Spickzettel falls nötig: `docs/SHIP-CHECKLIST.md`.)*

---

## 4) ⛔ Screenshots hochladen
Schon fertig in **`resources/store-screenshots-6.9/`** (6 Stück, exakt 1320×2868). In App Store Connect beim 6,9″-iPhone-Slot hochladen — die 3 stärksten zuerst (Home, GeoWordle, Risk Zone). Du kannst sie später durch Simulator-Aufnahmen mit Geräterahmen ersetzen, diese sind aber einreichbar.

---

## 5) ⛔ App Store Connect — App anlegen & ausfüllen
appstoreconnect.apple.com → **Apps → ➕ → New App**: iOS, Name unten, Bundle `com.countrivo.app`, SKU `countrivo-ios-001`.

**App Information** (einfügen):
- **Name (max 30):** `Countrivo: Daily Geography`
- **Subtitle (max 30):** `Flags, capitals & countries`
- **Kategorie:** Primär **Games** (Sub: **Trivia**), Sekundär **Education**
- **Copyright:** `2026 Countrivo`
- **Privacy Policy URL:** `https://countrivo.com/privacy`

**1.0-Versionsseite:**
- **Promotional Text (max 170):**
  ```
  A fresh geography challenge every day across 17 games — Wordle-style GeoWordle, Cluster, streaks, and friend leaderboards. 100% free, no ads, no purchases.
  ```
- **Keywords (max 100, ohne Leerzeichen):**
  ```
  geography,quiz,trivia,world,map,atlas,nation,puzzle,brain,daily,learn,states,memory,streak
  ```
- **Support URL:** `https://countrivo.com/support`  ·  **Marketing URL:** `https://countrivo.com`
- **Description (einfügen):**
  ```
  One new geography challenge every day. Countrivo gives you a fresh daily puzzle across 17 games, then resets at midnight so everyone in the world plays the same board. Build a streak, climb the leaderboard, and find out how well you really know the planet.

  Pick a game and play in two minutes:

  - GeoWordle: guess the mystery country in six tries — each guess shows the distance and direction to the answer.
  - Cluster: sixteen countries, four hidden groups. Find the connection binding each quartet.
  - Risk Zone: guess higher or lower, then bank your points or gamble one more reveal. One wrong answer wipes the chain.
  - Flag Quiz: name the country from its flag, ten rounds, no second chances.
  - Capital Match: given a country, choose the correct capital.
  - Higher or Lower: two countries, one stat, keep your streak alive.
  - Country Draft: assign revealed countries to the category they rank highest in and beat the optimal score.
  - Plus Stat Guesser, Population Sort, Country Streak, Border Buddies, Continent Sprint, Speed Flags, Odd One Out, Supremacy, Borderline and Blitz.

  Why players keep coming back:

  - A shared daily challenge that resets at midnight, so it's the same puzzle for everyone.
  - Streaks that reward showing up every day.
  - Friends and leaderboards. Add friends, compare scores, and tap any player to replay their decisions.
  - Practice mode with unlimited rounds when you want to train.
  - 243 countries with real, up-to-date data: flags, capitals, populations, borders, and more.

  Built for people who love a quick daily brain workout and anyone curious about the world. Smart, fast, and genuinely free — no ads and no in-app purchases, ever.

  Sign in with Apple in one tap, get a gentle daily reminder so your streak never breaks, and enjoy a clean native experience.

  Today's puzzle is waiting. How far can your streak go?
  ```
- **What's New:** für 1.0 leer lassen.

**Age Rating** (Edit → Fragebogen so beantworten → Ergebnis muss **4+** sein):
- Unrestricted Web Access: **No** · User-Generated Content: **No** · Messaging/Chat: **No** · In-App Advertising: **No**
- Violence / Profanity / Horror / Sexual / Alcohol-Tobacco-Drugs / Gambling / Contests / Medical: **None / No**
- Made for Kids: **OFF**, kein Override.

**App Privacy** (Get Started → so deklarieren → **Publish**). Nichts als „Tracking" markieren:
| Datentyp | Collected | Linked | Tracking | Zweck |
|---|---|---|---|---|
| Contact Info → Email Address | Yes | Yes | No | App Functionality |
| Contact Info → Name | Yes | Yes | No | App Functionality |
| Identifiers → User ID | Yes | Yes | No | App Functionality |
| Identifiers → Device ID (APNs-Token) | Yes | Yes | No | App Functionality |
| Usage Data → Product Interaction | Yes | No | No | Analytics |
Alles andere: **Not Collected**.

**EU-DSA-Händlerstatus:** App Information (oder Business) → Trader/Non-Trader ehrlich deklarieren (sonst keine EU-Distribution).

**Pricing and Availability:** Free, alle Länder.

---

## 6) ⛔ App Review vorbereiten
1. **Demo-Account anlegen** auf countrivo.com: E-Mail `review@countrivo.com`, **neues Passwort** setzen (z. B. `Countrivo!Review2026` — NICHT das alte committete) → 2–3 Spiele spielen, 2 Freunde adden, ein paar Tage Streak.
2. Versionsseite → **App Review Information** → „Sign-in required" ankreuzen → Demo-Login eintragen.
3. **Review Notes** (einfügen):
   ```
   Countrivo is a free daily geography game. No ads, no in-app purchases, no subscriptions.

   NATIVE VALUE (Guideline 4.2): This is a Capacitor app rendering countrivo.com in a locked-down WKWebView (WKAppBoundDomains: only countrivo.com). It adds native capabilities mobile Safari cannot: native Sign in with Apple on the login sheet; APNs push for the daily streak reminder (permission requested after the first completed daily); Taptic Engine haptics; native splash + status-bar styling; a native offline screen (Airplane Mode shows a custom page, not a WebKit error).

   HOW TO TEST: log in with review@countrivo.com (password provided above), or just play the daily challenges with no login.

   ACCOUNT DELETION (5.1.1): Profile ▸ Edit profile ▸ Delete account ▸ confirm. Server-side cascade removes the account and all data.

   USER CONTENT / SAFETY (1.2): the only user content is a username + scores on leaderboards — no chat, no posts. Usernames are filtered for objectionable content. Users can remove friends. Report an offensive username by emailing countrivo@gmail.com (also shown at countrivo.com/support); we respond within ~24h.
   ```
4. **IDFA / Advertising Identifier:** No.

---

## 7) ⛔ Einreichen & freigeben
1. Versionsseite → **Build** → ➕ → den hochgeladenen Build (aus Schritt 3) wählen.
2. **Version Release:** „Manually release this version" → Save.
3. Oben rechts **„Add for Review" → „Submit for Review"**. Status geht auf *Waiting for Review* → *In Review* (~24–48 h).
4. Nach **Approved** (Pending Developer Release): Versionsseite öffnen → **„Release This Version"**. Innerhalb ~24 h live. 🎉

---

### Kürzeste Reihenfolge
**2 (Apple-Keys) → 3 (Xcode build+upload) → 4 (Screenshots) → 5 (ASC ausfüllen) → 6 (Review-Infos) → 7 (Submit).**
Schritt **1 (Supabase)** ist optional und aktiviert nur Streak-Freeze + Abend-Push + vollen Token-Revoke — dafür ist keine Eile, das geht auch nach dem Release.
