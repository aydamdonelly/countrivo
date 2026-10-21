# Countrivo App Review working packet

Checked locally on 2026-10-21. This is a preparation packet, not a claim that the app is currently ready, resubmitted or approved. Response draft: [APP-STORE-SUBMISSION.txt](APP-STORE-SUBMISSION.txt).

## Verified history and present access

- Last independently captured App Store Connect status: **Rejected — Guideline 2.1, Information Needed**, checked 16 October 2026 at 18:35 UTC. Apple requested more information because the developer account had limited App Review history. The evidence does not establish a separate design/minimum-functionality rejection.
- Submitted version **1.0 (2)**; bundle **com.countrivo.app**; App ID **6782594305**; listing **Countrivo: Daily Geography**.
- Submission dated 14 October 2026 at 00:23 as displayed in App Store Connect; ID `f4cab4b2-751c-4180-a735-7d7e5538bcbe`.
- Exact request: `reports/2026-10-15/app-review/evidence/apple-2-1-information-needed.jpg`. Historical status: `reports/2026-10-15/app-review/status.json`. Upload/submission proof: `resources/app-store-current/xcode-upload.jpg` and `asc-submitted.jpg`.
- **21 October:** Chrome redirects App Store Connect to an empty login form. The current Apple review status cannot be verified. No dedicated App Store Connect API credentials were found in the configured environment or standard key directories. APNs/Sign in with Apple keys are not App Store Connect API credentials.
- **21 October:** the paired physical iPhone 13 is unavailable to CoreDevice. Its cached iOS 26.6.1 is not evidence of the present installed OS. Last local verification on 16 October found Countrivo 1.0 (2) installed; its distribution source was not independently established.
- No genuine physical-device recording has been found or produced. No new reply, resubmission, approval or native upload is claimed.
- An updated Apple Developer agreement was awaiting account-holder acceptance when last verified on **16 October**. Its current state is unverified. Do not describe it as accepted or accept a legal agreement on the owner's behalf.

## Apple's six requested items

1. A screen recording captured on a **physical device with the latest OS**, beginning with launch and showing typical use. Include account registration/login/deletion, UGC reporting/blocking and paid access **if present**.
2. Purpose, target audience, problem solved and value.
3. Setup/access instructions for main features, with any required credentials or sample files.
4. External services, tools and platforms supporting core functionality, including data, authentication, payments and AI.
5. Regional differences, or confirmation of consistent features across regions.
6. Relevant authorisation documents for regulated services or protected third-party material.

Apple asks for the answers in both the review conversation and App Review Information Notes. Keep the response consistent with the actual selected build and deployed website. [Official reply/attachment instructions](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages/).

## Current product facts to verify in the app

Countrivo is a free geography and history game collection for short daily puzzles and practice. **Six daily games:** Country Draft, GeoWordle, Pinpoint, Flag Quiz, Higher or Lower and Stat Guesser. **Blind Pick and Speed Flags are practice-only**; daily games also offer practice.

- No registration/login, subscription, in-app purchase, paid features or advertising. No demo account, credentials or sample files are required.
- Country Draft: five rounds; choose one of three countries, one of its people and an unused cabinet role. Points and career-based/editorial fit explanations appear after appointment. Region/era bonuses and the cabinet result explain the final score.
- GeoWordle: six country guesses with distance, direction and map feedback. Solving opens optional neighbours/capital rounds. Pinpoint reveals the correct country and your pin after commitment.
- The result includes the relevant leaderboard and optional name-publication action, then sharing/practice/next-game choices. A name and optional country are public only after publication; a saved device score alone is private.
- Public publishers can be reported/blocked from the leaderboard, in-result standings and shared-result pages where the controls are available. Format/profanity checks run server-side. Blocked publishers are hidden for that viewer, including direct shared-result access; own results do not offer self-report controls. Verify this on the recorded device rather than relying only on source/tests.
- **New private feedback:** the footer and game/result forms accept an optional 5–1,500-character message about a game or the whole site. The message is stored privately in Supabase with the existing pseudonymous device ID, game/context and timestamp. No email/name is requested by this form. It is not a public post or player-to-player chat. Server validation, duplicate-safe submissions and device rate limits apply.
- Privacy → **Forget this device** removes its saved runs/public names, private feedback and associated device data covered by the deletion action, and clears Countrivo cookies. Abuse-prevention bans may remain as explained by the privacy policy. There are no current accounts to delete; historical account requests go through support.
- Daily boards reset at midnight Europe/Berlin. Practice does not publish a daily score. Optional reminders are calendar files, not APNs push notifications.
- Last saved storefront availability was 173 regions, excluding China mainland and Vietnam; that setting must be reconfirmed after login. The implemented English features are consistent across distributed regions; country/region filters are player choices.

Support: **countrivo@gmail.com**. Privacy: `https://countrivo.com/privacy`.

## Services, content and native capabilities

- **Vercel:** live Next.js hosting, web analytics and performance measurement.
- **Supabase:** server-authoritative sessions/moves/results, optional names, moderation and private feedback. Current play uses signed anonymous device identity, not account login.
- **Capacitor 8 / WKWebView:** loads `https://countrivo.com`. Native bootstrap integrates haptics, splash/status bar, network/offline status and same-origin/custom-scheme game links. Gameplay needs a connection; the local offline page is recovery UI, not offline gameplay.
- No runtime generative-AI service receives player input. Some static clay illustrations were AI-generated during production. No payment provider, ad SDK, Apple sign-in flow or active APNs reminder is part of current play.
- Data/source years: `/sources`. Individual portrait authors/licences, flag-icon MIT notice and generated-art disclosure: `/credits`. Erode's official ITF Free Font License is retained at `src/fonts/LICENSE-Erode.txt`. Restricted SIPRI values/rankings were withheld; evidence: `reports/2026-10-15/app-review/rights-evidence.json`. Do not claim blanket ownership or endorsement of third-party material.
- Known inactive native code: `MainViewController.swift` is not in the App target's Sources and the storyboard uses `CAPBridgeViewController`. Its bounce/edge-swipe changes must not be advertised as functioning. Legacy Sign in with Apple/APNs entitlements remain. No native changes were made for this preparation.

## App Privacy update required for free-form feedback

The previous seven declarations were checked on 15–16 October. They predate private free-form feedback. Apple's guidance assigns generic free-text fields to **Other User Content**; Gameplay Content covers game saves/logic and is not a substitute. The optional-disclosure exception is not assumed: this form does not meet every stated condition and stores a device-linked message. [Apple App Privacy guidance](https://developer.apple.com/app-store/app-privacy-details/).

Before resubmission, add/review **Other User Content**, **linked to the user/device**, **not used for tracking**. Match purposes to actual use: App Functionality for support/bug handling, Analytics for evaluating features/planning improvements. Add Customer Support if a distinct support-request workflow warrants that category. Reconcile the native manifest at the next native archive. Privacy responses can be updated without a binary release. **No App Store Connect declaration was changed on 21 October.**

## Recording plan and release checklist

### Required physical-device evidence — still blocked

- [ ] Reconnect/unlock/trust the physical iPhone. Verify real OS and selected app version/build. Apple's security-release page currently lists iOS **27.0.1** for iPhone 11 and later; confirm again at recording time. Do not substitute a cached OS or simulator runtime. [Apple releases](https://support.apple.com/en-us/100100).
- [ ] Open the selected **App Store Connect build 1.0 (2)** via TestFlight, or explicitly upload/select a newer build if native code changes. Keep exact build identity in the recording sidecar.
- [ ] Start from Home Screen with personal notifications hidden and visibly launch Countrivo. Connected-device capture is available via QuickTime → File → New Movie Recording → camera selection → iPhone. [Apple recording instructions](https://support.apple.com/guide/quicktime-player/record-a-movie-qtp356b55534/mac).
- [ ] Home → Flag Quiz practice → complete all ten flags → score/explanation → visible daily leaderboard context marked unranked for this practice run. Identify practice explicitly; do not present the practice score as a ranked daily result. Then show Country Draft country/person/role and its post-choice explanation if useful.
- [ ] Show GeoWordle input/clues and optional bonus if solved; briefly show Pinpoint/other games and practice selection. Never manufacture success or game state for the recording.
- [ ] Open an existing completed daily result to show its actual saved score and own entry if one exists. Show optional daily name publication only on an eligible unpublished daily result. Do not create fictional named players or imply that a practice result qualifies. Show result sharing and one clearly labelled private test-feedback submission with its confirmation.
- [ ] With a clearly designated controlled test publisher, demonstrate Report/Block, disappearance/direct-link blocking and unblock. Do not send a false report against an unrelated real player. Demonstrate own-name removal where relevant.
- [ ] Show Privacy → Forget this device on a test device after the necessary footage. Explain that registration/login and payment screens do not exist.
- [ ] Check safe areas, scrolling, keyboard, native haptics, foreground/background and connection interruption/recovery. Silent video cannot establish haptic behaviour by itself.
- [ ] Watch the original recording end to end. Save model/OS/build, live deployment, duration and timestamps beside the unaltered original. Confirm the Apple attachment or reviewer link is accessible.

### Supplemental simulator evidence — not physical proof

A simulator-equivalent Debug build of the unchanged current **1.0 (2)** native sources is prepared in task-specific DerivedData. It loads the live website and can provide a truthful supplemental demonstration. It is not the uploaded App Store binary, is not a physical-device recording and does not establish iOS 27.0.1 testing. Use a separate filename/sidecar explicitly labelled **SIMULATOR**. Do not claim it satisfies Apple's point 1.

The runtime is booted headlessly. The installed Xcode tools do not include the standard `Simulator.app` GUI, and opening it through Computer Use failed. Compilation/installation therefore does not establish an interactive native walkthrough. A CLI launch capture, if made, proves only that limited simulated launch; the complete physical-device flow remains pending.

Build/install details and outcome: `reports/2026-10-21/app-review/simulator-preparation.json`; build log: `simulator-build.log` in that directory. Root owns actual UI walkthrough and recording. Suggested supplemental QA script: start recording at the simulated Home Screen, launch Countrivo; complete ten practice Flag Quiz answers; show the result and unranked daily-board context; open an actual existing daily result/own entry if available; open report controls without filing false abuse, and block/unblock a controlled publisher only if available; send clearly labelled private test feedback. If a required precondition is absent, show or state that limit rather than inventing data.

### Final submission gates

- [ ] Deploy and verify the intended website; record its actual deployment/commit alongside video.
- [ ] Restore App Store Connect login and read the **current** message/status, selected build, agreement state and availability. Do not assume the historical request is unchanged.
- [ ] Update privacy declarations for feedback, verify policy and rights/source links, and check screenshots against the current app. Existing `resources/app-store-current/iphone-*`/`ipad-*` screenshots predate the latest UX.
- [ ] Resolve any account-holder agreement requirement through the owner.
- [ ] Complete physical video, replace the pending placeholders, save both Review Notes and the reply, attach accessible evidence and resubmit if the actual state permits it. Capture the resulting status; approval is not guaranteed.

## Reproducible native build references

Project: `ios/App/App.xcodeproj`, scheme `App`; automatic signing; team `88J7VD74DB`; version 1.0/build 2; iOS minimum 15.0; iPhone/iPad families. Xcode27.0 is installed. Use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` per command; do not alter global Xcode selection.

Existing device archive: `~/Library/Developer/Xcode/Archives/2026-10-14/App 14-10-26, 12.05 AM.xcarchive` (actual filename has a narrow no-break space before AM). It is arm64/iphoneos27.0 and cannot be installed unchanged in Simulator.

A new native binary is unnecessary solely for supplying the requested information. If native fixes are made, increment above build 2, sync/archive/validate/upload and select the new build; record that build. A web deploy does not upload a binary. Avoid the obsolete APNs/account instructions in `SHIP-CHECKLIST.md`, `PUBLISH-NOW.md` and `SUPABASE-DEPLOY.md` as current product guidance.
