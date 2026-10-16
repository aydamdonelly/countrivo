# Countrivo App Review working packet

Updated 2026-10-15. This replaces the obsolete account-based submission instructions. Historical versions remain in Git history. Paste-ready response draft: [APP-STORE-SUBMISSION.txt](APP-STORE-SUBMISSION.txt).

## Current status and release identity

- App Store Connect: **Rejected — Guideline 2.1, Information Needed**. This is a request for information; it is not an approval or a diagnosis that every listed feature exists.
- Submitted version **1.0 (2)**, bundle **com.countrivo.app**, display name **Countrivo**, listing **Countrivo: Daily Geography**.
- Previous submission: 14 October 2026, 00:23 as displayed in App Store Connect; ID `f4cab4b2-751c-4180-a735-7d7e5538bcbe`.
- Evidence: `resources/app-store-current/asc-submitted.jpg` and `xcode-upload.jpg`. These show the earlier successful upload/submission, not a later approval.
- Apple's current information request: `reports/2026-10-15/app-review/evidence/apple-2-1-information-needed.jpg`.
- **No fresh physical-device video has been recorded or supplied. No resubmission after this feedback is claimed.**
- An Apple Developer licence-agreement banner currently requires acceptance by the account holder. The account holder must review and accept it; an agent must not accept that legal agreement on their behalf.

## What Apple requested

The following accurately summarises the six questions; the screenshot above is the exact source.

1. A screen recording on a **physical device running the latest OS**, beginning with app launch and demonstrating typical use. If present, include registration/login/deletion, UGC reporting/blocking, and paid access.
2. The app's purpose, audience, problem and value.
3. Setup and steps to access its main features, including any required credentials or sample files.
4. External services/tools/platforms supporting core functionality, including data, authentication, payments and AI.
5. Regional differences, or confirmation that the experience is consistent.
6. Relevant documents/credentials showing authorisation for any regulated or protected third-party material.

## Product facts for the response

Countrivo is a free geography and history game collection for people who enjoy short daily puzzles and practice. There are **six daily games**: Country Draft, GeoWordle, Pinpoint, Flag Quiz, Higher or Lower and Stat Guesser. **Blind Pick and Speed Flags are practice-only**; the daily games also offer practice.

- No registration or login, subscription, in-app purchase, paid access or advertising. No demo account, credentials or sample files are needed.
- Open a game and play. Daily boards are shared for the same date/edition and reset at midnight Europe/Berlin. Practice does not change the daily leaderboard.
- Country Draft: five rounds; choose one of three countries, one of its people and an unused cabinet role. Scores appear after commitment, followed by explanations and a cabinet result.
- GeoWordle: six country guesses; distance, direction and map feedback narrow the answer. Solving opens optional neighbours and capital rounds.
- Results can be shared. Publishing a leaderboard name is optional. A device identifier allows saved moves and one daily result; it is not an account.
- Optional calendar reminders are imported files. Do not describe them as APNs push notifications.
- App Store Connect availability was saved as 173 countries/regions, excluding China mainland and Vietnam because the required game approvals are not supplied. Evidence: `reports/2026-10-15/app-review/evidence/apple-173-regions-saved.jpg`.
- The same English game features are implemented across regions where the app is distributed. Region/country filters are player choices, not geographic feature gates. Storefront availability is a separate App Store Connect setting.

### User-generated content and deletion

UGC is the optional public leaderboard name and optional country, not chat or image uploads. Names have server-side format/profanity checks. Other publishers can be reported and blocked from the leaderboard and shared-result pages. Blocking hides that publisher on the current browser/device; moderation can hide a name or ban an abusive publisher. The owner-only administration page shows reported names and moderation actions, including reports referring to older runs. Support: **countrivo@gmail.com**.

The active fix also makes a blocked publisher's direct shared-result link unavailable to that viewer. Own result pages do not offer self-report controls. **Verify the fixes are deployed and actually work on the recorded device before presenting this as demonstrated behaviour.** Do not create fake human activity to populate a recording.

Privacy → **Forget this device** removes its saved runs/public names and clears Countrivo cookies. This is device-data deletion, not account deletion. The privacy policy explains any abuse-prevention identifiers retained for moderation. Historical accounts from the former site are handled by support; there is no current account-registration or login flow to demonstrate.

### Services, data, AI and rights

- **Vercel:** live Next.js website hosting, aggregate web analytics and performance measurements.
- **Supabase:** server-side game sessions/results, optional published names, leaderboard and moderation data. Current play uses anonymous device identity, not Supabase account login.
- **Capacitor 8 / WKWebView:** iOS shell loads `https://countrivo.com`; the live website and backend must be available. Native bootstrap implements haptics, splash/status-bar integration, network/offline handling and same-origin game-link handling. Boards/moves require a connection; the offline screen does not offer offline gameplay.
- No payment provider, advertising SDK or runtime generative-AI service supports play. Some static clay illustrations were generated during asset production. Player guesses/names are not sent to a generative-AI service by the game.
- Statistics and reference years: `https://countrivo.com/sources`. Portrait source/author/licence entries, flag-icon MIT notice and generated-art disclosure: `https://countrivo.com/credits`.
- Portraits include public-domain, Creative Commons and source-specific permissions; retain individual licence/attribution/ShareAlike requirements. Do not claim all third-party material is owned by Countrivo.
- Erode: the official ITF Free Font License is saved at `src/fonts/LICENSE-Erode.txt`; the installed font matches the official distribution hash. SIPRI military-expenditure values and their ranking are withheld pending source-specific permission. A maintenance script removes the current values, the refresh script cannot restore them, and the active game generators do not use that metric. Source licences and per-image attribution remain visible; this is not a blanket claim of ownership or endorsement. Evidence: `reports/2026-10-15/app-review/rights-evidence.json`.

The app is a general-interest game, not a regulated advice service. This does not remove the need to verify third-party content rights.

## Required physical-device recording and verification

At inspection, the only paired physical device was **Adam's iPhone (iPhone 13)**, unavailable to CoreDevice. Its cached OS was 26.6.1, not proof of its current or latest OS. An installed Countrivo build could not be verified. No prior Countrivo recording was found in the project evidence. Simulator/browser tests do not satisfy Apple's explicit physical-device request.

- [ ] Connect and unlock the physical iPhone; trust this Mac if requested. Verify its installed OS against the latest released compatible OS; record actual device/OS/build details without guessing.
- [ ] Install/open the **App Store Connect attached build 1.0 (2)** through TestFlight, or explicitly identify any newer build and attach that build to the version before resubmission. A development build must not silently stand in for the submitted binary.
- [ ] Enable device screen recording, start on the Home Screen, and visibly launch Countrivo. Hide personal notifications; do not include passwords or unrelated private data.
- [ ] Show home → Country Draft → actual country/person/role choices → post-choice feedback → complete result → sharing options. If today's daily is already finished, demonstrate a fresh practice board and identify it as practice.
- [ ] Show GeoWordle guesses and map/distance/direction feedback, plus an optional bonus round if solved. Briefly show the other games and the practice entry point.
- [ ] Show the optional name-publication path. With a genuine other published name, demonstrate report and block, confirm disappearance and a blocked direct link, then show unblock controls. Do not submit a false abuse report or seed undisclosed fake players; use a clearly identified test entry for any controlled moderation test.
- [ ] Show Privacy → Forget this device, and explain there are no account or payment screens because those features are absent. Verify deletion with a device intended for testing.
- [ ] Check safe areas, keyboard, scrolling, buttons, haptics and recovery after a connection interruption. State only results actually observed; haptics cannot be proved by silent screen pixels alone.
- [ ] Keep the original unaltered recording. Watch it end to end, confirm it begins at launch, then attach the real file or an accessible reviewer link. Record device model, OS, app version/build, duration and relevant timestamps beside the evidence.
- [ ] Resolve the rights/licence questions and account-holder agreement gate. Finalise the six answers, save Review Notes, send the response with the recording, and resubmit only when the actual App Store Connect state permits it.
- [ ] Capture the resulting submission status. Do not report approval, resubmission or a successful physical test before it has happened.

## Build and source references

Current project settings: automatic signing, team `88J7VD74DB`, version 1.0/build 2, iOS deployment target 15.0, iPhone and iPad device families. Xcode 27.0 is installed at `/Applications/Xcode.app`; the archived build used `iphoneos27.0`.

Archive: `~/Library/Developer/Xcode/Archives/2026-10-14/App 14-10-26, 12.05 AM.xcarchive` (the actual filename contains a narrow no-break space before AM). Use the archive in Organizer rather than retyping a guessed filename.

The global developer-directory selection points to Command Line Tools. For a local CLI check use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -version`; do not change global Xcode selection unnecessarily. If native changes require a new binary, sync Capacitor, increment the build above 2, archive/validate/upload, and select the new build in App Store Connect. A web deployment alone does not upload a new iOS binary.

- Configuration: `capacitor.config.ts`, `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist`.
- Privacy manifest: `ios/App/App/PrivacyInfo.xcprivacy`. App Store Connect's seven declared types were checked by the coordinator against this manifest: Name, User ID, Device ID, Coarse Location, Gameplay Content, Product Interaction and Performance Data. None is tracking. Preserve the reviewed linkage/purpose settings; do not replace them with the obsolete email/account labels.
- Native code: `src/lib/native/bootstrap.ts`, `src/features/auth/native-bootstrap.tsx`, `capacitor/www/offline.html`.
- Moderation: `src/features/social/report-name.tsx`, `src/features/social/run-page.tsx`, `src/server/anonymous-runs.ts`, `src/app/(app)/admin/page.tsx`.
- Known native wiring gap: `Main.storyboard` currently names `CAPBridgeViewController`, not the existing `MainViewController` subclass; do not claim that subclass's scroll-bounce or edge-swipe changes are active.
- Existing `resources/app-store-current/iphone-*.png` and `ipad-*.png` screenshots predate the latest gameplay rework. Check them against the current app before reusing them.
