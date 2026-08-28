# Countrivo iOS — Ship Checklist (the "you click this" list)

Everything codeable is done and validated (Capacitor 8 shell, native bridges, push backend,
Apple sign-in, account deletion, iOS project scaffolded). These are the steps that need YOUR
Mac / Apple account / dashboards. Do them in order.

> Bundle ID used everywhere: **`com.countrivo.app`**

## 0. Deploy the web app (so the WebView shows the new build)
The native app loads the LIVE site (`server.url = https://countrivo.com`). Deploy the current
branch first so the iOS app shows all the new work (dark theme, tab bar, juice, native bridges).
- `vercel --prod --yes` (per project convention — CLI deploy, not git push).

## 1. Apple Developer portal — App ID
developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → ➕ → App →
Bundle ID **`com.countrivo.app`** (explicit). Enable capabilities: **Push Notifications** AND
**Sign In with Apple**. Save.

## 2. Apple Developer portal — APNs Auth Key
Keys → ➕ → name "Countrivo APNs" → tick **Apple Push Notifications service (APNs)** →
Continue → Register → **Download the `.p8`** (downloads ONCE — store safely, never commit).
Note the **Key ID** (10 chars) and your **Team ID** (Membership page, 10 chars).

## 3. Supabase — push backend
- Apply the migration: `supabase db push` (creates `device_tokens`), or run
  `supabase/migrations/20260619120000_device_tokens.sql` in the SQL editor.
- Set the Edge Function secrets (from step 2):
  ```
  supabase secrets set APNS_KEY_ID=XXXXXXXXXX APNS_TEAM_ID=YYYYYYYYYY \
    APNS_BUNDLE_ID=com.countrivo.app APNS_ENV=sandbox \
    APNS_PRIVATE_KEY="$(cat AuthKey_XXXXXXXXXX.p8)"
  ```
  (`APNS_ENV=sandbox` while testing from Xcode; switch to `production` for TestFlight/App Store.)
- Deploy the functions: `supabase functions deploy send-push` and `supabase functions deploy delete-account`.

## 4. Supabase — Apple sign-in + redirects
- Authentication → Providers → **Apple** → enable. Under **Authorized Client IDs** add
  `com.countrivo.app`. (Leave Services ID / Team ID / Secret BLANK — those are only for web OAuth.)
- Authentication → URL Configuration → Additional Redirect URLs: add
  `https://countrivo.com/auth/callback` and `com.countrivo.app://login-callback`.

## 5. Xcode — open & sign
`npx cap open ios` → select the **App** target → **Signing & Capabilities**:
- Set **Team** to your Apple Developer team, enable **Automatic signing**.
- Confirm Bundle Identifier = `com.countrivo.app`.
- Click **➕ Capability** → add **Push Notifications** and **Sign in with Apple**.

## 6. Xcode — native wiring (one-time)
- Add `ios/App/App/MainViewController.swift` to the App target if it isn't already (drag it into
  the project navigator, check "App" target). Then open `Base.lproj/Main.storyboard`, select the
  Bridge View Controller → Identity Inspector → **Custom Class = `MainViewController`**
  (enables no-bounce + edge-swipe-back).
- ✅ Info.plist already has `WKAppBoundDomains` (countrivo.com / www), `ITSAppUsesNonExemptEncryption=false`
  (so uploads skip the export-compliance question), `UIViewControllerBasedStatusBarAppearance`, and the
  `CFBundleURLTypes` scheme `com.countrivo.app` — added in this repo, no action needed.
- ✅ `AppDelegate.swift` already includes the two APNs glue methods
  (`didRegisterForRemoteNotificationsWithDeviceToken` / `didFailToRegister…`) — added in this
  repo, no action needed (without them push registration silently never fires).

## 7. App icon + splash — ✅ DONE (no action needed)
A gold-graticule-globe app icon + dark splash (light + dark) are already generated into
`ios/App/App/Assets.xcassets` from `resources/icon.png` + `resources/splash.png`. To use your
own art instead, replace those two files and re-run
`npx @capacitor/assets generate --ios && npx cap sync ios`.

## 8. Test on a REAL iPhone (Simulator can't do push)
Run from Xcode on a device → accept the push prompt → confirm a row appears in `device_tokens`
(environment `sandbox`) → tap **Sign in with Apple**, confirm a Supabase session is created and
survives a force-quit → verify haptics, light status-bar text, no rubber-band bounce,
edge-swipe-back, and airplane-mode shows the offline screen.

## 9. App Store Connect — create + submit
- appstoreconnect.apple.com → Apps → ➕ → New App → iOS, name "Countrivo", Bundle ID
  `com.countrivo.app`, set SKU.
- App Privacy nutrition labels (honest, and they MUST match the privacy policy): Email + Name +
  User ID (account; via email or Sign in with Apple), Device ID / push token (for notifications),
  and Usage/Diagnostics (Vercel Analytics/Speed Insights). Add 6.7" & 6.9" screenshots, description,
  keywords, support URL, privacy-policy URL, age rating.
- Xcode → set Version 1.0.0 + Build number → Destination "Any iOS Device (arm64)" →
  Product → Archive → Distribute App → App Store Connect → Upload. (Switch
  `APNS_ENV=production` on the function for TestFlight/App Store — they use the prod APNs host.)
- In App Store Connect, select the build → in **Review Notes** list the native value-add
  (APNs push, Taptic haptics, native Sign in with Apple, splash/status bar, offline screen,
  in-app account deletion) to pre-empt Guideline 4.2, give a demo login → Add for Review → Submit.
- On approval: **Release this version**. 🎉 Public.
