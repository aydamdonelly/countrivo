# 🚀 Countrivo — was JETZT noch fehlt (höchstes Detail)

Erstellt aus 3 Schritten: **(1)** echter Repo-/ASC-Stand direkt geprüft, **(2)** Recherche-Workflow zum aktuellen 2026-Prozess, **(3)** Synthese gemappt auf genau deinen Stand.
Legende: **⛔ Blocker** (Submit/Review scheitert sonst) · 🔎 verifizieren · 🟡 optional.

> **Die 4 Dinge, die dein alter Guide unterschätzt hat:**
> 1. **Supabase „Sign in with Apple"-Provider ist KEIN optionaler Punkt, sondern ⛔ Blocker** — ohne ihn schlägt der Apple-Login beim Review fehl (Ablehnung 2.1).
> 2. Für Token-Revoke brauchst du einen **separaten „Sign in with Apple"-Key** — dein APNs-Key **J56G5XDVQT kann das NICHT signieren**.
> 3. **Primary Language auf English (U.S.) stellen** — du warst in der *deutschen* Lokalisierung mit englischem Text (Ablehnungsrisiko 2.3).
> 4. **EU-DSA-Händlerstatus** liegt unter **Business → Agreements → Compliance** (Account-Ebene), nicht in App Information.

---

## ✅ Schon erledigt (bestätigt)
- Apple Developer Program aktiv & bezahlt bis **9. Mai 2027** (Individual, Team **88J7VD74DB**). Lizenzvertrag akzeptiert.
- **APNs-Key** erstellt: **J56G5XDVQT** (.p8 geladen, Sandbox & Production). ⚠️ Das ist ein **APNs**-Key, **kein** Sign-in-with-Apple-Key.
- ASC-App **Countrivo** angelegt, Version **1.0** in „Prepare for Submission".
- **Build 1.0 (1) hochgeladen** & verarbeitet (heißt: Bundle `com.countrivo.app` registriert + `PrivacyInfo.xcprivacy` war im Archiv, sonst wäre der Upload an ITMS-91053 gescheitert).
- **6 Screenshots** im 6,9″-Slot (1320×2868) — 1 reicht als Minimum, also **Screenshot-Pflicht erfüllt**.
- Version-Felder gefüllt: Promotional Text, Description (~1849 Z.), Keywords, Support-URL, Marketing-URL.
- Release-Option: „Manually release this version".
- Code: Account-Löschung **+ Apple-Token-Revoke voll implementiert** (`delete-account` ruft `/auth/revoke`, dann `admin.deleteUser`; `_shared/apple.ts` baut das ES256-Client-Secret) — **korrekt, aber inaktiv bis die `APPLE_*`-Secrets gesetzt sind**.
- `PrivacyInfo.xcprivacy` deklariert exakt Email, Name, UserID, DeviceID (Linked, App Functionality) + ProductInteraction (nicht-linked, Analytics) — **das müssen die App-Privacy-Labels spiegeln**.

---

## ⛔ BLOCKER — das fehlt noch (ohne das kein Submit/keine Freigabe)

### A) In App Store Connect (Metadaten-Gates)

**A1 — Copyright (leer).**
→ Version-1.0-Seite ▸ Copyright. Eintragen: `2026 Adam Kahirov` (Individual = dein Name) **oder** `2026 Countrivo`. Speichern.

**A2 — Age Rating (Fragebogen).** *App-Ebene, NICHT in der Lokalisierung.*
→ Sidebar **Age Rating** ▸ Edit. Alles **None/No** — auch der neue 2026-Block (In-App-Controls, Capabilities, Medical/Wellness, Violent Themes). „Unrestricted Web Access" = **No** (WebView ist via WKAppBoundDomains auf countrivo.com gesperrt). Ergebnis = **4+**. Speichern.

**A3 — App Privacy (Labels) + veröffentlichen.** *App-Ebene.*
→ Sidebar **App Privacy**. Zuerst Privacy-Policy-URL `https://countrivo.com/privacy` eintragen. Dann „Get Started" ▸ „Yes, we collect data" und **exakt 5 Typen** deklarieren (Tracking überall = **No**):
| Datentyp | Linked | Tracking | Zweck |
|---|---|---|---|
| Contact Info → Email Address | Yes | No | App Functionality |
| Contact Info → Name | Yes | No | App Functionality |
| Identifiers → User ID | Yes | No | App Functionality |
| Identifiers → Device ID (APNs-Token) | Yes | No | App Functionality |
| Usage Data → Product Interaction | No | No | Analytics |
Dann oben **Publish** klicken (Entwurf zählt nicht!).

**A4 — Primary Category.** → App Information ▸ Category: **Games** (Sub: **Trivia**), Sekundär optional **Education**.

**A5 — Pricing and Availability.** → Sidebar: Price = **Free**, Availability = alle Länder, **Tax Category** zuweisen.

**A6 — Content Rights.** → App Information ▸ Content Rights: bestätigen, dass du alle Inhalte besitzt/lizenziert hast.

**A7 — Primary Language auf English (U.S.) umstellen.** → App Information ▸ Primary Language = **English (U.S.)**, speichern. Den englischen Text (Description/Keywords/Promo) **und die 6 Screenshots in die English-(U.S.)-Lokalisierung** legen, die deutsche für 1.0 weglassen. *(Jetzt gratis änderbar — nach der ersten Freigabe stark eingeschränkt.)*

**A8 — App Review Information (Kontakt + Demo).** → Version-1.0-Seite ▸ App Review Information. Vorname/Nachname/Telefon/E-Mail. **„Sign-in required" NICHT ankreuzen** (alle 17 Spiele laufen ohne Login) — aber trotzdem einen Demo-Account in den Notes angeben, damit der Reviewer **Sign in with Apple + Delete Account** testen kann. Notes: native Features aufzählen (Apple-Login, APNs-Streak-Push, Haptics, Splash/Statusbar, Offline-Screen, In-App-Account-Löschung mit Token-Revoke nach 5.1.1(v)), „alle Spiele ohne Account spielbar", „WebView auf countrivo.com gesperrt", + Demo-Login.

**A9 — EU-DSA-Händlerstatus.** *Account-Ebene (du als Account Holder).*
→ **Business** (oben) ▸ Agreements ▸ Abschnitt **Compliance** ▸ Zeile **Digital Services Act** ▸ Complete. Wählen: **„This is not a trader account"** (deutscher Privat-/Hobby-Entwickler, gratis, keine Ads/IAP → vermeidet öffentliche Anzeige deiner Privatadresse). Done.

### B) In Supabase / Apple-Portal (damit Login & Löschung im Review funktionieren)

**B1 — Supabase Apple-Provider AN.** *(höchstes Funktionsrisiko, zuerst machen)*
→ Supabase ▸ Authentication ▸ Providers ▸ **Apple** ▸ Enabled. Unter **Client IDs** exakt `com.countrivo.app` eintragen. (Für den nativen idToken-Flow brauchst du hier **keine** Services-ID/.p8/Secret.) Speichern.
**Warum:** der native Button ruft `signInWithIdToken` mit `aud=com.countrivo.app`; ist der Provider aus, scheitert jeder Apple-Login im Review → Ablehnung 2.1.

**B2 — Separaten „Sign in with Apple"-Key + Token-Revoke deployen.**
→ Apple-Portal ▸ Keys ▸ **neuer Key mit „Sign in with Apple"** (NICHT der APNs-Key!) → Key-ID + .p8 notieren.
→ Supabase Secrets: `APPLE_TEAM_ID=88J7VD74DB`, `APPLE_KEY_ID=<neue SiwA-Key-ID>`, `APPLE_PRIVATE_KEY=<.p8-Inhalt>`, `APPLE_CLIENT_ID=com.countrivo.app`.
→ ✅ **Functions sind schon deployed (von mir, in deine Prod + getestet).** Du musst nur noch: (1) den SiwA-Key anlegen, (2) `APPLE_*`-Secrets setzen, (3) das `apple_credentials`-SQL im SQL-Editor einfügen — alles fertig vorbereitet in **`docs/SUPABASE-DEPLOY.md`** (idempotentes SQL, **kein** `supabase db push`).
**Warum:** alles ist hinter `appleConfigured()` gated; ohne Secrets speichert `apple-exchange` nichts und die Löschung revoket den Apple-Token nicht → der Test „Apple-Login → löschen → wieder einloggen" fällt auf → Ablehnung 5.1.1(v).

---

## 🔎 Verifizieren (kurz prüfen, wahrscheinlich ok)

- **App-ID-Capabilities:** Apple-Portal ▸ Identifiers ▸ `com.countrivo.app` → **Push Notifications** + **Sign in with Apple** aktiviert? Und im Xcode-Target unter Signing & Capabilities vorhanden?
- **APNs-Environment des Builds:** Wurde Build 1.0 (1) mit dem **App-Store-Distribution**-Profil archiviert? (Xcode setzt `aps-environment` dabei auf `production`.) Sonst schlägt der Streak-Push live still fehl — kein Submit-Blocker, aber das Feature wäre tot. Im Zweifel neu archivieren.
- **PrivacyInfo.xcprivacy Target-Membership = App** (für künftige Archive; der erfolgreiche Upload spricht dafür).

## 🟡 Optional (keine Eile, kein Blocker)
- Restliche **4 Screenshots** (auf 10) — nur Conversion, in den English-(U.S.)-Slot.
- **Kreditkarte** vor Mai 2027 hinterlegen (nur für Auto-Renewal 2027, heute irrelevant).
- Supabase **Streak-Freeze / Abend-Push-Cron** — Retention-Features, gehen auch nach Release.

---

## ❓ Deine offenen Fragen — beantwortet

1. **Kreditkarten-Warnung?** Blockiert **nichts**. Mitgliedschaft ist bis 9.5.2027 bezahlt → Submit/Review/Release gehen. Die Warnung betrifft nur die **Auto-Verlängerung 2027** (ohne Karte läuft sie aus → App würde dann entfernt). Karte vor Mai 2027 nachtragen.
2. **Supabase Apple-Login nötig vor Review?** **Ja, Pflicht** (B1). Ohne aktivierten Provider + `com.countrivo.app` in den Client-IDs scheitert jeder Apple-Login → Ablehnung 2.1. **Höchstes Risiko, zuerst erledigen.**
3. **Token-Revoke bei Löschung wirklich nötig?** **Ja** (Guideline 5.1.1(v), weil die App den Apple-Auth-Code erhält). Code ist korrekt, aber **nur aktiv, wenn deployed + `APPLE_*`-Secrets gesetzt** — und dafür brauchst du den **separaten SiwA-Key** (B2), nicht den APNs-Key.
4. **Deutsch als Primärsprache mit englischem Text?** **Umstellen** auf English (U.S.) (A7). Englischer Text im deutschen Slot = Ablehnungsrisiko 2.3 + deutsche Nutzer sähen alles englisch. Jetzt gratis änderbar.
5. **Was muss vor „Submit" komplett sein?** Build angehängt (✓), Copyright, Primary Category, Pricing (Free), Content Rights, Age Rating, App Privacy (publiziert, mit Policy-URL), Primary Language, App Review Info (+ Demo), **EU-DSA-Status**. Im Submit-Flow noch: **IDFA = No** + **Export Compliance**. Nicht button-erzwungen, aber review-relevant: Supabase-Apple-Provider + deployter Revoke-Flow.

---

## ▶️ Kürzeste korrekte Reihenfolge
1. **Supabase ▸ Apple-Provider AN** + Client-ID `com.countrivo.app` (B1).
2. **Apple-Portal ▸ neuer SiwA-Key** (.p8, Key-ID); App-ID-Capabilities prüfen.
3. **Supabase Secrets `APPLE_*`** setzen + Functions `apple-exchange delete-account send-push streak-reminder` deployen; `apple_credentials` in Prod prüfen (B2).
4. **Demo-Account** in Prod-Supabase anlegen (E-Mail/Passwort).
5. **Business ▸ Agreements ▸ Compliance ▸ Digital Services Act** → „not a trader account" (A9).
6. **App Information**: Primary Language = English (U.S.); Primary Category = Games (Trivia); Content Rights (A4/A6/A7).
7. **Age Rating** → alles None/No → 4+ (A2).
8. **App Privacy** → Policy-URL + 5 Typen (Tracking=No) → **Publish** (A3).
9. **Pricing and Availability** → Free + alle Länder + Tax Category (A5).
10. **Version-1.0-Seite**: Copyright `2026 Adam Kahirov`; englische Texte + 6 Screenshots in den English-(U.S.)-Slot; Build 1.0 (1) angehängt (A1/A7).
11. **App Review Information**: Kontakt + Demo-Login + native-Features-Notes („Sign-in required" aus) (A8).
12. **„Add for Review"** → im Flow **IDFA = No** + Export Compliance, Inline-Fehler beheben.
13. **„Submit for Review"** → Waiting for Review (~24–48 h).
14. Nach **Approved**: Version öffnen → **„Release This Version"** → in ~24 h live. 🎉
