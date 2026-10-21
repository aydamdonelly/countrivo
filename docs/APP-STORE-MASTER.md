# Countrivo App Review working packet

Checked locally on 2026-10-21. This is a preparation packet, not a claim that the app is currently ready, resubmitted or approved. Response draft: [APP-STORE-SUBMISSION.txt](APP-STORE-SUBMISSION.txt). Source-specific rights appendix: [APP-STORE-RIGHTS.txt](APP-STORE-RIGHTS.txt).

## Verified history and present access

- **21 October, current App Store Connect check by the coordinator:** the earlier submission remains **Rejected — Guideline 2.1, Information Needed**, with the same six-question request preserved in the 15 October screenshot. Replacement **1.0 (3)** has since processed as **Ready to Submit**, been selected for this version and saved. Build UUID: `bd23badf-1210-4df1-857f-cb1643629b12`. This does not mean a new review was submitted. The evidence does not establish a separate design/minimum-functionality rejection.
- Historically submitted **1.0 (2)**; current saved replacement **1.0 (3)**; bundle **com.countrivo.app**; App ID **6782594305**; listing **Countrivo: Daily Geography**.
- Submission dated 14 October 2026 at 00:23 as displayed in App Store Connect; ID `f4cab4b2-751c-4180-a735-7d7e5538bcbe`.
- Exact request: `reports/2026-10-15/app-review/evidence/apple-2-1-information-needed.jpg`. Historical status: `reports/2026-10-15/app-review/status.json`. Upload/submission proof: `resources/app-store-current/xcode-upload.jpg` and `asc-submitted.jpg`.
- **21 October:** Chrome SSO was restored through the Developer account, and the coordinator read the current review message and selected build. No dedicated App Store Connect API credentials were found in the configured environment or standard key directories; browser access does not repair Xcode signing credentials. APNs/Sign in with Apple keys are not App Store Connect API credentials.
- **21 October:** current **3,721-character Review Notes** were saved and verified by the coordinator. They identify uploaded, processed and selected build 3, while explicitly retaining the missing physical-device video. The earlier 3,556-character pending notes are superseded. Saving Review Notes is not a reply to Apple or a resubmission.
- **21 October:** build 3 was assigned to the existing one-tester **Owner device review** TestFlight group; **What to Test** was saved. Assignment does not prove invitation receipt, installation or device testing.
- **21 October:** `Countrivo-Licences-2026-10-21.zip` was uploaded and its attachment persisted in App Store Connect. Local source: `reports/2026-10-21/app-review/ready/Countrivo-Licences-2026-10-21.zip`.
- **21 October:** the paired physical iPhone 13 remains unavailable. A fresh read-only USB check with both `system_profiler SPUSBHostDataType` and `ioreg IOUSB` found no iPhone/iPad device. Its cached iOS 26.6.1 is not evidence of the present installed OS. Last local verification on 16 October found Countrivo 1.0 (2) installed; its distribution source was not independently established.
- No genuine physical-device recording has been found or produced. No new review reply, resubmission or approval is claimed. **The latest native build 1.0 (3) has been uploaded, processed and selected**, as documented below; these steps are separate from review submission.
- **21 October:** after the user explicitly approved the exact LYL260 agreement issued 13 October, the coordinator accepted it in the live Apple dialog and verified server-side status **Accepted 21 October** after reloading. The pending-agreement gate is resolved; no broader standing authority to accept future agreements is implied.

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

## Public links and response readiness — checked 21 October

Read-only HTTP checks returned **200 without login** for [Support](https://countrivo.com/support), [Privacy](https://countrivo.com/privacy), [Picture credits](https://countrivo.com/credits), [Sources](https://countrivo.com/sources), [Imprint](https://countrivo.com/imprint) and the [flag copyright/MIT notice](https://countrivo.com/flags/LICENSE.txt). Support, privacy, sources and imprint use **countrivo@gmail.com**. Privacy and imprint identify Adam Kahirov at the same Berlin address. These are availability/content checks, not physical-app walkthroughs. ASC Support URL was verified as `https://countrivo.com/support`; the store preview privacy link is `https://countrivo.com/privacy`.

The public credits page lists **575 portrait records** with individual source/licence links and an explicit crop/resize/compression notice. This check did not revalidate every image's legal status. Natural Earth's own terms identify its maps as public domain; World Bank reuse remains subject to indicator-specific exceptions. SIPRI and coffee/beer/wine comparisons remain withheld. The freshly downloaded official Erode FFL matches the retained text byte for byte; the public flag licence matches its retained local notice. Exact checks and limits: `reports/2026-10-21/app-review/public-readiness.json`.

The six-answer text between `BEGIN REVIEW RESPONSE` and `END REVIEW RESPONSE` in the submission file is **3,453 characters before replacing video fields**. It is a final-response template for the replacement **1.0 (3)**, not the already-saved pending notes. Upload, processing and selection of build 3 are now verified. Before use, replace all physical-device/video fields, check the final Notes character count and recheck region/build facts. The rights ZIP is already persisted in App Store Connect; attach the genuine physical recording when available. A local filename alone is not an attachment. Do not copy internal gates into the reply, describe local simulator QA as physical testing, or say that a template was sent.

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
- [x] Replacement **1.0(3)** was distribution-prepared and uploaded through Xcode Organizer. Its exported App Store IPA was inspected and retains build3, the scene fix, eight privacy types, readable status bar and bounded splash fallback.
- [x] **1.0 (3)** processed as Ready to Submit, selected for the version and saved; assigned to the existing Owner device review TestFlight group with What to Test saved.
- [ ] Install that actual TestFlight build on the connected physical device, verify its OS/version/build and keep the exact installed identity in the recording sidecar.
- [ ] Start from Home Screen with personal notifications hidden and visibly launch Countrivo. Connected-device capture is available via QuickTime → File → New Movie Recording → camera selection → iPhone. [Apple recording instructions](https://support.apple.com/guide/quicktime-player/record-a-movie-qtp356b55534/mac).
- [ ] Home → Flag Quiz practice → complete all ten flags → score/explanation → visible daily leaderboard context marked unranked for this practice run. Identify practice explicitly; do not present the practice score as a ranked daily result. Then show Country Draft country/person/role and its post-choice explanation if useful.
- [ ] Show GeoWordle input/clues and optional bonus if solved; briefly show Pinpoint/other games and practice selection. Never manufacture success or game state for the recording.
- [ ] Open an existing completed daily result to show its actual saved score and own entry if one exists. Show optional daily name publication only on an eligible unpublished daily result. Do not create fictional named players or imply that a practice result qualifies. Show result sharing and one clearly labelled private test-feedback submission with its confirmation.
- [ ] With a clearly designated controlled test publisher, demonstrate Report/Block, disappearance/direct-link blocking and unblock. Do not send a false report against an unrelated real player. Demonstrate own-name removal where relevant.
- [ ] Show Privacy → Forget this device on a test device after the necessary footage. Explain that registration/login and payment screens do not exist.
- [ ] Check safe areas, scrolling, keyboard, native haptics, foreground/background and connection interruption/recovery. Silent video cannot establish haptic behaviour by itself.
- [ ] Watch the original recording end to end. Save model/OS/build, live deployment, duration and timestamps beside the unaltered original. Confirm the Apple attachment or reviewer link is accessible.

### Supplemental simulator evidence — not physical proof

The unchanged build 2 source compiled but **crashed on launch** under iOS27: UIKit requires the UIScene lifecycle for binaries linked against the latest SDK. This was reproduced, logged and corrected in local **build3** using a single storyboard-backed scene with Capacitor URL/activity forwarding. Official requirement: [UIKit scene migration](https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle).

Build3 launches into the actual Countrivo Home Screen; the screenshot was visually inspected, and the process remained alive. The StatusBar config now explicitly uses paper background and LIGHT (dark foreground); the regenerated config and final screenshot show a readable black clock/Wi-Fi/battery on paper, fixing the previous dark-on-black region. Final screenshot: `build3-statusbar-fixed.png`. Backgrounding to Settings and resuming retained the process and home state. Warm/cold URL delivery code is present, but the headless simulator's system “Open in Countrivo?” confirmation could not be accepted, so end-to-end deep-link validation is **not claimed**. The custom native bounce/edge-swipe subclass remains unwired and is not advertised.

Only the headless CLI/runtime is installed: **Simulator.app GUI is absent** at the Xcode application path. Native XCUITest can nevertheless exercise the installed simulator app. Root's `SIMULATOR-launch-only-1.0-2.mov` captures the failed build 2 attempt and is not a successful app demo.

A new **75.308-second supplemental simulator recording** now shows actual build 3 cold launch, Home → all ten Flag Quiz practice rounds → earned unranked result, the private feedback form without submission, GeoWordle practice input/feedback and Privacy. It used real native UI actions with no outcome/state injection, no daily attempts and no public names/report/feedback submissions. Key screenshots and sampled frames were visually inspected by the capture agent. It does **not** satisfy Apple's physical-device recording requirement or demonstrate report/block/deletion end to end. Video and exact limitations: `reports/2026-10-21/app-review/screenshot-harness/SIMULATOR-SUPPLEMENTAL-actual-practice-1.0-3-complete.mov` and `SIMULATOR-SUPPLEMENTAL-actual-practice-1.0-3-complete-outcome.json` in the same directory.

Build3 app: `/private/tmp/countrivo-app-review-build3-2026-10-21/Build/Products/Debug-iphonesimulator/App.app`. Original preparation metadata: `reports/2026-10-21/app-review/simulator-preparation.json`; crash/fix evidence: `scene-lifecycle-crash.json` in that directory; build3 screenshot: `build3-launch.png`. Root owns any recording. Suggested later physical script remains practice FlagQuiz10 → result/unranked board → actual daily/own entry if available → safe report/block → clearly labelled private feedback.

The authoritative current device archive is `reports/2026-10-21/app-review/Countrivo-1.0-3-launch-fix.xcarchive`. It includes the scene-lifecycle correction, paper StatusBar, eight privacy types and bounded 500ms automatic splash fallback. Independent native-service initialization is in the live website bootstrap. The earlier `Countrivo-1.0-3.xcarchive` and `Countrivo-1.0-3-final.xcarchive` predate the splash correction and remain historical evidence, not the upload source. Native metadata/signature checks passed; see `launch-fix-archive-verification.json`.

**Historical signing failure, now superseded:** the earlier CLI export failed with exit70, missing local iOS Distribution private key and invalid cached Xcode account metadata. Its `ExportOptions-AppStore.plist` and `app-store-export-3.log` are retained as evidence of that attempt, not a current upload blocker.

**Successful distribution/upload:** the owner completed reauthentication of the existing Apple Account in Xcode. Organizer then prepared and uploaded the latest **App 1.0(3)**. The actual success screen and archive status read **App upload complete / App 1.0(3)uploaded**; screenshot `xcode-build3-upload-complete.png` was visually inspected. No explicit certificate creation/rotation was requested or clicked. The exported package uses the existing exact-app Store profile and Apple Distribution certificate dated 21 June 2026, valid until 21 June 2027. Evidence: `xcode-build3-upload-status.json` and `uploaded-ipa-verification.json`.

A local copy of the successfully uploaded package is at `reports/2026-10-21/app-review/Countrivo-1.0-3-app-store/App.ipa` (7,303,109 bytes). Its embedded metadata was checked: **1.0(3)**, bundle **com.countrivo.app**, **8** privacy types, StatusBar **LIGHT/#fbfaf6/overlays false**, SplashScreen **launchAutoHide:true/launchShowDuration:500**. SHA-256: `6cd46c4280c50fb2ea7143558415a2e1c97b19b925582b97a9a32a3642ed6f8a`. The same folder includes Xcode's DistributionSummary, ExportOptions and Packaging log.

The coordinator has now verified processing as **Ready to Submit**, selected **build 3** and saved the version. This is App-Store-eligible distribution: exported options explicitly have `method=app-store-connect`, `destination=upload` and `testFlightInternalTestingOnly=false`. It is not a new review submission or approval. The real current-OS device walkthrough/recording remains required.

### Store screenshots and remaining native/web QA

Fourteen current, visually inspected native screenshots were prepared as opaque RGB8/sRGB JPEGs, seven iPhone and seven iPad: `reports/2026-10-21/app-review/listing-upload-ready/manifest-complete.json`. **All fourteen new JPEG uploads failed processing**, with `UPLOAD_COMPLETE` followed by `FAILED / INVALID_ASSET_FILE_FORMAT`. Three PNG controls also failed, including normal macOS file-picker selection: an original RGB8 PNG, a minimal RGB8 PNG and a **byte-identical previously accepted `iphone-home.png`**. Independent file-signature, dimensions, colour and alpha checks did not identify a format violation. These observations do not establish the cause or prove an Apple-wide incident. One additional minimal-PNG upload completed in a fresh Chrome-extension tab. Its placement was removed recoverably so it does not replace the valid inherited listing images; the separate Asset Library processing outcome remains **unconfirmed**.

As a recoverable fallback, the coordinator used a **fresh Chrome-extension tab** to restore existing accepted assets from Apple's Asset Library: **six large-iPhone and three iPad 13-inch images**, with actual visible thumbnails. The smaller-iPhone section shows **Using Existing Assets** with six images. Fresh page loads confirmed that all six iPhone and all three iPad images persisted. This restores valid earlier store images; it is not proof that the fourteen new screenshots were accepted or that all restored screenshots depict the newest UX. No assets were permanently deleted. Final suitability against the current app still needs review before submission.

Separate cold-start controls used the unchanged original build-3 simulator binary/config without data/cache deletion. After a simulator OS reboot, the **1179 × 2556 iPhone recovered** and showed the actual Home Screen; WebKit reported first meaningful paint at **4.661 seconds**. This is recovery with preserved simulator data, not a clean-install certification. The **2048 × 2732 iPad remained white after 20 seconds**, without a completed document load; its cause is unresolved and no blank screenshot was certified or uploaded. Evidence: `reports/2026-10-21/app-review/listing-alternate-size-controls/cold-start-isolation.json`.

A read-only Vercel check found **Bot Protection in Logging mode, zero Custom Rules**, system mitigation active and four challenge events involving anonymous WK user agents. No exact causal link to the blank iPad response was established; ordinary and WK-iPhone anonymous HTTP controls separately returned the actual game Home HTML. No security setting was changed. Do not label the failure a proven bot-blocking incident or claim fresh-install reliability is fully verified.

The iPad splash hang is fixed in uploaded build 3. The separate **iPad Home → GeoWordle/Pinpoint navigation issue** is resolved by web commit **3865012**, deployed at `https://countrivo-5ldch72bw-fizz-ai.vercel.app` and aliased to `https://countrivo.com`. Only those native map links use normal document navigation; browser SPA navigation remains intact. Build/lint/theme passed, along with 71 focused navigation checks. Actual native iPad Home → Practice was repeated twice per map game after cold launch: **4 tests, 0 failures**, with all four screenshots visually inspected. Evidence: `reports/2026-10-21/app-review/native-ipad-map-3865012-outcome.json`. These are simulator checks, not physical-device evidence or proof of every gameplay scenario.

### Final submission gates

- [x] iPad Home-to-map navigation repaired, web commit 3865012 deployed and native cold-launch route tests passed four times. Record this actual deployment alongside the future physical video.
- [x] Current Apple review history and 173-region availability checked on 21 October; replacement build 3 processed, selected and saved. Recheck mutable fields before submission.
- [x] Other User Content privacy declaration published and verified; eight types match local build3 manifests.
- [x] Current 3,721-character Review Notes saved/verified: uploaded, processed, selected build 3; physical evidence explicitly pending.
- [x] Rights ZIP uploaded and attachment persistence verified in App Store Connect.
- [x] Existing Xcode account reauthenticated by owner; latest build3 prepared/uploaded and App Store IPA exported using existing distribution material.
- [x] Processing, build-3 selection/save, Owner device review TestFlight assignment and What to Test verified.
- [ ] Confirm build 3 is installed on the actual physical device for recording.
- [x] Recover accepted existing store assets: six large-iPhone and three iPad images have visible thumbnails; smaller iPhone uses the existing six-image set. All nine images persisted after fresh page loads.
- [ ] Verify restored-image suitability and the fresh-tab minimal-PNG test outcome. The fourteen new screenshots remain rejected; resolve ingestion or retain a verified suitable fallback.
- [ ] Diagnose and retest the separate alternate-size iPad white-load case before claiming reliable first launch. Existing M5 map-navigation passes remain valid but do not close this distinct case.
- [x] Exact LYL260 agreement accepted after explicit user approval; Accepted 21 October verified on the server.
- [ ] Complete physical video, resolve the screenshot gate, replace the pending placeholders, save both Review Notes and the reply, attach accessible evidence and resubmit if the actual state permits it. Capture the resulting status; approval is not guaranteed.

## Reproducible native build references

Project: `ios/App/App.xcodeproj`, scheme `App`; automatic signing; team `88J7VD74DB`; current uploaded/processed/selected version 1.0/build 3; historical reviewed build 2; iOS minimum 15.0; iPhone/iPad families. Xcode27.0 is installed. Use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` per command; do not alter global Xcode selection.

Existing device archive: `~/Library/Developer/Xcode/Archives/2026-10-14/App 14-10-26, 12.05 AM.xcarchive` (actual filename has a narrow no-break space before AM). It is arm64/iphoneos27.0 and cannot be installed unchanged in Simulator.

The reproduced launch crash requires the new native build3 before release on iOS27. Build 3 is uploaded, processed and selected; install and record that exact build on the physical device. Build2 must not be resubmitted as though the native fix were included. A web deploy does not upload a binary. Avoid the obsolete APNs/account instructions in `SHIP-CHECKLIST.md`, `PUBLISH-NOW.md` and `SUPABASE-DEPLOY.md` as current product guidance.

## Current handoff record

The current machine-readable receipt is `reports/2026-10-21/app-review/ready/status.json`, updated after the restored iPhone and iPad listing checks. Apple screenshot support text is prepared locally in `ready/apple-screenshot-support-draft.txt` and has **not been sent**; its failed controls and restored fallback are documented. No authenticated HAR, session tokens or private signing material is part of that draft. Browser work must use **only the Chrome ChatGPT extension**, following the user's explicit correction; no further Orca browser/native-Chrome UI fallback is authorised. Old tabs can be unattached while a fresh `browser.tabs.new()` tab works. The user's question about cancelling the old stale Remove dialog is still pending; do not interpret that dialog as an authorised permanent deletion. The physical USB phone reconnection remains required. Nothing has been resubmitted without the physical recording.
