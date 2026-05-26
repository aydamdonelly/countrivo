# 03 · Lina Hadid · Forensicist · Auth & Multiplayer State Report

> Ich habe drei Tage lang nichts angefasst, nur gelesen. Code spricht, wenn man wartet. Hier ist, was er gesagt hat.

---

## Auth-Architektur Status Quo

Der Stack ist konventionell, lesbar, schmal. Es gibt keinen Eigenbau in der Auth-Schicht — der Schmerz dafür hat eine Geschichte, die ich nicht in diesen Code geschrieben habe, aber dessen Disziplin ich darin wiedererkenne.

**Provider:** Supabase Auth (`@supabase/ssr ^0.10.0`, `@supabase/supabase-js ^2.101.1`), Postgres 17.6 in `eu-central-1`. Projekt `reqvdyfzwkrtlvgapnyq` (`countrivo`).

**Client-Trennung:**
- `src/lib/supabase/server.ts` — `createServerClient` über `next/headers`-Cookies. Wird in Server Components und Server Actions verwendet.
- `src/lib/supabase/client.ts` — `createBrowserClient`, nutzt nur `NEXT_PUBLIC_*` ENV. Wird in `"use client"`-Komponenten verwendet.
- `src/lib/supabase/middleware.ts` — Edge-Session-Refresh: `await supabase.auth.getUser()` läuft bei jedem Request, der nicht durch den Matcher in `src/middleware.ts` ausgeschlossen wird (statische Assets, Bildoptimierung, Favicon, `flags/`).

**Session-Handling:** Supabase-Cookies (HTTP-only via `@supabase/ssr`). Refresh passiert in Middleware. Es gibt keinen eigenen Session-Store, keine eigenen JWTs, keine eigene Cookie-Kryptografie. Das ist gut. Das ist sehr gut.

**Sign-In-Methoden:**
- Magic Link (E-Mail-OTP via `signInWithOtp`) — siehe `src/components/auth/auth-modal.tsx:72-78`.
- OAuth Google (`provider: "google"`) — `src/components/auth/auth-modal.tsx:90-104`.
- OAuth Apple (`provider: "apple"`) — gleicher Handler, gleiche Datei.

**OAuth-Callback:** `src/app/auth/callback/route.ts`. Liest `?code=`, validiert `?next=` als relativen Pfad (Schutz gegen Open-Redirect via `startsWith("/") && !startsWith("//")` — sauber gelöst, Zeile 10), tauscht den Code via `exchangeCodeForSession`. Fehler → Redirect auf `/`. Kurz. Kein Logging, kein Telemetrie-Hook.

**Client-Auth-Provider:** `src/components/auth/auth-provider.tsx`.
- Context-Pattern (`user`, `profile`, `loading`, modal-state, `signOut`).
- `getUser()` initial mit 3-Sekunden-Timeout-Fallback (Zeile 74) — Pragmatik nach einem Bug mit hängender Auth-Resolution (siehe Commit `0885993`).
- `onAuthStateChange` triggert `fetchProfile()` und Callback-Resolution für gated Actions.
- `signOut()` löscht lokalen State explizit nach `supabase.auth.signOut()` — wichtig, weil sonst stale UI bis zur nächsten Auth-Event-Emission bleibt.

**Profile-Provisionierung:** Trigger `public.handle_new_user()` in der DB. Ich habe den Body nicht geprüft, aber Existenz und Konvention sind klar — automatisches Profil-Insert bei Auth-User-Erstellung.

---

## Server-Action Auth-Gating

Audit über alle vier Server-Action-Dateien. `getUser()` bedeutet `supabase.auth.getUser()` aus dem SSR-Client (cookie-basiert, sicher).

| Server Action | `getUser()`-Check? | Mutation? | Verdict |
|---|---|---|---|
| `game-runs.ts :: submitGameRun` | Ja (Z.29) | INSERT `game_runs`, UPSERT `daily_puzzles`, UPDATE `profiles` (streak) | OK |
| `game-runs.ts :: checkDailyStatus` | Ja (Z.194) | Read-only | OK |
| `game-runs.ts :: getDailyLeaderboard` | Nein | Read-only (RPC) | OK — anonymer Lesezugriff bewusst |
| `game-runs.ts :: getDailySummary` | Nein | Read-only (RPC) | OK |
| `game-runs.ts :: getUserGameStats` | Ja (Z.277) | Read-only | OK |
| `game-runs.ts :: getUserTodayRuns` | Nein, nimmt `userId` als Parameter | Read-only | **Schwach** — siehe Sicherheits-Hinweise |
| `friends.ts :: searchUsers` | Ja (Z.32) | Read-only | OK |
| `friends.ts :: sendFriendRequest` | Ja (Z.66) | INSERT `friendships` | OK |
| `friends.ts :: respondToFriendRequest` | Ja (Z.81) | UPDATE/DELETE `friendships` mit `.eq("addressee_id", user.id)` | OK |
| `friends.ts :: removeFriend` | Ja (Z.106) | DELETE `friendships` mit `.or(requester_id=user.id,addressee_id=user.id)` | OK |
| `friends.ts :: getFriends` | Ja (Z.123) | Read-only | OK |
| `friends.ts :: getPendingRequests` | Ja (Z.182) | Read-only | OK |
| `friends.ts :: getFriendsLeaderboard` | Ja (Z.215) | Read-only | OK |
| `challenges.ts :: createChallenge` | Ja (Z.31) | INSERT `friend_challenges` | OK |
| `challenges.ts :: getPendingChallenges` | Ja (Z.55) | Read-only | OK |
| `challenges.ts :: getMyOutgoingChallenges` | Ja (Z.83) | Read-only | OK |
| `challenges.ts :: completeChallenge` | Ja (Z.113) | UPDATE `friend_challenges` mit `.eq("challenged_id", user.id)` | OK |
| `challenges.ts :: getRecentChallengeResults` | Ja (Z.152) | Read-only | OK |
| `profile.ts :: updateProfile` | Ja (Z.22) | UPDATE `profiles` mit `.eq("id", user.id)` | OK |
| `profile.ts :: updateUsername` | Ja (Z.54) | UPDATE `profiles` mit `.eq("id", user.id)` | OK |
| `profile.ts :: getPublicProfile` | Nein | Read-only by username | OK — bewusst public |
| `profile.ts :: getPendingRequestCount` | Ja (Z.135) | Read-only | OK |
| `profile.ts :: getProfileTodayRuns` | Nein, nimmt `userId` als Parameter | Read-only | **Schwach** — siehe Sicherheits-Hinweise |
| `profile.ts :: getHeadToHead` | Nein, nimmt zwei `userId` als Parameter | Read-only | **Schwach** — siehe Sicherheits-Hinweise |

**Verdict gesamt:** Alle Schreib-Pfade sind auth-gated und alle Mutationen tragen einen `.eq("...id", user.id)`-Filter oder einen `.or(...)`-Filter, der ownership prüft. Es gibt keinen blinden Update-by-id ohne Owner-Check.

Die drei "Schwach"-Einträge sind keine Bypass-Lücken: die Funktionen sind read-only und RLS auf `game_runs` schützt die meisten Felder serverseitig. Aber sie verlassen sich auf RLS statt auf explizite Auth-Checks im Server-Action-Layer — was ein Bruch der Konvention der anderen Actions ist und ein subtiler Vektor für Information Leakage über vorhersagbare User-IDs sein kann. Eine Owner-Bestätigung im Code würde die Disziplin sichern, auch wenn RLS heute hält. Defense in depth.

---

## RLS-Policies & DB-Schema

Live-Audit der Policies in `reqvdyfzwkrtlvgapnyq.public`. Tabellen mit `rls_enabled = true`:

```
daily_puzzles      | RLS on  | Insert: PUBLIC check true       | Read: PUBLIC true
friend_challenges  | RLS on  | Insert: auth.uid = challenger    | Read/Write: auth.uid in {challenger,challenged}
friendships        | RLS on  | Insert: auth.uid = requester ∧ status='pending'
                              | Read/Write/Delete: auth.uid in {requester,addressee}
game_results       | RLS on  | Insert: true (PUBLIC)            | Read: true (PUBLIC)     ← see below
game_rooms         | RLS on  | Insert/Update/Read: true (PUBLIC)                          ← see below
game_runs          | RLS on  | Insert: auth.uid = user_id
                              | Read: mode='daily' OR auth.uid = user_id
profiles           | RLS on  | Read: true (PUBLIC)              | Write: auth.uid = id
sessions           | RLS on  | Insert: true (PUBLIC)            | Read: true (PUBLIC)     ← see below
user_game_stats    | RLS on  | Read: true (PUBLIC)              | Write/Insert: auth.uid = user_id
daily_puzzles      | Insert: true (PUBLIC)                                                 ← see below
```

**Befunde:**

1. **`daily_puzzles` Insert PUBLIC true.** Jeder Anon-Client kann beliebige `(game_slug, daily_date, seed)`-Tupel einfügen. Heute via UPSERT mit ON CONFLICT — also nicht überschreibbar, wenn der Eintrag existiert. **Aber:** Vor dem ersten Run eines Tages kann ein Angreifer einen falschen `seed` setzen und damit den ganzen Tag versauen. Der Race lebt von "wer kommt zuerst". Empfehlung: Insert auf authentifizierte Rolle beschränken oder via SECURITY DEFINER RPC kanalisieren.

2. **`game_rooms` komplett PUBLIC (Insert/Update/Read).** Erwartet, weil Räume von anonymen Clients erstellt werden. Aber: Update PUBLIC heißt, jeder kann jeden Raum-Zustand manipulieren. In `rooms.ts:44-51` macht der Join-Pfad das gewollt — Update `player_count` von 1 auf 2, gated nur durch `eq("status", "waiting") AND eq("player_count", 1)`. Funktional ist das atomar. Sicherheitspolitisch ist es: ein Tabu, das durch Multiplayer-Removal verschwindet.

3. **`game_results` PUBLIC Insert/Read.** Tabelle hat 0 Zeilen, wird nirgendwo im Code referenziert. **Toter Code, Vor-Refactor-Relikt** — sollte gedropped werden. Solange sie existiert, ist sie eine offene Tür ohne Schloss.

4. **`sessions` PUBLIC Insert/Read.** Ähnlich: 0 Zeilen, 0 Codereferenzen. Anonymes-Session-Tracking war geplant, wurde nicht implementiert. **Drop.**

5. **`game_runs` Read-Policy:** `mode = 'daily' OR auth.uid = user_id`. Das ist die Logik, die Leaderboards anonym lesbar macht. Solide. Wichtig zu wissen für Phase D — wenn Multiplayer raus geht, geht der `versus`-Mode in `mode`-Spalte weg, aber die Daily/Practice-Pfade bleiben unverändert.

6. **`profiles` Read PUBLIC, Write owner.** Bewusst, weil Friend-Search/Public-Profile public sind. Im Code wird Schreib-Owner-Check redundant gemacht in Server-Actions — das ist die richtige Doppellinie.

**RPC-Functions (alle `SECURITY ?` nicht geprüft im Detail, sollte verifiziert werden):**
- `compute_daily_rankings(text, date)` — wird nach `submitGameRun` aufgerufen.
- `get_daily_leaderboard(text, date, int)`, `get_daily_summary(text, date)` — Read-Aggregates.
- `recompute_user_game_stats(uuid, text)`, `update_user_game_stats()` — Trigger-Funktion.
- `handle_new_user()` — Profil-Insert bei Auth-Registrierung.

Wichtig: `compute_daily_rankings` wird vom Server aus aufgerufen. Wenn das eine SECURITY INVOKER Funktion ist, kann ein Anon-Client sie nicht aufrufen (kein `auth.uid()`-Kontext für protected Operations). Wenn SECURITY DEFINER, ist sie potentiell von jedem aufrufbar, der die Args kennt. **Nachprüfen.**

---

## Multiplayer-Kopplung

Multiplayer durchzieht den Code dichter als auf den ersten Blick sichtbar. Hier alles, was bricht, wenn `versus` entfernt wird:

### Dateien, die KOMPLETT GELÖSCHT werden können

```
src/lib/supabase/rooms.ts                                    (72 Zeilen)
src/hooks/use-multiplayer.ts                                 (133 Zeilen)
src/app/vs/[code]/page.tsx                                   (194 Zeilen)
src/app/vs/                                                  (Verzeichnis)
src/components/games/blitz/create-game-button.tsx            (36 Zeilen)
src/components/games/borderline/create-game-button.tsx       (36 Zeilen)
src/components/games/supremacy/create-game-button.tsx        (36 Zeilen)
```

### DB-Schema-Änderungen

```
DROP TABLE public.game_rooms;          -- 2 Zeilen aktuell, expires in 30min
DROP TABLE public.game_results;        -- ungenutzt, weg
DROP TABLE public.sessions;            -- ungenutzt, weg
```

`game_results` und `sessions` sind ungenutzte Altlasten — Multiplayer-Removal ist der richtige Anlass für ein Aufräumen. Vor dem Drop: prüfen, ob irgendein Edge-Function oder externer Consumer sie liest. Im Repo nicht — aber Supabase erlaubt externe SQL-Clients.

### Dateien, die TEILWEISE bereinigt werden müssen

**`src/data/game-registry.json`** — drei Einträge mit `"availableModes": ["practice", "versus"]`:
- `supremacy` (Z.167) → `["practice"]` oder `["daily", "practice"]` (wenn Daily existiert; aktuell nur über `getDailyRng(dailyKey)` in Board verfügbar, aber nicht im Registry)
- `borderline` (Z.181) → analog
- `blitz` (Z.195) → analog

**`src/lib/game-logic/blitz/engine.ts`** — `opponentScore: number` (Z.21,83,213), `export function opponentScored(state)` (Z.190-215). Komplett entfernen, plus `opponentScore` aus `BlitzState`-Typ.

**`src/lib/game-logic/supremacy/engine.ts`** — Tiefer gekoppelt. Der gesamte Game-Loop ist als 2-Spieler-Turn-Alternation aufgebaut (`isMyTurn`, `opponentHand`, `opponentHandSize`, `opponentCard`, `opponentScore`, `revealCards`-Funktion mit explizitem opponentCard-Argument). Wenn man Multiplayer entfernt, bleibt der lokale Practice-Modus mit AI — der bleibt erhalten via `aiPickStat()`. Aber der Game-State-Shape ist von versus geprägt. **Empfehlung:** Multiplayer-Bezeichner umbenennen oder Engine als Practice-vs-AI neu denken. "AI" statt "Opponent" semantisch durchziehen.

**`src/lib/game-logic/borderline/engine.ts`** — Im Engine-File selbst keine versus-Kopplung. Versus-Logik ist im Board (`opponentSteps`, `opponentFinished`).

**`src/app/actions/game-runs.ts`** — `mode: "daily" | "practice" | "versus"` (Z.11). Den `"versus"`-Modus aus dem Type entfernen. Außerdem Zeile 474 Kommentar `// Multiplayer games (blitz, borderline, supremacy) — not yet validated`. Das ist eine **kritische Lücke** (siehe Sicherheits-Hinweise). Mit der Removal verschwindet sie automatisch — oder es muss Validierung für die drei Spiele als Practice/Daily nachgeschoben werden.

**`src/app/games/blitz/play/page.tsx`, `src/app/games/borderline/play/page.tsx`, `src/app/games/supremacy/play/page.tsx`** — Alle drei haben:
```ts
const mode = rawMode === "versus" ? "versus" : "practice";
const roomCode = params.get("room") ?? null;
```
Vereinfachen zu `mode = "practice"`, `roomCode` Prop weg.

**`src/app/games/blitz/page.tsx`, `src/app/games/borderline/page.tsx`, `src/app/games/supremacy/page.tsx`** — Landing-Pages mit `<CreateGameButton />` und `playMode="MultiPlayer"` im JSON-LD. CreateGameButton-Imports entfernen, JSON-LD auf `"SinglePlayer"`.

**`src/components/games/blitz/blitz-board.tsx`** — Props: `mode: "practice" | "versus"`, `roomCode?: string | null`. Plus `isVersus`-Branching durch die ganze Datei. Plus `useMultiplayer`-Hook-Aufruf (Z.91-93). Plus Reducer-Action `OPPONENT_SCORED`. Plus opponent-spezifische UI-Branches in `results`-Screen, Round-Counter, Header.

**`src/components/games/borderline/borderline-board.tsx`** — Analog: `roomCode`-Prop, `isVersus`, `useMultiplayer`, `opponentSteps`/`opponentFinished` state, versus-spezifische Result-Subtitle, Waiting-For-Opponent-Screen.

**`src/components/games/supremacy/supremacy-board.tsx`** — Tiefste Kopplung. Versus-Path und Practice-AI-Path teilen sich denselben Reducer und State-Shape, was den Board lesbar macht aber die Trennung schwierig. Der "AI thinking…"-Branch (Z.413) und der "Opponent is picking…"-Branch sind heute textlich getrennt, mechanisch identisch. Nach Removal: nur AI bleibt.

### Server-Action-Cleanup

- `submitGameRun` akzeptiert `mode: "daily" | "practice" | "versus"` — `"versus"` aus dem Union entfernen.
- `score_sort_value`-Override-Switch in `submitGameRun` enthält `blitz`, `borderline`, `supremacy` — die bleiben drin, weil Practice-Mode auch über die Action geht, aber die Validierungs-Lücke (`// not yet validated`) muss entweder geschlossen oder die drei Spiele kommen ohne Server-Submit aus (Practice-only ohne Leaderboard).

### Friend-Challenges nach Multiplayer-Removal

**Frage, die niemand mir gestellt hat aber gestellt werden muss:** Bleiben Friend-Challenges?

Friend-Challenges (`friend_challenges`-Tabelle) sind **asynchron**, nicht realtime. Sie nutzen `game_runs` als Score-Quelle und vergleichen Sortwerte. Sie sind **vollständig entkoppelt** von der Multiplayer-Realtime-Infrastruktur. Sie funktionieren mit Daily-Mode der jeweiligen Spiele (`daily_date` in der Tabelle).

Wenn die Migration "Multiplayer komplett entfernen" wörtlich heißt **Realtime-Versus weg, Async-Challenges bleiben** — dann ist die Bereinigungsarbeit oben vollständig. Wenn "Multiplayer" auch Friend-Challenges meint, dann zusätzlich:
- `DROP TABLE friend_challenges`
- `src/app/actions/challenges.ts` löschen
- `src/components/friends/challenge-friend-picker.tsx` löschen
- `friends-client.tsx`: `pendingChallenges`-Sektion (Z.142-173) entfernen
- `friends/page.tsx`: `getPendingChallenges()` weg

**Empfehlung:** Friend-Challenges behalten. Sie sind das, was Realtime-Versus eigentlich liefern wollte (sozialer Druck, head-to-head), ohne den Realtime-Komplexitätsstack. Sie sind das überlegene Konstrukt für ein Daily-Geography-Spiel.

---

## Auth-Friction

Wo verliert die aktuelle Flow User. Mit Ehrlichkeit:

**1. Magic-Link-Latenz.** Der User klickt "Send magic link", sieht "Check your email", wechselt zu seinem Mail-Tab. Wenn die Mail nicht in 5 Sekunden da ist, ist er verloren. Geographie-Spiele sind ein Impuls. Impulse haben kein Inbox-Polling.

**2. OAuth-Redirect-Pingpong.** "Continue with Google" → Google-Consent-Screen → Redirect zu `/auth/callback?code=...&next=...` → Server-Side `exchangeCodeForSession` → Redirect zu `next`. Das sind drei Navigationen. Auf Mobile mit langsamem Netz fühlt sich das nach Bug an.

**3. Apple-OAuth ist konfiguriert, aber Apple verlangt $99/Jahr Developer Membership und ein durch Apple verifiziertes Service-ID-Setup mit RSA-Key-Rotation.** Wenn das nicht eingerichtet ist, klickt der User darauf und landet in einem Apple-Fehler-Screen. Ich habe nicht geprüft, ob Apple Sign-In im Supabase-Dashboard tatsächlich aktiv ist — das gehört zur Pre-Migration-Liste.

**4. Modal-Dismissal mit "Continue as guest".** Der User kann das Modal mit Backdrop-Click oder dem Button schließen. Das ist gut. Aber dann ist seine Score nicht persistiert. Das Conversion-Loop "spiel ohne Login → ach mist, mein Score ist weg" funktioniert nur, wenn die "ach mist"-Reaktion stark genug ist. Bei einem Casual-Daily-Game ist sie das oft nicht.

**5. Profile-Username-Provisionierung.** Auf `profiles` ist `username` NOT NULL. Der `handle_new_user`-Trigger muss einen Username generieren. Wenn der einen Konflikt mit `(username)` UNIQUE produziert, hängt der Auth-Flow. Ich habe den Trigger-Body nicht geprüft — das ist eine offene Frage. Wenn der Username aus dem OAuth-`raw_user_meta_data` kommt (z.B. Google "name"-Feld), kann ein User mit identischem Google-Display-Name wie ein bereits registrierter User in einen Insert-Conflict laufen.

**6. Sign-In-Modal-Trigger.** Aktuell wird das Modal nur via Header-"Sign in"-Button oder via `openAuthModal(onSuccess)`-Callback geöffnet. Es gibt **keine** post-game Sign-In-Aufforderung im Lockout-Guard (`DailyLockoutGuard` Z.71: nur ein passiver Hint-Text). Der höchste-Intent-Moment — "ich habe gerade einen 6/6-Score gemacht, ich will den teilen" — ist nicht aggressiv genug für Conversion gestaltet.

**7. Mobile-Tastatur und Magic-Link-Eingabe.** Im Modal: `type="email"`, `autoComplete="email"`. Beide korrekt. Aber das Modal blockiert die untere Hälfte des Viewports bei iOS Safari, wenn die Tastatur erscheint und der Submit-Button verdeckt wird. Nicht überprüft, aber sehr wahrscheinlich.

**Migration zu Email/Password:** Eliminiert (1) und (2). Bringt neue Friction:
- Passwort-Wahl-Dialog (Mindestlänge, Komplexitätsregeln) — Supabase Auth hat das.
- Forgot-Password-Flow — muss komplett neu gebaut werden (Reset-E-Mail, Reset-Token-Route, neue Passwort-Set-Route).
- E-Mail-Verifikation — Supabase kann das via "confirm email" toggeln; wenn ON, Friction; wenn OFF, Spam-Accounts möglich.
- Password-Manager-Integration — `autocomplete="new-password"` vs `"current-password"` muss korrekt sein, sonst keine 1Password/Bitwarden-Vorschläge.

---

## Sicherheits-Hinweise

Alphabetisch nach Schweregrad. Was Aufmerksamkeit braucht, unabhängig von der Migration.

### Hoch

**H1. `daily_puzzles` Insert PUBLIC.** Beschrieben oben. Race-Condition zwischen Anon-Angreifer und legitimem First-Player kann den Daily-Seed eines Tages verfälschen. **Fix:** RLS-Policy `Insert puzzles` → `auth.uid() IS NOT NULL` mindestens, besser: SECURITY DEFINER RPC `ensure_daily_puzzle(game_slug, date)`.

**H2. Validierungs-Lücke in `submitGameRun` für blitz/borderline/supremacy.** `validateGameResult` Z.474: `// Multiplayer games (blitz, borderline, supremacy) — not yet validated`. Das heißt: ein authentifizierter Client kann beliebige `result_json` und beliebige `score_raw`-Werte für diese drei Spiele submitten. Der serverseitige `score_sort_value`-Override hilft beim Ranking, aber `score_raw` selbst wird auf Leaderboards angezeigt. **Fix:** Per-Game-Validierungs-Branches schreiben, oder — wenn diese Spiele Practice-only werden — keinen Server-Submit für sie zulassen.

**H3. `searchUsers` ILIKE-Pattern.** `friends.ts:54`: `or(\`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%\`)`. Die Sanitization (Z.35) escaped `%`, `_`, `\`. Das schützt vor Wildcard-Injection, aber nicht vor PostgREST-OR-Filter-Injection: wenn `sanitized` ein Komma oder Klammer enthält, kann es die `.or()`-Struktur brechen. PostgREST-Filter-Syntax: `,` trennt Felder, `(` öffnet Sub-Conditions. **Test:** `query = "foo,id.eq.uuid"` — was passiert? Ich habe das nicht ausgeführt. Empfehlung: zusätzlich Komma und Klammer entfernen, oder PostgREST Sicherheitspraktiken zu OR-Filtern nachschlagen.

### Mittel

**M1. Server-Actions ohne `getUser()` (`getUserTodayRuns`, `getProfileTodayRuns`, `getHeadToHead`).** Read-only, durch RLS abgesichert, aber inkonsistent zur Konvention. Defense in depth: expliziter Auth-Check.

**M2. Game-Rooms Update-RLS PUBLIC true.** Im Multiplayer-Migrations-Kontext irrelevant — die Tabelle wird gedroppt. Notiert für den Übergang: solange die Tabelle existiert, ist eine Race-Condition möglich, in der ein Angreifer einen Raum von `waiting` auf `playing` setzt, bevor der eigentliche zweite Spieler joinen kann (DoS).

**M3. Magic-Link `emailRedirectTo` ohne `next`-Parameter.** `auth-modal.tsx:75`: `emailRedirectTo: \`${window.location.origin}/auth/callback\``. Im Gegensatz zu OAuth wird hier kein `?next=...` mitgegeben. Resultat: nach Magic-Link-Klick landet der User auf `/`, nicht dort wo er war. UX-Verlust. Auf vielen Sites ist das eine Conversion-Killer-Friction.

**M4. `getStorageItem` für Daily-Lockout in `DailyLockoutGuard`.** Lockout funktioniert auch ohne Auth via localStorage. Das ist gut für Performance, aber: ein User kann localStorage löschen und das Daily neu spielen. Server-Side `checkDailyStatus` ist die echte Wahrheit, aber sie läuft nur im zweiten useEffect, nachdem Locked schon gerendert wurde. **Das ist by design** — siehe Commit `29d74b2`. Notiert: das ist ein bewusster Trade-off zwischen Latenz und Honor-System-Strenge.

**M5. `respondToFriendRequest(accept=false)` löscht die Row.** `friends.ts:90`: DELETE statt Status='rejected'. Das verliert Audit-Information. Wenn ein User wiederholt Spam-Anfragen schickt und das Opfer wiederholt deklinet, gibt es keine Spur. **Fix:** Soft-Delete oder Status-Update.

### Niedrig

**L1. `vs/[code]/page.tsx` zeigt "Opponent" generisch, kein Auth.** Wenn das `vs/`-Verzeichnis entfernt wird, irrelevant. Solange es existiert: jeder anonyme User kann jeden Raum betreten, weil RLS auf `game_rooms` PUBLIC ist.

**L2. Auth-Provider 3-Sekunden-Timeout.** Akzeptabel als Fallback, aber wenn der Auth-Server tatsächlich langsam ist, sieht der User für 3s den Logged-Out-State und dann plötzlich seinen Avatar. UI-Flackern.

---

## Migration-Risiken

### Multiplayer raus — was bricht

**Build/Type:**
- `mode: "daily" | "practice" | "versus"` → `"daily" | "practice"`. Alle Konsumenten dieses Typs müssen mit-migrieren. Compiler hilft.
- `BlitzState.opponentScore`, `SupremacyState.opponentScore`/`opponentHand`/`opponentHandSize`/`opponentCard`/`isMyTurn` → entfernen oder semantisch zu "AI" umbenennen.

**Routes:**
- `/vs/[code]` wird 404. Keine Inbound-Links im Repo. Externe Links aus alten Friend-Invitations möglich — soft handling: `vs/` umleiten auf `/games`.

**Realtime:**
- Supabase Realtime Channels werden nicht mehr abonniert. Kein Cleanup nötig.
- `presence`-Tracking im `use-multiplayer.ts` weg.

**Datenbank:**
- `game_rooms`-Drop ist destruktiv. 2 Zeilen aktuell (innerhalb der 30min-TTL). Verlust akzeptabel.
- `game_runs.mode = 'versus'` historisch existiert? **Prüfen:** `SELECT COUNT(*) FROM game_runs WHERE mode='versus'`. Wenn ja, entscheiden: Drop oder als Practice umlabeln.
- `friend_challenges`-Tabelle bleibt, wenn Friend-Challenges überleben.

**Cleanups, die "frei" mitkommen:**
- `game_results` und `sessions` Drop (ungenutzt).
- `score_sort_value`-Switch in `submitGameRun` für `blitz`/`borderline`/`supremacy` — bleibt drin, weil Practice-Mode existiert.

### Email/Password rein — was muss neu

**Supabase Dashboard:**
- Email-Auth-Provider aktivieren (vermutlich bereits aktiv, weil Magic-Link existiert — Magic-Link ist Email-Auth ohne Password).
- "Confirm email" Setting: ON für Sicherheit, OFF für Friction-Reduktion. Empfehlung: **ON**, weil sonst gestohlene E-Mails Account-Squatting ermöglichen.
- Password-Policy: min-length, complexity. Supabase erlaubt Konfiguration.

**Auth-Modal-UI:**
- Password-Feld zusätzlich zum Email-Feld.
- Sign-Up vs Sign-In Tab oder Toggle.
- "Forgot password?" Link.
- "Show password" Toggle (Accessibility).
- Submit-Handler: `supabase.auth.signInWithPassword({email, password})` und `supabase.auth.signUp({email, password})`.

**Neue Routes:**
- `/auth/reset-password` — Token-Eingabe oder direkt aus Email-Link.
- `/auth/forgot-password` — Email-Eingabe, sendet Reset-Mail.

**Neue Server-Actions / Client-Logik:**
- `supabase.auth.resetPasswordForEmail(email, { redirectTo })` für Forgot-Flow.
- `supabase.auth.updateUser({ password })` nach Token-Exchange.

**OAuth-Buttons:**
- Vom Brief: "Migration weg von Google OAuth zu einfacherem Email/Password". Wörtlich heißt das Google OAuth weg. Empfehlung: **OAuth-Buttons komplett entfernen** oder als sekundäre Option behalten. Das ist eine Produkt-Entscheidung — frag den Brief-Ersteller. Wenn Apple OAuth ohnehin nie funktioniert hat (siehe Friction-Punkt 3), gut weg.

**Magic-Link:**
- Wenn Email/Password kommt: bleibt Magic-Link parallel? Beides anbieten verwirrt. Empfehlung: **Magic-Link raus**, Email/Password einzige Methode. Konsistenz.

**Profile-Provisionierung:**
- `handle_new_user`-Trigger muss bei Email/Password-Signup einen Default-Username erzeugen können. Bei Magic-Link/OAuth gibt es kein `raw_user_meta_data` Display-Name aus dem Provider. Username-Generierung muss aus der Email abgeleitet werden (z.B. local-part vor `@`, plus Discriminator bei Kollision). Den Trigger muss ich lesen — ich habe ihn nicht.

### Risiken, die nicht in der Liste oben stehen

**R1. Bestehende Magic-Link-User können nicht einloggen.** Wenn die Migration Magic-Link entfernt und User vorher nur via Magic-Link Accounts haben, brauchen sie alle einen Password-Set-Flow. Supabase-Lösung: Erst-Login via Magic-Link funktioniert weiter, Setting "Password Required" gibt User Zeit zum Setzen. **Realistisch:** kommunizieren via E-Mail an alle bestehenden User mit Setup-Link.

**R2. OAuth-User haben kein Password.** Wenn Google/Apple-Sign-In erhalten bleibt parallel zu Email/Password, müssen OAuth-User auf `/profile` ein Password setzen können, falls sie wollen. Wenn OAuth entfernt wird, müssen sie ihre Email vom OAuth-Konto extrahieren und Password setzen — oder ihren Account verlieren. Migrations-Skript denkbar: `auth.users` lesen, Password-Reset-Mail an alle senden.

**R3. Friend-Invitations via `/friends/add/[username]` Link verlieren Auth-Kontext.** Wenn ein Anonym-User auf so einen Link klickt, sieht er einen "Sign in to add" Hinweis und einen Link auf `/friends` — aber `/friends` redirected zu `/` wenn nicht eingeloggt. Der Add-Flow geht verloren. **Fix:** Nach Sign-In zurück zu `/friends/add/[username]` redirecten. Aktuell macht der OAuth-Callback das via `?next=`, aber der "Sign In" Button auf `/friends/add/[username]` öffnet das Modal ohne `onSuccess`-Callback.

**R4. Session-Refresh in Middleware läuft auf jedem Request.** `await supabase.auth.getUser()` ist ein blockierender Edge-Call. Bei viel Traffic wird das Supabase-Auth-Limit erreichbar. Heute kein Problem (10 Profile, 225 Runs). Mit Wachstum prüfen.

---

## Schluss

Drei Dinge halten mich wach.

Erstens: die `daily_puzzles`-Policy. Eine offene Insert-Policy auf einer Tabelle, die alle anderen Tage definiert. Vielleicht ist der Race nie passiert. Vielleicht passiert er nie. Aber "vielleicht" ist nicht ausreichend. Es muss heute Abend geschlossen werden.

Zweitens: die Kommentar-Zeile in `game-runs.ts:474`. _"Multiplayer games — not yet validated."_ Drei Spiele, deren Scores ungesäubert in eine Datenbank fließen, die andere Spieler sehen. Solche Kommentare sind versteckte Türen. Manchmal gehen Jahre vorbei, bevor sie eine Bedeutung bekommen.

Drittens: ich habe den `handle_new_user`-Trigger nicht gelesen. Das ist der Punkt, an dem jeder neue User existiert oder nicht existiert. Wenn die Migration zu Email/Password kommt, läuft jeder neue Account dort durch. Bevor irgendetwas live geht, lese ich diesen Trigger. Niemand anderes wird ihn lesen. Niemand anderes liest Trigger.

Der Rest ist sauber. Server-Actions sind diszipliniert auth-gated. RLS doppelt absichert. Der OAuth-Callback validiert Redirects. Das Sign-Out löscht expliziten State. Jemand hat hier mit Vorsicht gearbeitet.

Was die Migration angeht: Multiplayer entfernen ist mechanisch. Email/Password einführen ist Produkt-Arbeit, kein Sicherheitsproblem — wenn Supabase die Policies setzt und der Trigger sauber ist. Aber davor müssen die drei Dinge oben weg.

Ich werde nicht wieder sechs Wochen lesen können, bevor jemand verhaftet wird.

— L.
