# Countrivo — App Store Submission Master Document

This is the single source of truth for getting Countrivo onto the App Store. It is written so someone who has never shipped an iOS app can follow it top to bottom. Countrivo is a free daily geography game (no ads, no in-app purchases) shipped as a native iOS app via Capacitor 8: a locked-down WKWebView that loads the live `countrivo.com`. Bundle ID: `com.countrivo.app`. Target era: iOS 26 / Xcode 26 (June 2026).

How to read this file:
- **CODE** rows are handled in the engineering pass that ships alongside this document. You do not click anything for those, but you should confirm they landed.
- **MANUAL** rows are yours to do in a browser, in Xcode, or on a dashboard.
- ⚠️ marks something you must verify with your own eyes before you submit. Do not take it on faith.
- Every requirement carries the citation URL it came from.

Paste-ready text lives in code blocks. The line above each block tells you the exact field and its character limit.

---

## 0a. ENGINEERING PASS STATUS (2026-06-20)

This code pass resolved several blockers and added the missing back-end. What landed, and the new manual step each one needs:

| Item | Status | Your remaining manual step |
|------|--------|----------------------------|
| **B2** PrivacyInfo.xcprivacy | ✅ Created at `ios/App/App/PrivacyInfo.xcprivacy` | In Xcode, drag the file into the **App** target (tick "App") so it ships in the bundle, then Product ▸ Archive ▸ Privacy Report to confirm. |
| **B3** Apple token revocation | ✅ Implemented, gated, with a safe fallback | Set the `APPLE_*` secrets (step 3 below), run the `apple_credentials` migration, deploy `apple-exchange` + the updated `delete-account`. Until then the documented fallback under the B-table applies. |
| **B6** Privacy policy names Vercel + Supabase | ✅ Done in `src/app/privacy/page.tsx` | Redeploy the site so `countrivo.com/privacy` is current. |
| Evening streak-at-risk push (retention) | ✅ `supabase/functions/streak-reminder` written | Enable pg_cron + pg_net, set `CRON_SECRET`, deploy, schedule it (step 4). |
| Streak-freeze (retention) | ✅ Defensive logic in `updateStreak` | Run the `streak_freezes` migration (step 1). |

### New manual steps introduced by this pass
1. **Run two new migrations** (Supabase ▸ SQL editor, or `supabase db push`):
   - `supabase/migrations/20260620110000_streak_freezes.sql`
   - `supabase/migrations/20260620120000_apple_credentials.sql`
2. **Deploy/redeploy edge functions**: `supabase functions deploy apple-exchange`, `supabase functions deploy streak-reminder`, `supabase functions deploy delete-account` (it now imports the shared Apple helper).
3. **Apple token-revocation secrets** (only needed to fully satisfy B3; otherwise the fallback applies):
   ```
   supabase secrets set APPLE_TEAM_ID=XXXXXXXXXX APPLE_KEY_ID=YYYYYYYYYY \
     APPLE_CLIENT_ID=com.countrivo.app APPLE_PRIVATE_KEY="$(cat AuthKey_YYYYYYYYYY.p8)"
   ```
   Create a **Sign in with Apple** key in the Apple Developer portal for this (a separate .p8 from the APNs key is cleaner).
4. **Schedule the evening streak push** (enable pg_cron + pg_net, set `CRON_SECRET` first):
   ```sql
   select cron.schedule('streak-reminder','0 18 * * *', $$
     select net.http_post(
       url => 'https://<project-ref>.supabase.co/functions/v1/streak-reminder',
       headers => jsonb_build_object('x-cron-secret','<your CRON_SECRET>','Content-Type','application/json'),
       body => '{}'::jsonb) $$);
   ```
   18:00 UTC ≈ 19:00–20:00 Berlin (DST-dependent). At most one push/day/user; anyone who already played today is suppressed.

---

## 0. PRE-FLIGHT BLOCKERS (do these BEFORE anything else)

If any row here is not satisfied, the app is either rejected at upload (automated) or rejected in human review. Clear every one before you touch the submission flow in Section 7.

| # | Blocker | Why (guideline + citation) | Action | Type |
|---|---------|----------------------------|--------|------|
| B1 | Build with Xcode 26 / iOS 26 SDK | Mandatory for all submissions since 2026-04-28. An older-SDK build is rejected at upload, before any human looks at it. https://developer.apple.com/news/upcoming-requirements/ | Archive from Xcode 26. Confirm Capacitor 8 + every native plugin (`@capacitor-community/apple-sign-in`, `@capacitor/push-notifications`, `@capacitor/haptics`) compiles under the iOS 26 SDK. Deployment target may stay iOS 16. | CODE |
| B2 | `PrivacyInfo.xcprivacy` in the iOS app target | Mandatory since 2024-05-01. Missing it triggers automated **ITMS-91053** rejection at upload. The file is absent from `ios/` today. https://developer.apple.com/documentation/bundleresources/privacy_manifest_files | Add the manifest with `NSPrivacyTracking=false`, `NSPrivacyTrackingDomains=[]`, Required-Reason API `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1` (Capacitor Preferences uses NSUserDefaults), and `NSPrivacyCollectedDataTypes` mirroring Section 4(b). Then run Xcode's Privacy Report on the archive to catch any extra file-timestamp / disk-space / boot-time APIs from plugins. https://developer.apple.com/news/?id=pvszzano | CODE |
| B3 | Sign in with Apple token revocation on account delete | Because the app offers Sign in with Apple, deleting a Sign-in-with-Apple account must also call `POST https://appleid.apple.com/auth/revoke`. The current `delete-account` Edge Function only calls `admin.auth.admin.deleteUser` and **does not revoke the Apple token** (confirmed in `supabase/functions/delete-account/index.ts`). https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple | Engineering: (a) at first Sign-in-with-Apple sign-in, exchange the auth code at `POST /auth/token` for a refresh token and store it encrypted; (b) inside `delete-account`, call `/auth/revoke` before deleting the row. ⚠️ If this does not land before submission, see the fallback note directly under this table. | CODE |
| B4 | Age Rating questionnaire (2025/2026 system), result **4+** | The Jan 31 2026 deadline has passed; until the new questionnaire is answered, submissions are blocked. https://developer.apple.com/news/?id=ks775ehf | Answer it per Section 4(a). **Do NOT check "Unrestricted Web Access"** — the WebView is domain-locked. Result must read 4+, no override, Made for Kids OFF. | MANUAL |
| B5 | EU Digital Services Act trader status | Required since 2025-02-17. Without a declaration the app cannot be distributed or updated in the EU. https://developer.apple.com/news/?id=einwn76m | In App Store Connect ▸ App Information (or Business ▸ Trader Status), declare **trader** or **non-trader**. ⚠️ This is a legal declaration about you. If you sell in the EU under a business identity, you are a trader; pick honestly. | MANUAL |
| B6 | Privacy policy live AND discloses analytics + Supabase | The App Store Connect URL alone is not enough; the policy must actually disclose the data flow, and you need an in-app link. https://developer.apple.com/app-store/review/guidelines/#privacy | `countrivo.com/privacy` is live (page exists at `src/app/privacy/page.tsx`). ⚠️ **GAP:** the page currently says "site analytics tools" generically — it does **not name Vercel Web Analytics**, does not link `vercel.com/legal/privacy-policy`, and does not name Supabase as processor. Edit the page to name them, or your App Privacy labels will not match your stated policy. https://vercel.com/legal/privacy-policy | MANUAL |
| B7 | App Privacy labels match the manifest | The nutrition labels in App Store Connect must match what the binary collects (and what `PrivacyInfo.xcprivacy` declares). A mismatch is a privacy rejection. https://developer.apple.com/app-store/app-privacy-details/ | Declare exactly the types in Section 4(b). Mark **nothing** as tracking; declare no advertising data. Keep them identical to `NSPrivacyCollectedDataTypes` in B2. | MANUAL |
| B8 | UGC: report/block + support contact (Guideline 1.2) | A username shown to other players is user-generated content. Apple requires a filter, a way to report it, a way to block the user, and a published support contact answered within ~24h. https://developer.apple.com/app-store/review/guidelines/#user-generated-content | Server-side username profanity filter exists (`src/lib/profanity.ts` + `src/app/actions/profile.ts`) and friend-remove exists (`removeFriend` in `src/app/actions/friends.ts`). ⚠️ **GAP:** there is **no in-app "Report" action** on the leaderboard or profile in the code, yet `src/app/support/page.tsx` tells users to "use the '…' menu to block or report." Either ship a real Report/Block control before submission, or change the review notes and the support FAQ to describe the path that actually exists (report by emailing `countrivo@gmail.com`; block = remove friend). Do not claim a UI the reviewer cannot find. | MANUAL |
| B9 | 4.2 minimum-functionality review notes | A WKWebView app is routinely auto-flagged as a repackaged website before the reviewer finds the native layer. https://developer.apple.com/app-store/review/guidelines/#minimum-functionality | Paste the Section 6 argument into App Review Notes. Make all six native features visibly work on the review device; a short screen recording of the offline screen + a haptic moment is the strongest evidence. | MANUAL |
| B10 | Demo account + app completeness (Guideline 2.1) | Reviewers need working credentials and a live back end on review day. https://developer.apple.com/distribute/app-review/ | Pre-seed the demo account (streak, 2–3 friends, finished games), confirm the daily is playable without a streak gate, and keep Supabase + Vercel live. Creds in Section 6. ⚠️ Rotate the committed demo password before submitting (see note under this table). | MANUAL |
| B11 | Support URL set and live (Guideline 1.5) | A blank or broken Support URL alone causes rejection. https://developer.apple.com/app-store/review/guidelines/#safety | `https://countrivo.com/support` is live (`src/app/support/page.tsx`). ⚠️ Confirm it loads in a private browser window with no login gate. | MANUAL |
| B12 | Push optional and non-coercive (4.5.4 / 5.1.2(i)) | The app must be fully usable if push is denied; the prompt must come after value is shown, not at cold launch; payload must be generic. https://developer.apple.com/app-store/review/guidelines/#push-notifications | Code already defers the prompt until after the first completed daily and re-registers only if granted (`src/lib/native/bootstrap.ts`). ⚠️ Confirm on device that denying push leaves every game playable, and that an in-app or Settings toggle disables it. | CODE |
| B13 | Screenshots at the correct 2026 size | The required iPhone slot is 6.9-inch = **1320×2868** portrait. Your existing files are the wrong size and App Store Connect will reject them. https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/ | ⚠️ **GAP:** `resources/store-screenshots/*.png` are **1290×2796** (6.7-inch), confirmed by `sips`. Regenerate at **1320×2868** before upload. See Section 3. | MANUAL |
| B14 | `ITSAppUsesNonExemptEncryption=false` set | Lets uploads skip the export-compliance question; if absent you must answer it every build. https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption | Already present in `ios/App/App/Info.plist` (confirmed). No action. | CODE |
| B15 | App icon 1024×1024, no alpha | A transparent or pre-rounded icon is rejected. https://developer.apple.com/forums/thread/794028 | `resources/icon.png` is 1024×1024 with no alpha (confirmed by `sips`) and ships inside the build via the asset catalog. No separate upload. | CODE |

### ⚠️ Fallback if B3 (Apple token revocation) is not wired by submission day
Ship the full data deletion anyway (the account, profile, runs, streaks, friendships, and push token are already removed via cascade). If the reviewer flags 5.1.1(v), reply in Resolution Center: state that all user data is permanently deleted, that you are adding server-side Apple token revocation, and (if true) that the user is directed to revoke at appleid.apple.com. Patch in 1.0.1. This is a known, narrow risk, not a guaranteed rejection. https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple

### ⚠️ Credential hygiene
The demo password in `docs/APP-STORE-SUBMISSION.txt` is committed in plaintext. Rotate it, set the new value on the live `review@countrivo.com` account, and put the new value only in the App Review Information field (never back into a committed file).

---

## 1. One-time accounts & prerequisites

Do these once. Most are gates for everything in Sections 5–7.

| Item | What to do | Where | Citation |
|------|------------|-------|----------|
| Apple Developer Program | Enroll, $99/yr. Use the same Apple ID for App Store Connect and Xcode signing. | https://developer.apple.com/programs/ | https://developer.apple.com/support/compare-memberships/ |
| Team ID | Note your 10-character Team ID. | developer.apple.com ▸ Membership | — |
| App ID | Create explicit App ID `com.countrivo.app` with **Push Notifications** and **Sign in with Apple** capabilities enabled. | developer.apple.com ▸ Certificates, Identifiers & Profiles ▸ Identifiers ▸ + ▸ App | https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment |
| APNs auth key | Keys ▸ + ▸ name "Countrivo APNs" ▸ tick **Apple Push Notifications service (APNs)** ▸ Register ▸ **download the `.p8` once** (it downloads a single time — store it safely, never commit). Note the 10-char Key ID. | developer.apple.com ▸ Keys | https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment |
| EU DSA trader status | Decide trader vs non-trader (B5) and have the supporting details ready (business name, address, contact, registration number if a trader). | App Store Connect ▸ Business / App Information | https://developer.apple.com/news/?id=einwn76m |
| Supabase live | Back end must answer during review: device-token migration applied, `send-push` and `delete-account` functions deployed, Apple provider enabled with Authorized Client ID `com.countrivo.app`. Full steps in `docs/SHIP-CHECKLIST.md` steps 3–4. | Supabase dashboard | https://developer.apple.com/distribute/app-review/ |
| Vercel live | `countrivo.com` (the origin the WebView loads) must be deployed and up. Deploy current `main` first: `vercel --prod --yes`. | Vercel | https://developer.apple.com/distribute/app-review/ |

---

## 2. App Store Connect — every text field (paste-ready)

These values are reused verbatim from the existing copy packet (`docs/APP-STORE-SUBMISSION.txt`); do not rewrite the marketing copy. Paste each block into the field named above it. Counts are characters including spaces; all are within Apple's limits.

**App Name** — `App Store Connect ▸ My Apps ▸ Countrivo ▸ App Information ▸ Localizable Information ▸ Name` (also set when you first create the record). Limit 30. Current 26.
```
Countrivo: Daily Geography
```

**Subtitle** — `App Information ▸ Localizable Information ▸ Subtitle`. Limit 30. Current 27.
```
Flags, capitals & countries
```

**Promotional Text** — `[App Store] ▸ 1.0 version page ▸ Promotional Text`. Limit 170. Current 145. (Editable any time without review.)
```
A fresh geography challenge every day. New puzzles at midnight, 17 games, streaks, and friend leaderboards. 100% free, no ads, no purchases.
```

**Keywords** — `1.0 version page ▸ Keywords`. Limit 100. Current 96. Comma-separated, no spaces, no competitor names, no the word "app".
```
geography,quiz,trivia,world,map,atlas,nation,puzzle,brain,daily,learn,states,memory,streak
```

**Description** — `1.0 version page ▸ Description`. Limit 4000. Current ~1480.
```
One new geography challenge every day. Countrivo gives you a fresh daily puzzle across 17 games, then resets at midnight so everyone in the world plays the same board. Build a streak, climb the leaderboard, and find out how well you really know the planet.

Pick a game and play in two minutes:

- Flag Quiz: name the country from its flag, ten rounds, no second chances.
- Capital Match: given a country, choose the correct capital.
- Higher or Lower: two countries, one stat, keep your streak alive.
- Country Draft: assign revealed countries to the category they rank highest in and beat the optimal score.
- Stat Guesser: guess a real number — population, GDP, area — closer is better.
- Population Sort: order countries from highest to lowest.
- Country Streak: identify countries until one wrong answer ends the run.
- Border Buddies: name every neighbor a country shares a border with.
- Continent Sprint, Speed Flags, Odd One Out, Supremacy, Borderline, Blitz and more.

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
⚠️ Accuracy check against the build before you paste: the reality map flags that Population Sort uses ▲/▼ buttons (not literal drag-and-drop) and Continent Sprint is a count-up timer. The description above says "order countries from highest to lowest" and lists Continent Sprint by name only, so it stays truthful. If you ever add "drag-and-drop" or "race the clock" wording, it would overstate the build.

**What's New** — `1.0 version page ▸ What's New in This Version`. Limit 4000. **Leave BLANK for 1.0** (the field does not appear on a first version). For 1.0.1+ paste:
```
Smoother daily play, faster loads, and small polish across all 17 games. New: tap a friend on the leaderboard to replay their run. Thanks for playing Countrivo every day.
```

**Primary Category** — `App Information ▸ General Information ▸ Category ▸ Primary`.
```
Games  (subcategory: Trivia)
```

**Secondary Category** — `App Information ▸ Category ▸ Secondary`.
```
Education
```
⚠️ Do **not** select the Kids Category. 4+ general is correct; the Kids Category would ban your analytics and force a parental gate. https://developer.apple.com/app-store/review/guidelines/#kids

**Support URL** — `1.0 version page ▸ Support URL`. Limit 255.
```
https://countrivo.com/support
```

**Marketing URL** — `1.0 version page ▸ Marketing URL` (optional). Limit 255.
```
https://countrivo.com
```

**Privacy Policy URL** — `App Information ▸ General Information ▸ Privacy Policy URL`. Limit 255.
```
https://countrivo.com/privacy
```

**Copyright** — `App Information ▸ General Information ▸ Copyright`.
```
2026 Countrivo
```

---

## 3. Images — exact specs + what to capture

### App icon
- 1024×1024 PNG, **no alpha / no transparency**, no pre-rounded corners (Apple rounds them). `resources/icon.png` already meets this and ships inside the build via `ios/App/App/Assets.xcassets`. Nothing to upload to App Store Connect separately. https://developer.apple.com/forums/thread/794028
- iOS 26 note: Apple now supports layered "Liquid Glass" icons authored in Icon Composer 2 (`.icon`). This is optional polish, not required. ⚠️ If you adopt it, ship the `.icon` **instead of** the asset-catalog PNG, never both — mixing them causes ITMS-90022 / 90023 / 91111 at upload. The current flat PNG is a valid, accepted submission as-is. https://developer.apple.com/forums/thread/794028

### Screenshots
- Required iPhone slot: **6.9-inch iPhone**, exactly **1320×2868 px portrait**, PNG, RGB, **no alpha**, ≤10 MB, 3–10 images. This single set auto-scales down to smaller iPhones; you do not need other iPhone sizes. https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- iPad: only required **if the Xcode target ships iPad**. If it does, you must add 13-inch iPad screenshots (2064×2752). The cleaner path is to set the app **iPhone-only** so no iPad screenshots are needed. ⚠️ Confirm the device family in Xcode before deciding. https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- Content rule (2.3.3 / 2.3.10): screenshots must show real gameplay/daily/leaderboard, not the splash screen. Include at least one dark-mode shot. https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/

⚠️ **REGENERATE BEFORE UPLOAD.** The five files in `resources/store-screenshots/` are **1290×2796** (6.7-inch), confirmed with `sips`. They will be **rejected** at the 6.9-inch slot, which requires 1320×2868. Recapture on a 6.9-inch device or simulator (e.g. iPhone 17 Pro Max class) at 1320×2868, or re-render the existing frames onto a 1320×2868 canvas.

Capture these (captions reused from the packet — paste each as the screenshot's text overlay if you add overlays):

| # | Screen to capture | Caption |
|---|-------------------|---------|
| 1 | Daily hub / game grid with the midnight countdown | A new geography challenge every day |
| 2 | Flag Quiz mid-round | Name the flag. 243 countries. |
| 3 | Higher or Lower with the streak visible | Keep your streak alive |
| 4 | Country Draft or Stat Guesser | Outsmart the optimal score |
| 5 | Friends leaderboard | Beat your friends |
| 6 | Result / game-over (score + share + streak) | Same puzzle, worldwide |
| 7 (optional) | Profile streak stats | — |
| 8 (optional) | Country / Atlas page | — |

⚠️ If you keep screenshot #8 (Atlas), the reality map warns the Atlas sticker collection currently shows 0% for every account (no write path in the repo). Do not present it as a working collection feature in a screenshot unless the write path has shipped — an Apple reviewer who taps into an empty, broken feature can cite 2.1 (completeness).

---

## 4. Every checkbox, toggle & questionnaire answer

### (a) Age Rating questionnaire
`App Information ▸ Age Rating ▸ Edit`. Answer to land on **4+** with no override and Made for Kids OFF. https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/ and https://developer.apple.com/news/?id=ks775ehf

| Question | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic / Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature / Suggestive Themes | None |
| Horror / Fear Themes | None |
| Sexual Content or Nudity | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Simulated Gambling | None |
| Gambling (real money) | No |
| Contests | No |
| Medical / Treatment Information | None |
| Unrestricted Web Access | **No** ⚠️ The WebView is locked to countrivo.com via `WKAppBoundDomains` — it is not a general browser, so this stays No. Checking it would push the rating up needlessly. |
| User-Generated Content | **Yes** (leaderboard usernames). This is allowed and stays 4+ as long as the filter/report/block from B8 are in place. |
| Messaging / Chat | No (no chat, no free-text between users) |
| In-App Advertising | No |
| Made for Kids / Kids Category | **Off** |
| Age Assurance / Parental Controls | No |

### (b) App Privacy nutrition labels
`App Privacy ▸ Get Started`, then **Publish**. "Data Used to Track You" = NONE — answer **No** to tracking for every type, so there is **no ATT prompt**. These must match `NSPrivacyCollectedDataTypes` in the manifest (B2/B7). https://developer.apple.com/app-store/app-privacy-details/

| Data type | Collected | Linked to identity | Used for tracking | Purpose / note |
|-----------|-----------|--------------------|-------------------|----------------|
| Contact Info ▸ Email Address | Yes | Yes | No | App Functionality (account / Sign in with Apple; the Hide-My-Email relay still counts as email) |
| Contact Info ▸ Name | Yes | Yes | No | App Functionality (display name on leaderboards) |
| Identifiers ▸ User ID | Yes | Yes | No | App Functionality (account, friends, streaks, runs) |
| Identifiers ▸ Device ID | Yes | Yes | No | App Functionality (APNs push token for the daily reminder). ⚠️ Do not omit this — the push token is a device identifier. |
| Usage Data ▸ Product Interaction | Yes | No | No | Analytics (Vercel Web Analytics) |
| Diagnostics ▸ Performance Data | Only if Vercel Speed Insights is enabled | No | No | Analytics. ⚠️ Leave unchecked unless Speed Insights is actually on. |
| Everything else (Location, Health, Financial, Contacts, User Content, Browsing History, Purchases, Crash Data, Sensitive Info, …) | No | — | — | Not Collected |

### (c) Export compliance
`Info.plist` sets `ITSAppUsesNonExemptEncryption=false`, so the upload does not prompt for export compliance. The app uses only standard OS HTTPS/TLS, which is exempt. No action. https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption

### (d) Content Rights
`App Information ▸ Content Rights`: answer **No**, your app does **not** contain, show, or access third-party content (all 243-country data, flags, and game content are yours). https://developer.apple.com/app-store/review/guidelines/

### (e) IDFA / advertising
`version page ▸ Build ▸ Advertising Identifier (IDFA)`: **No**. No ad SDK, no IDFA, no cross-app tracking. https://developer.apple.com/app-store/user-privacy-and-data-use/

### (f) Pricing & availability
`Pricing and Availability`: **Free**, all territories. No in-app purchases, no subscriptions. https://developer.apple.com/app-store/product-page/

---

## 5. Technical build pipeline (the Xcode clicks)

Prerequisite: Sections 1 (App ID, APNs key) and the Supabase/Vercel steps in `docs/SHIP-CHECKLIST.md` are done, and `vercel --prod --yes` has deployed the current site.

1. `npx cap sync ios`, then `npx cap open ios` to open the project in **Xcode 26**.
2. Select the **App** target ▸ **Signing & Capabilities**: set **Team**, enable **Automatic signing**, confirm Bundle Identifier `com.countrivo.app`. Add capabilities **Push Notifications** and **Sign in with Apple** if not already present.
3. ⚠️ Confirm `PrivacyInfo.xcprivacy` (B2) is a member of the **App** target (select it ▸ File Inspector ▸ Target Membership ▸ App ticked). If it is not in the target, the privacy report is empty and ITMS-91053 can still fire.
4. Set **Marketing Version 1.0** and **Build 1** (target ▸ General, or the version page).
5. Switch the APNs backend to production: set the Supabase function secret `APNS_ENV=production` (it was `sandbox` for device testing). TestFlight and the App Store use the production APNs host. https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment
6. Destination ▸ **Any iOS Device (arm64)**. **Product ▸ Archive.**
7. In the **Organizer**: **Validate App** first (catches signing, privacy-manifest, and asset issues), then **Distribute App ▸ App Store Connect ▸ Upload**. There is no export-compliance prompt because of B14.
8. ⚠️ Run **Privacy Report** on the archive (Organizer ▸ right-click the archive ▸ Generate Privacy Report) and confirm it lists only the APIs you declared. Any surprise (file timestamp, disk space, system boot time, active keyboards) from a plugin must be added to `PrivacyInfo.xcprivacy` with its reason code before you ship.

### TestFlight smoke test (run on a real device — the Simulator cannot do push)
`App Store Connect ▸ TestFlight ▸ Internal Testing`, add yourself, install via the TestFlight app, then verify:
- [ ] **Sign in with Apple** completes and the session **survives a force-quit** (relaunch still signed in).
- [ ] **Push** fires: accept the prompt after finishing a daily, confirm a `device_tokens` row with environment `production`, and that a test push arrives.
- [ ] **Haptics** fire on answers and the result screen (Taptic Engine, not just a buzz).
- [ ] **Offline screen**: enable Airplane Mode and relaunch — the custom `offline.html` shows, not the WebKit error page.
- [ ] **Delete Account**: Profile ▸ Edit ▸ Delete account ▸ confirm removes the account and signs you out; re-login fails. ⚠️ Until B3 lands, the Apple token is not revoked even though all data is deleted — note this for Resolution Center if asked.
- [ ] **Push denied path**: on a second clean install, deny push and confirm every game is still fully playable.

---

## 6. App Review notes (paste-ready)

`version page ▸ App Review Information ▸ Notes`. Paste the block below. ⚠️ Before pasting, reconcile two honesty points with the build: (1) only claim the Report/Block path that actually exists (B8) — if no in-app Report control shipped, keep the wording as "report by emailing support; block by removing the friend"; (2) the demo password must be the rotated value you set on the live account.

```
Countrivo is a free daily geography game. No ads, no in-app purchases, no subscriptions.

NATIVE VALUE (pre-empting Guideline 4.2). This is a Capacitor app that renders countrivo.com inside a locked-down WKWebView (WKAppBoundDomains, limitsNavigationsToAppBoundDomains=true, restricted to countrivo.com and www.countrivo.com). It adds six native capabilities that mobile Safari cannot provide, each demonstrable on the review device:

1. Native Sign in with Apple via AuthenticationServices (ASAuthorizationController) — a native sheet on the login screen, not a web OAuth redirect.
2. APNs push: after the first completed daily challenge the app requests notification permission for the daily streak reminder; the token is saved to the account. Web Push is blocked inside WKWebView, so this is true native APNs.
3. Taptic Engine haptics on answer and result events via the native Haptics bridge (UIFeedbackGenerator). navigator.vibrate() does not drive the Taptic Engine.
4. Custom native offline screen (offline.html, set as errorPath) that replaces the default WebKit error page when the network drops — enable Airplane Mode to see it.
5. Native splash and status-bar theming with no browser chrome and no white flash.
6. WKAppBoundDomains lockdown — users cannot navigate to arbitrary URLs. This is a deliberate security boundary, not a general browser.

HOW TO TEST: log in with the demo account below (pre-seeded with a streak, friends, and finished games), or play today's daily challenges with no login. Today's daily is accessible on the demo account and is not gated behind a streak.

DEMO ACCOUNT:
Email: review@countrivo.com
Password: <ROTATED_PASSWORD>
(Email confirmation is off in Supabase, so this real account logs in instantly.)

ACCOUNT DELETION (5.1.1 v): in-app at Profile > Edit profile > Delete account > confirm. The server-side delete permanently removes the account and all associated data — profile, game runs, streaks, friendships, challenges, and the APNs push token — via cascading deletes, and signs the user out.

SOCIAL SAFETY (1.2): the only user-visible content is a username plus scores — there is no chat and no free-text between users. Usernames are filtered for objectionable content server-side at creation and change. A user can remove any friend, which hides that user's activity. To report an offensive username, contact support at countrivo@gmail.com (also published in-app at countrivo.com/support), answered within 24 hours.
```

⚠️ The original packet asserts "a Report path exists on leaderboards" and the support page mentions a profile "…" menu to "block or report." The code does not currently include that control. The block above intentionally describes the **real** path (server-side filter + remove-friend + email report). Use this wording unless the engineering pass actually ships an in-app Report button, in which case update both this note and `src/app/support/page.tsx` to match.

---

## 7. Submission order (the clicks, numbered end to end)

Do Section 0 first. Then:

1. **developer.apple.com** ▸ Identifiers: create App ID `com.countrivo.app` (explicit) with **Push Notifications** + **Sign in with Apple**. Keys: create the APNs `.p8`, save it, note Key ID + Team ID. (Section 1.)
2. **Supabase / Vercel**: apply the device-token migration, deploy `send-push` and `delete-account`, enable the Apple provider with Authorized Client ID `com.countrivo.app`, and run `vercel --prod --yes`. (`docs/SHIP-CHECKLIST.md` steps 3–4 and step 0.)
3. **App Store Connect ▸ Apps ▸ + ▸ New App**: iOS, Name `Countrivo: Daily Geography`, Bundle ID `com.countrivo.app`, SKU `countrivo-ios-001`, primary language English.
4. **App Information**: paste Subtitle, Primary/Secondary Categories, Copyright, Privacy Policy URL (Section 2). Set **Content Rights = No** (4d). Declare **EU DSA trader status** (B5).
5. **Age Rating ▸ Edit**: answer the questionnaire per Section 4(a). Confirm result reads **4+**, no override, Made for Kids OFF.
6. **1.0 version page**: paste Promotional Text, Description, Keywords, Support URL, Marketing URL (Section 2). Leave **What's New** blank.
7. **Previews and Screenshots ▸ 6.9-inch iPhone**: upload the **regenerated 1320×2868** screenshots (Section 3). ⚠️ Not the old 1290×2796 files.
8. **App Privacy ▸ Get Started**: declare the data types in Section 4(b), mark nothing as tracking, then **Publish**.
9. **Pricing and Availability**: **Free**, all territories (4f).
10. **Xcode 26** (Section 5): archive, validate, upload. Flip `APNS_ENV=production` before this. Run the Privacy Report on the archive.
11. **TestFlight ▸ Internal Testing**: add yourself, install, run the full smoke test in Section 5 on a real device.
12. **1.0 version page ▸ Build ▸ +**: select the uploaded build. Set **IDFA / Advertising Identifier = No** (4e).
13. **App Review Information**: tick "Sign-in required", paste the demo email + the **rotated** password, paste the Section 6 notes.
14. **Version Release**: choose **Manually release this version**, then **Save**.
15. **Add for Review ▸ Submit for Review.** Status moves Waiting → In Review (typically 24–48h).
16. On **Approved (Pending Developer Release)**: open the version ▸ **Release This Version**. Live within ~24h.

---

### Cross-references
- Manual dashboard/Xcode steps in finer detail: `docs/SHIP-CHECKLIST.md`
- Original copy packet (source of the verbatim marketing text): `docs/APP-STORE-SUBMISSION.txt`
- 2026 requirements with full citations: `/tmp/countrivo-appstore-requirements.md`
- Honest build status / known gaps: `docs/APP-REALITY-MAP.md`
