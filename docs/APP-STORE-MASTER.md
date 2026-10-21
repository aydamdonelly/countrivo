# Countrivo App Review working packet

Checked locally on 2026-10-21. This is a preparation packet, not a claim that the app is currently ready, resubmitted or approved. Response draft: [APP-STORE-SUBMISSION.txt](APP-STORE-SUBMISSION.txt).

## Verified history and present access

- **21 October, current App Store Connect check by the coordinator:** one review message, still **Rejected — Guideline 2.1, Information Needed**; selected build remains **1.0 (2)**. It is the same six-question request preserved in the 15 October screenshot. Apple requested more information because the developer account had limited App Review history. The evidence does not establish a separate design/minimum-functionality rejection.
- Submitted version **1.0 (2)**; bundle **com.countrivo.app**; App ID **6782594305**; listing **Countrivo: Daily Geography**.
- Submission dated 14 October 2026 at 00:23 as displayed in App Store Connect; ID `f4cab4b2-751c-4180-a735-7d7e5538bcbe`.
- Exact request: `reports/2026-10-15/app-review/evidence/apple-2-1-information-needed.jpg`. Historical status: `reports/2026-10-15/app-review/status.json`. Upload/submission proof: `resources/app-store-current/xcode-upload.jpg` and `asc-submitted.jpg`.
- **21 October:** Chrome SSO was restored through the Developer account, and the coordinator read the current review message and selected build. No dedicated App Store Connect API credentials were found in the configured environment or standard key directories; browser access does not repair Xcode signing credentials. APNs/Sign in with Apple keys are not App Store Connect API credentials.
- **21 October:** revised **3,556-character Review Notes** were saved, reloaded and verified as an exact match in App Store Connect. They explicitly identify selected build 2, local replacement build 3 and the missing physical-device video. Saving Review Notes is not a reply to Apple or a resubmission.
- **21 October:** the paired physical iPhone 13 is unavailable to CoreDevice. Its cached iOS 26.6.1 is not evidence of the present installed OS. Last local verification on 16 October found Countrivo 1.0 (2) installed; its distribution source was not independently established.
- No genuine physical-device recording has been found or produced. No new reply, resubmission, approval or native upload is claimed.
- **21 October:** the coordinator reverified the Developer banner: updated agreement still awaits account-holder acceptance, deadline 28 October. It has not been accepted. Do not accept a legal agreement on the owner's behalf.

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
- **21 October:** the coordinator verified **173 available storefronts**, with China mainland and Vietnam unavailable. The implemented English features are consistent across distributed regions; country/region filters are player choices.

Support: **countrivo@gmail.com**. Privacy: `https://countrivo.com/privacy`.

## Services, content and native capabilities

- **Vercel:** live Next.js hosting, web analytics and performance measurement.
- **Supabase:** server-authoritative sessions/moves/results, optional names, moderation and private feedback. Current play uses signed anonymous device identity, not account login.
- **Capacitor 8 / WKWebView:** loads `https://countrivo.com`. Native bootstrap integrates haptics, splash/status bar, network/offline status and same-origin/custom-scheme game links. Gameplay needs a connection; the local offline page is recovery UI, not offline gameplay.
- No runtime generative-AI service receives player input. Some static clay illustrations were AI-generated during production. No payment provider, ad SDK, Apple sign-in flow or active APNs reminder is part of current play.
- Data/source years: `/sources`. Individual portrait authors/licences, flag-icon MIT notice and generated-art disclosure: `/credits`. Erode's official ITF Free Font License is retained at `src/fonts/LICENSE-Erode.txt`. Restricted SIPRI values/rankings were withheld; evidence: `reports/2026-10-15/app-review/rights-evidence.json`. Do not claim blanket ownership or endorsement of third-party material.
- Known inactive native code: `MainViewController.swift` is not in the App target's Sources and the storyboard uses `CAPBridgeViewController`. Its bounce/edge-swipe changes must not be advertised as functioning. Legacy Sign in with Apple/APNs entitlements remain. The necessary build3 lifecycle fix leaves this separate inactive subclass unchanged.

## App Privacy updated for free-form feedback

The previous seven declarations predated private free-form feedback. **21 October:** the coordinator added and published **Other User Content**, linked to the user/device, not used for tracking, for **Analytics and App Functionality**. The live App Store Connect UI was checked and now shows eight types. Local build3 manifests contain the same new type and purposes.

Generic free-text feedback is not covered by Gameplay Content alone. The optional-disclosure exception is not assumed for the stored device-linked form. This mapping follows [Apple's App Privacy guidance](https://developer.apple.com/app-store/app-privacy-details/). Future changes must keep the policy, native manifest and App Store answers aligned; add Customer Support if a distinct support workflow warrants it.

## Recording plan and release checklist

### Required physical-device evidence — still blocked

- [ ] Reconnect/unlock/trust the physical iPhone. Verify real OS and selected app version/build. Apple's security-release page, checked **21 October**, lists iOS **27.0.1** for iPhone 11 and later; confirm again at recording time. Do not substitute a cached OS or simulator runtime. [Apple releases](https://support.apple.com/en-us/100100).
- [ ] Distribution-export/upload and select replacement **1.0 (3)**, then install that actual TestFlight build for recording. App Store Connect still selects 2; the local simulator and device archive3 are not an uploaded build. Keep exact build identity in the recording sidecar.
- [ ] Start from Home Screen with personal notifications hidden and visibly launch Countrivo. Connected-device capture is available via QuickTime → File → New Movie Recording → camera selection → iPhone. [Apple recording instructions](https://support.apple.com/guide/quicktime-player/record-a-movie-qtp356b55534/mac).
- [ ] Home → Flag Quiz practice → complete all ten flags → score/explanation → visible daily leaderboard context marked unranked for this practice run. Identify practice explicitly; do not present the practice score as a ranked daily result. Then show Country Draft country/person/role and its post-choice explanation if useful.
- [ ] Show GeoWordle input/clues and optional bonus if solved; briefly show Pinpoint/other games and practice selection. Never manufacture success or game state for the recording.
- [ ] Open an existing completed daily result to show its actual saved score and own entry if one exists. Show optional daily name publication only on an eligible unpublished daily result. Do not create fictional named players or imply that a practice result qualifies. Show result sharing and one clearly labelled private test-feedback submission with its confirmation.
- [ ] With a clearly designated controlled test publisher, demonstrate Report/Block, disappearance/direct-link blocking and unblock. Do not send a false report against an unrelated real player. Demonstrate own-name removal where relevant.
- [ ] Show Privacy → Forget this device on a test device after the necessary footage. Explain that registration/login and payment screens do not exist.
- [ ] Check safe areas, scrolling, keyboard, native haptics, foreground/background and connection interruption/recovery. Silent video cannot establish haptic behaviour by itself.
- [ ] Watch the original recording end to end. Save model/OS/build, live deployment, duration and timestamps beside the unaltered original. Confirm the Apple attachment or reviewer link is accessible.

### Supplemental simulator evidence — not physical proof

The unchanged build2 source compiled but **crashed on launch** under iOS27: UIKit requires the UIScene lifecycle for binaries linked against the latest SDK. This was reproduced, logged and corrected in local **build3** using a single storyboard-backed scene with Capacitor URL/activity forwarding. Official requirement: [UIKit scene migration](https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle).

Build3 launches into the actual Countrivo Home Screen; the screenshot was visually inspected, and the process remained alive. The StatusBar config now explicitly uses paper background and LIGHT (dark foreground); the regenerated config and final screenshot show a readable black clock/Wi-Fi/battery on paper, fixing the previous dark-on-black region. Final screenshot: `build3-statusbar-fixed.png`. Backgrounding to Settings and resuming retained the process and home state. Warm/cold URL delivery code is present, but the headless simulator's system “Open in Countrivo?” confirmation could not be accepted, so end-to-end deep-link validation is **not claimed**. The custom native bounce/edge-swipe subclass remains unwired and is not advertised.

Only the headless CLI/runtime is installed: **Simulator.app GUI is absent** at the Xcode application path. There is no available native Simulator GUI walkthrough on this machine. Root's `SIMULATOR-launch-only-1.0-2.mov` captures the failed build2 attempt and is not a successful app demo. Any build3 headless launch clip must remain labelled supplemental simulator QA, never physical-device proof or a full gameplay walkthrough.

Build3 app: `/private/tmp/countrivo-app-review-build3-2026-10-21/Build/Products/Debug-iphonesimulator/App.app`. Original preparation metadata: `reports/2026-10-21/app-review/simulator-preparation.json`; crash/fix evidence: `scene-lifecycle-crash.json` in that directory; build3 screenshot: `build3-launch.png`. Root owns any recording. Suggested later physical script remains practice FlagQuiz10 → result/unranked board → actual daily/own entry if available → safe report/block → clearly labelled private feedback.

The final signed arm64 device archive3, including the status-bar correction, was produced at `reports/2026-10-21/app-review/Countrivo-1.0-3-final.xcarchive`. The earlier `Countrivo-1.0-3.xcarchive` is retained as pre-polish evidence. It uses the existing **Apple Development** identity; code signature verification passes. The signature check passed, but the **App Store Connect distribution export of the earlier build3 archive failed (exit70)**: `No signing certificate "iOS Distribution" found` with a private key for this team. Xcode also reported invalid cached account credentials with `missing Xcode-Username`. No IPA was created, no Apple validation completed and no upload occurred. The attempt omitted `-allowProvisioningUpdates` and created no new certificate, account, agreement or provisioning access. Reproducible options/log: `reports/2026-10-21/app-review/ExportOptions-AppStore.plist` and `app-store-export-3.log`.

### Final submission gates

- [ ] Deploy and verify the intended website; record its actual deployment/commit alongside video.
- [x] Current Apple review/status, selected build 2, pending agreement and 173-region availability checked on 21 October. Recheck if they change before submission.
- [x] Other User Content privacy declaration published and verified; eight types match local build3 manifests.
- [x] Revised 3,556-character Review Notes saved and reloaded; explicitly pending physical evidence and replacement build3.
- [ ] Restore valid Xcode signing/account state and an existing appropriate distribution certificate/profile through the owner; current local export cannot produce an App Store IPA. No new credential/certificate action has been authorised for this preparation.
- [ ] Verify policy/rights links and screenshots against the actual recorded app. Existing `resources/app-store-current/iphone-*`/`ipad-*` screenshots predate the latest UX.
- [ ] Resolve any account-holder agreement requirement through the owner.
- [ ] Complete physical video, replace the pending placeholders, save both Review Notes and the reply, attach accessible evidence and resubmit if the actual state permits it. Capture the resulting status; approval is not guaranteed.

## Reproducible native build references

Project: `ios/App/App.xcodeproj`, scheme `App`; automatic signing; team `88J7VD74DB`; version 1.0/build 3 locally; submitted build remains 2 until changed in ASC; iOS minimum 15.0; iPhone/iPad families. Xcode27.0 is installed. Use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` per command; do not alter global Xcode selection.

Existing device archive: `~/Library/Developer/Xcode/Archives/2026-10-14/App 14-10-26, 12.05 AM.xcarchive` (actual filename has a narrow no-break space before AM). It is arm64/iphoneos27.0 and cannot be installed unchanged in Simulator.

The reproduced launch crash requires the new native build3 before release on iOS27. Upload/select build3 after distribution validation and access restoration; record that exact build on the physical device. Build2 must not be resubmitted as though the native fix were included. A web deploy does not upload a binary. Avoid the obsolete APNs/account instructions in `SHIP-CHECKLIST.md`, `PUBLISH-NOW.md` and `SUPABASE-DEPLOY.md` as current product guidance.
