# iOS App Store build status — 20 November 2026

## iOS 27 startup crash fix — 23 November 2026

- TestFlight feedback is for production `1.5.3 (1)` on iPhone `iPhone15,3`
  running iOS `27.2`. The crash is a main-thread UIKit `EXC_BREAKPOINT` in
  `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`, during scene
  creation before normal app startup.
- Build 1 source is commit `ca0b8a71bcb1042eeb72c37efe2a1ec8d9b372fc`, from
  signed IPA workflow run `44677398356`; upload run `44680151196` used that
  artifact. Build 7 source is `12bf36af9ec8c51e681c6e231925708f5e59e304`,
  from signed IPA run `44968254759`, uploaded by run `44970195597`. Build 7's
  changes only address keyboard layout and do not add scene lifecycle support.
- The iOS-only config plugin `plugins/withIosSceneLifecycle.js` adds a scene
  manifest and scene-owned React Native window startup, forwards URL, universal
  link, quick-action, and app lifecycle callbacks, and leaves Android source
  untouched. The signed workflow now checks that the generated scene manifest
  and delegate are present. The next candidate is `1.5.3 (8)`.
- Source change only. No iOS build, upload, or physical-device verification
  was performed. Confirm build 8 starts on iOS 27.2 and retest cold-start deep
  links, universal links, quick actions, foreground/background transitions,
  and an older supported iOS version before calling the fix verified.

## Workspace sheet and keyboard overlap — 23 November 2026

- The mobile workspace picker is a custom animated overlay in the same React
  Native window as the chat screen. Opening it while the iOS keyboard is
  visible previously started the sheet animation immediately, leaving the
  sheet visible beneath the keyboard as it moved.
- The iOS workspace-picker action now dismisses the keyboard and waits for
  `keyboardDidHide` before showing the sheet. Android keeps its existing path.
- Source change only; no build or device verification was performed. Confirm
  the keyboard fully closes before the sheet animates in on an iPhone.

## Simple Chat keyboard and one-tap sheet follow-up — 23 November 2026

- The owner's screenshots show the inline GitHub archive document preview and
  Simple Chat's six-action toolbar consuming space while the iOS keyboard is
  open. Build 7's Simple Chat route still passed `keyboardVerticalOffset=0`
  despite sitting below the adaptive safe area and mobile header. React Native
  requires the route's screen-top offset; Agent Chat already measures this.
- The main message list used `keyboardShouldPersistTaps="never"`, which
  consumes the first tap on an interactive child to dismiss the keyboard. It
  now uses `handled`, so message options and other handled controls can respond
  on the first press while tapping blank list space still dismisses the IME.
- Simple Chat now measures its stable outer route frame with `measureInWindow`
  and passes that value to iOS `KeyboardAvoidingView`. The archive preview
  collapses while typing, the edit field is shorter, and the expanded layout
  returns only after `keyboardDidHide`. This does not reuse the failed guessed
  keyboard-height or mismatched screen/window-coordinate calculations.
- Workspace sheet open waits for the keyboard's completed hide event, prevents
  duplicate pending opens, and checks the native keyboard state. Workspace
  selection now avoids duplicate route replacements from tap plus pager events,
  dismisses after selection, and sizes to the available window.
- Source-only candidate. No build, upload, or device verification was made.
  On the next signed build, check the archived-document and empty-chat screens
  with QuickType visible/hidden, first-tap workspace and toolbar actions,
  keyboard show/hide, and compact/landscape layouts.

## Build 8 prebuild correction — 23 November 2026

- Signed workflow run `45142334512` failed during Expo prebuild before
  CocoaPods or Xcode. The concrete error was that the existing Quick Actions
  plugin could not find the legacy React Native startup call, because the new
  scene plugin had already removed it. No IPA was created.
- Corrected Expo mod ordering so Quick Actions transforms the source before
  scene migration, then added cold-start quick-action routing through
  `UIScene.ConnectionOptions.shortcutItem`. The prebuild gate now checks the
  four Home Screen actions and both cold/warm quick-action paths are present.
- This is a failure-specific source correction, not an Xcode/signing retry.
  Build the exact new commit once, inspect the generated scene/shortcut config,
  and upload only the signed IPA from that successful run. Do not upload run
  `45142334512` because it contains no artifact.

## Build 8 Xcode archive correction — 23 November 2026

- Signed run `45143238275` passed Expo prebuild and CocoaPods, then Xcode failed
  compiling `AppDelegate.swift`: the generated delegate referenced
  `reactLaunchOptions` before declaration and assigned `.openInPlace` through
  `UIApplication.LaunchOptionsKey`. No IPA was exported or uploaded.
- The scene plugin now retains the original optional method launch options,
  removes the invalid launch-options key assignment, and marks a cold scene
  Quick Action as routed before the existing AppDelegate callback can duplicate
  it. The Quick Actions routing flag is module-internal for scene delegate use.
- These changes are source-only until a fresh signed run passes archive,
  export, and artifact inspection. Do not upload run `45143238275`.

## Build 8 signing-account blocker — 23 November 2026

- Signed run `45147356927` used commit
  `4d43eca41b2abdd1f2259c31eb1de1382e700ff6`. Prebuild, scene/Quick Actions
  assertions, and CocoaPods passed. Xcode stopped during signing because the
  Apple Developer account reached its certificate limit and no provisioning
  profiles matched the app or Share Extension. No IPA was exported or uploaded.
- GitHub has the App Store Connect API key but no reusable signing
  certificate/profile secret. A valid Apple Distribution certificate and
  private key must be provided to CI, or an unused certificate slot must be
  freed in the Apple Developer account. Do not repeat the run unchanged or
  revoke an unidentified certificate.

## Keyboard follow-up build 7 — 22 November 2026

- Build 6's keyboard layout was still reported as visually incorrect on iPhone:
  too much idle bottom spacing and QuickType overlapping the composer/send
  control. Agent Chat also needed a direct way to dismiss the keyboard.
- The iOS source used manual keyboard-height minus safe-area arithmetic while
  the composer separately added safe-area padding. Agent routes are nested below
  headers, so their keyboard overlap also needs a measured screen offset.
- Commit `12bf36a` replaces the iOS layout calculation with React Native
  `KeyboardAvoidingView` (`padding` behavior); Agent Chat measures its route
  position for `keyboardVerticalOffset`. The composer removes its bottom inset
  while the keyboard is open, reduces its resting inset, and Agent Chat adds an
  accessible dismiss button. The Android keyboard path remains the APK-tested
  explicit offset.
- Validation before native build: `yarn tsc --noEmit`, targeted ESLint, and
  `git diff --check` (with the repository's CRLF handling) passed. ESLint reports
  only existing BOM warnings. Commit is pushed to `main`; App Store build number
  is `1.5.3 (7)`.
- Signed IPA workflow run
  [44968254759](https://github.com/ssv-asia/localtest-temporary/actions/runs/44968254759)
  passed archive, signing, export, validation, and artifact upload. The exact
  IPA upload workflow run
  [44970195597](https://github.com/ssv-asia/localtest-temporary/actions/runs/44970195597)
  returned `UPLOAD SUCCEEDED` with zero warnings (delivery UUID
  `e592bd3f-9dba-408e-99ba-5ee126e25a7d`). Apple processing is pending; install
  it from TestFlight after processing completes. Physical iPhone verification
  is required before calling the keyboard fix confirmed or submitting this
  candidate for public App Review. See `IOS-APK-PARITY-HANDOFF.md` for the
  device checklist.

> **Current-state update:** Older checklist entries in this file are a dated
> activity log and are superseded by the “Current release candidate audit” at
> the end. The live target is `ssv-asia/localtest-temporary` at
> `C:\expert-ai-ios-localtest-temporary`; App Store Connect signing credentials
> are confirmed by successful signed/upload workflow runs later in this log.

## Keyboard correction after build 5 — 22 November 2026

- The owner confirmed build 5 is present in internal TestFlight but still has
  composer overlap in Simple Chat and extra bottom spacing when the keyboard
  closes. Agent Chat must be checked as a separate composer path.
- Source cause in Simple Chat: iOS used `keyboardWillChangeFrame` and compared
  the keyboard's screen-coordinate `screenY` to the app-window height, and had
  no explicit iOS `keyboardWillHide` reset. This could miscalculate the lift
  and leave the composer in a stale inset state. The APK's tested path uses
  keyboard show/hide events and one safe-area adjustment.
- Agent Chat already had explicit show/hide listeners, but its parent started
  with the bottom safe-area inset while `PromptInput` also added bottom spacing.
  The iOS candidate now lets `PromptInput` own the resting safe area and keeps
  the parent offset at zero when the keyboard is hidden.
- Both Simple Chat and Agent Chat now use the APK-aligned keyboard-height
  calculation and explicit hide reset. Android source was not changed.
- Candidate build number is `1.5.3 (6)`. TypeScript passes; targeted ESLint has
  zero errors and one existing BOM warning in `PromptInput`. Device acceptance
  on an iPhone with QuickType enabled is still required; the upload is not yet
  complete.

## Current source and production identity

- Source/build repository for this release work: `ssv-asia/localtest-temporary`, `main`, in isolated checkout `C:\expert-ai-ios-localtest-temporary`. Android's organization repository remains reference-only.
- Production bundle ID: `com.ssvasia.expertai`; the old `com.local.expertai` test identity is not used by the production build workflows.
- Expo prebuild generates `ios/ExpertAI.xcodeproj`; `ios/ExpertAI.xcworkspace` appears after `pod install`. Open the workspace for CocoaPods builds, not the `.xcodeproj` directly.
- Expo prebuild was run with the production bundle, production APNs entitlement, the owner's updated Google iOS OAuth client ID, and `group.com.ssvasia.expertai`. It generated app ID `com.ssvasia.expertai` and share extension ID `com.ssvasia.expertai.share-extension`.
- The owner's Google iOS OAuth client ID is a public client identifier and is configured in the production workflow. The app config adds its reversed callback scheme. Device sign-in on the production bundle still needs acceptance testing.

## Work completed from the 20 November device notes

- **Trial start:** On iOS, the sign-in sheet now dismisses before the separate trial terms modal opens. Previously both native modals were presented at once, matching the reported unresponsive trial button. Android's flow is unchanged. Verify the full `/auth/trial` → `/auth/poll` and SecureStore flow on a device.
- **Daily-note editor keyboard:** While iOS keyboard is visible, the editor no longer keeps the bottom safe-area spacer beneath its formatting toolbar. `KeyboardAvoidingView` can position the toolbar directly above the keyboard. Android's inset path is unchanged. Verify on iPhone and iPad with prediction row and floating/split keyboards.
- **Daily note in chat:** iOS matches the APK request contract: the Gateway injects tool schemas server-side, and iOS executes a returned `daily_note` call against device-local notes before returning the result for the model's follow-up. The client sends no tool list and does not parse slash commands; `/note` remains Gateway-owned. Verify the deployed Gateway emits `daily_note` and test read/add/replace on device.
- **Android image generation:** Recorded as an Android-only report; no Android source or package was changed in this iOS task.

## Build paths

- `.github/workflows/ios-production-build.yml` builds an unsigned Release IPA for `com.ssvasia.expertai` on GitHub's `xcode-27` runner. It validates the production app and share extension IDs, APNs entitlement, app group, Google callback, arm64, iOS 16 minimum, and IPA ZIP integrity. This is a compile/package proof only; an unsigned IPA cannot be uploaded to App Store Connect.
- The first production run, `44652059778` on commit `5a60133`, used Xcode 27.1 and passed prebuild, dependency installation, and production identity checks. The native build stopped because older third-party Pods declared iOS 9–12.4, below Xcode 27's supported deployment-target range. A new iOS Podfile config plugin raises only pod targets below the app's iOS 16 minimum to 16.0. The corrected run and result are recorded below.
- `.github/workflows/ios-app-store-signed.yml` is the signed path. It uses Xcode automatic distribution signing authenticated through an App Store Connect team API key, then exports a signed App Store IPA. The App Store Connect key ID, issuer ID, and `.p8` private key are now stored as repository Actions secrets. Still add `APPLE_TEAM_ID` as an Actions variable and merge draft PR #1 so GitHub registers the manual signing workflow on `main`. Keep the private key in GitHub Secrets; never paste it into chat or commit it.
- With Xcode automatic signing, a separately hand-created Apple Distribution certificate and provisioning profile are not necessary for this workflow. Xcode manages distribution signing through the team API key. The App ID must have the capabilities used by the app: App Groups (`group.com.ssvasia.expertai`), Push Notifications, and Associated Domains (`applinks:ssv.asia`). The share-extension App ID/profile must also be provisioned.
- Remote notification delivery has a separate credential path from App Store signing: the Expo/EAS project must have an APNs authentication key configured, and the Gateway must submit the app's Expo push token to Expo Push Service. The app's `aps-environment` entitlement and local task reminders do not prove remote push delivery. See [Expo push notification setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) and [sending notifications with Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/).
- Local machine check: Xcode 15.2 / iOS 17.2 SDK, no signing identity installed, and no CocoaPods executable detected. This local toolchain cannot make the required current App Store archive. GitHub Xcode 27 is the build route.
- The signed workflow currently produces a signed IPA artifact for manual upload. It does not yet create an App Store Connect record, upload the IPA, configure TestFlight groups, or publish store metadata/assets.

## Release blockers still open

1. The App Store Connect team API key ID, issuer ID, and private-key secrets have been added to repository Actions secrets and their names verified (20 November 2026). Still add `APPLE_TEAM_ID` as an Actions variable, merge draft PR #1 so GitHub registers the signed workflow on `main`, then run it and verify the exported IPA signature and bundle IDs.
2. The owner reports enabling Sign in with Apple on the existing primary App ID `com.ssvasia.expertai`. Still confirm the production App ID capabilities and app group above are active in the same Apple Developer team; confirm the share-extension identifier is available to automatic signing and that the signing workflow has refreshed the profile.
3. Create/verify the App Store Connect app record for `com.ssvasia.expertai`, upload the signed IPA, and wait for processing before TestFlight testing.
4. **Sign in with Apple is in the release candidate now.** The owner reports enabling the capability on the existing primary `com.ssvasia.expertai` App ID. The iOS button uses a single-use Gateway nonce, Apple's native sign-in sheet, server-side ES256/issuer/audience/expiry/nonce verification, and the existing Expert AI session. The Gateway persists Apple's stable user subject for later sign-ins when Apple does not return email. A signed physical-device test and deployed Gateway auth route remain required. The optional Server-to-Server Notification Endpoint is intentionally blank because account-change notification handling is not implemented; it is separate from the App Store subscription notification route. See Apple's [current Login Services guideline](https://developer.apple.com/app-store/review/guidelines/#login-services).
5. StoreKit is integrated in the iOS candidate. The Gateway verifies App Store API transactions/status, binds each original transaction chain to one Expert AI account, and handles signed renew/refund notifications in the isolated Gateway candidate. It has not been deployed or exercised against Apple Sandbox; a signed device test is required before release.
6. Configure and verify the APNs auth key in EAS for project `d4ca480b-2d64-4e54-aa5c-dba69f13d0b6`, then test Expo-token registration and Gateway completion push on a physical iPhone. The production entitlement and local reminder path alone do not verify remote notifications.
7. Reconcile the published Privacy Policy's mobile notice before submission: it labels itself Android-only and describes Android Secure Storage and an Agent-mode deletion path, while iOS stores local data differently and offers deletion in Simple Chat. Add an accurate iOS disclosure covering local notes/tasks, Google authentication, Sentry, Expo/Gateway notifications, AI-provider processing/retention, and deletion scope; then align App Store Privacy answers with that notice. The in-app trial age was corrected from 13+ to 18+ to match the current Terms/Privacy policy.
8. Complete the archive checklist: account deletion verification, support/review access, age rating, export compliance, screenshots/store metadata, and physical iPhone/iPad acceptance. iPhone Duo layout acceptance remains open.

## Verification in this update

- Production `expo prebuild --platform ios --clean --no-install` completed.
- `expo config --type public --json` resolved bundle `com.ssvasia.expertai`, Google client `1093163336745-1m9gq2ka957532pd75mr339kltu8muop.apps.googleusercontent.com`, reversed callback scheme `com.googleusercontent.apps.1093163336745-1m9gq2ka957532pd75mr339kltu8muop`, production APNs mode, extension ID, and app group.
- The pod deployment-target config plugin was added and regenerated into the ignored iOS Podfile; it leaves the app's supported minimum at iOS 16.0.
- A production Xcode compile and unsigned IPA packaging have completed; no signed IPA has completed. Record the signed build's signature, checksum, and App Store Connect processing result after the signed workflow runs.

## Production CI result — 20 November 2026

- Source SHA: `a3c8bbdee9d8c118a6c7b3ad4e3a473c9767a4c9` (`Raise iOS pod targets for Xcode 27`).
- GitHub Actions run [44652994910](https://github.com/ssv-asia/expert-ai-ios-localtest-temporary/actions/runs/44652994910) completed successfully on Xcode 27.1. Expo prebuild, production identity/capability checks, CocoaPods installation, native Release compilation, IPA packaging, and upload-artifact all passed.
- Artifact: `ExpertAI-production-unsigned` (artifact ID `14592732422`, 62,894,139 bytes, expires 27 November 2026). GitHub reports artifact digest `sha256:b086de60cae04c8ad52d673adc84728f6f0c8fea3eea481fda36d4360870b29a` for the uploaded artifact archive.
- The artifact contains an **unsigned** production IPA; it is a successful compile/package proof and cannot be uploaded to App Store Connect or installed as a normal signed app. The seven-day artifact is downloadable from the run page above.
- Next: add the missing `APPLE_TEAM_ID` variable, merge draft PR #1, run `.github/workflows/ios-app-store-signed.yml`, verify the exported App Store signature and embedded app/extension profiles, then upload/validate the build in App Store Connect. Physical-device, Gateway-tool, OAuth, and Apple-review checks remain open as listed above.

## Gateway parity build — 20 November 2026

- Source SHA: `f60357bcf1cda4e02e1d3124fd740bd6d85ae783` (`Preserve Gateway tool catalogue on iOS`). This commit removed the iOS-only client-supplied `tools` list so the Gateway can inject its full server-side tool catalogue, matching the APK request contract. The iOS app still executes Gateway-returned `daily_note` calls locally.
- GitHub Actions run [44657768664](https://github.com/ssv-asia/expert-ai-ios-localtest-temporary/actions/runs/44657768664) completed successfully after Xcode compilation, packaging, and artifact upload. Artifact `ExpertAI-production-unsigned`, ID `14595111498`, size 62,891,345 bytes, expires 27 November 2026; GitHub artifact digest `sha256:2ae55c102c5e5a9722f03525ae8d4f0f5fd864e19dbe5add660b89ebe92402ef`.
- Downloaded IPA: `ExpertAI-production-unsigned.ipa`, SHA-256 `2ebe7cd9befb7a3334b8b65978120b72745c6916dd08c272f639c10cb3516775`. ZIP integrity passed. Embedded app ID is `com.ssvasia.expertai`, version `1.5.3 (1)`, and share extension ID is `com.ssvasia.expertai.share-extension`.
- This IPA is unsigned: it has no embedded provisioning profile or code-signature resources. It is not installable on a normal device and cannot be uploaded to App Store Connect. A signed App Store IPA is still outstanding.
- A replacement build, run [44660079330](https://github.com/ssv-asia/expert-ai-ios-localtest-temporary/actions/runs/44660079330), was also dispatched on the same SHA because the first run temporarily appeared stalled. It is redundant; run 44657768664 later completed successfully. Check the replacement's state before cancelling or using it.
- Signed build remains dependent on the owner adding `APPLE_TEAM_ID` and the three `APP_STORE_CONNECT_*` values to GitHub Actions, then dispatching the signed workflow. Device acceptance and the other release blockers above are still open.
- The unsigned build workflow now ignores documentation-only and workflow-file-only pushes on this branch, preventing lengthy native builds for handoff edits. `workflow_dispatch` remains available when an intentional unsigned compile is needed; the signed workflow remains separately manual.
- The owner-provided App Store Connect `.p8` key was validated locally without printing its contents. GitHub Actions now has `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, and `APP_STORE_CONNECT_PRIVATE_KEY` set; secret values are not retrievable for inspection. `APPLE_TEAM_ID` remains unset, and no signing workflow has run yet.

## Signed App Store upload and export compliance — 20 November 2026

- Signed App Store archive/export succeeded in GitHub Actions run [44677398356](https://github.com/ssv-asia/localtest-temporary/actions/runs/44677398356) on source commit `ca0b8a71bcb1042eeb72c37efe2a1ec8d9b372fc`. Xcode automatic signing and the app/share-extension profiles accepted the shared App Group `group.com.ssvasia.expertai`.
- Verified artifact metadata: bundle `com.ssvasia.expertai`, share extension `com.ssvasia.expertai.share-extension`, version `1.5.3` (build `1`); code-signature verification, IPA ZIP integrity, and SHA-256 artifact check passed.
- The exact signed IPA was uploaded to App Store Connect in run [44680151196](https://github.com/ssv-asia/localtest-temporary/actions/runs/44680151196). Apple returned `UPLOAD SUCCEEDED` with zero warnings. Build Uploads showed `Processing`; wait for Apple to mark it `Complete` before adding it to TestFlight. Apple says investigate if processing exceeds 24 hours.
- App Store Connect asked for export-compliance encryption details because this build did not declare `ITSAppUsesNonExemptEncryption` in its Info.plist. Source review found no app-implemented encryption algorithms or separate crypto library; the app uses platform HTTPS and Keychain/SecureStore facilities. For this build, the owner selected “None of the algorithms mentioned above.”
- Added `expo.ios.infoPlist.ITSAppUsesNonExemptEncryption: false` to `app.json` and committed it to `main` (`0d3cdb7`). This declares no non-exempt encryption for future iOS builds and avoids the repeated question; it does not alter the already uploaded build.
- The signed IPA upload workflow is `.github/workflows/ios-app-store-upload.yml`; it downloads a specified successful signed artifact, verifies its checksum, then submits it using the configured App Store Connect team API key. Its implementation was merged in commit `83120ff`.

## Current release candidate audit — 20 November 2026

- The iOS source checkout was synced from `origin/main` at `cfeacef888a1a098235bb18d99597c97faabbef2`. Current candidate changes increment `ios.buildNumber` to `3` (version `1.5.3`).
- Apple sign-in's concrete rejection cause was an algorithm/key-type mismatch: the Gateway required ES256 and EC P-256, while Apple's live identity-token JWKS publishes RSA keys with `alg: RS256`. The Gateway source and cryptographic tests are corrected to RS256 / RSA / RSASSA-PKCS1-v1_5 + SHA-256, preserving issuer, audience, expiry, one-time nonce, and subject checks.
- Natural daily-note requests missed the Gateway's “daily note(s)” target match when written as “add to my daily notes that …”; the model was therefore not reliably required to invoke the device-local tool. The plural classifier is corrected. iOS tool messages now include their tool name, and a completed/verified local note result is answered deterministically by the Gateway, avoiding another model request that could reject the tool-history format or expose JSON.
- The StoreKit plan sheet is being aligned with the APK hierarchy and visual treatment. It uses the same eight product identifiers and StoreKit localized prices. If the Pro Monthly SKU is absent from StoreKit's response after reloading, remaining cause is App Store Connect product state/storefront availability, which requires checking in the owner's account; no client-side fallback price is shown as if it were Apple's price.
- iOS onboarding is now first-run-only and uses a SecureStore flag independent of account state. Settings can still replay the experience. Existing iOS native search font and daily-note keyboard accessory changes are verified in source.
- Local iOS verification: `yarn tsc --noEmit` and targeted ESLint pass. Gateway `node --check` and all 221 tests pass, including RS256 identity-token and daily-note routing checks. Gateway commit `3bbdfda` is deployed as Worker version `a22539a3-9e16-40ac-82ce-f387cb4a52e5`; production health and the Apple nonce endpoint returned success. Physical iPhone validation remains pending.
- App Store Connect signing configuration is present: the signed workflow previously completed successfully (run `44732773918`) and the upload workflow completed successfully for build 1 (run `44737319770`). This confirms the workflow credentials and team configuration work; the new build 3 still needs its own signed archive and upload.
- Next release gates: push the iOS source candidate to `main`; run the signed IPA workflow and its checksum/signature/identity checks; upload that exact artifact; wait for Apple processing; install the build through internal TestFlight and exercise email OTP, Google, Apple, trial, all StoreKit SKUs/restore, daily-note actions, and keyboard layout. The owner must verify any Pro Monthly product not returned by StoreKit in App Store Connect. External TestFlight review and App Review are separate later gates.


## Release work in progress — 20 November 2026

The local iOS source now includes scoped fixes for the four reported
TestFlight behaviors, StoreKit subscriptions, and Sign in with Apple. These
edits are not a release candidate yet: the connected checkout is local-only,
no new IPA was built (per owner instruction), no physical iPhone/iPad was
available, and the Gateway update is not deployed.

### Traced failures and source corrections

- Trial request `status === 0` was treated as an HTTP response. This bypassed
  Gateway origin failover and appeared as `could not start trial (0)`. iOS now
  treats XHR status zero as transport failure so failover runs. The original
  device's exact DNS/TLS/network reason remains unknowable without its log.
- `streamChatCompletion` did not await iOS `onToolCalls`, even though that
  callback executes the local daily-note action and model follow-up. It now
  waits on iOS while preserving Android fire-and-forget behavior. The
  committed Gateway baseline already has `/note` routing, the `daily_note`
  contract, verified result and deterministic response behavior. Production
  `/health` reports `frontier-foundation`; no authenticated failing turn trace
  was available, so a production Gateway defect was not established.
- Search chat explicitly used a correctly registered DM Sans face with no
  stretched letter spacing. iOS now uses its system font for the search input;
  the reported visual cause still needs device/screenshot confirmation.
- Daily-note editing controls now attach to the native iOS `InputAccessoryView`.
  Android toolbar/inset behavior is unchanged. Verify on iPhone and iPad.

See `docs/IOS-TESTFLIGHT-FAILURE-CAUSE-AUDIT-2026-11-20.md` for the evidence
and limits of the source audit.

### App Store billing work staged

- Added `expo-iap` 6.5.1 and an iOS plan selector using App Store localized
  prices, purchase, restore, signed transaction retrieval, account refresh, and
  transaction finish only after Gateway verification. Eight proposed product
  IDs cover Essential, Pro, Max, and Founder weekly/monthly.
- App config now uses iOS build number `2` while retaining marketing version
  `1.5.3`.
- A separate clean Gateway worktree is staged at
  `C:\expert-ai-apk\expert-ai-gateway-apple-iap\v0.2.0-oauth`, branch
  `codex/apple-iap-20261120`, commit `b634a94` (pushed to the Gateway source
  repository branch after deployment). The original Gateway working tree and its
  uncommitted edits/generated artifacts remain untouched.
- Gateway Apple `/billing/apple/verify` signs an App Store Server API JWT,
  verifies Apple's signed transaction and current status, then applies the
  latest active or grace-period renewal.
  An atomic original-transaction ownership lock prevents a subscription chain
  being linked to a second Expert AI account. iOS rechecks finished purchases
  when the Plans view opens; entitlement refresh retries briefly after an
  accepted transaction. The Gateway candidate now verifies Apple notification
  certificate chains and signed transactions, deduplicates notification UUIDs,
  reconciles current subscription status, and applies owner-checked refund/revoke
  lifecycle updates. Wrangler dry-run bundles it successfully with Node
  compatibility. Cloudflare initially rejected its eager global-scope module
  initialization; loading the library lazily inside notification/purchase
  request handlers fixed Worker validation. Gateway candidate version
  `cd400841-bee2-40d8-b86f-c327a23cfebc` is deployed at
  `https://expert-ai-gateway.arthouse.workers.dev`. Live `/health` and
  `/auth/apple/nonce` smoke checks passed. It has not received Apple's Sandbox
  or Production notification fixtures; defer App Store subscription
  notification URLs until verified with Apple's notification test tooling.

### Sign in with Apple owner action

The owner reports enabling Sign in with Apple on the existing primary App ID
`com.ssvasia.expertai`. No Service ID or Apple client secret is needed for the
native iOS flow. Keep the optional Sign in with Apple Server-to-Server
Notification Endpoint blank for this build; no corresponding account-change
handler is implemented. The Gateway auth code is staged alongside IAP code in
the isolated candidate; it must be deployed before Apple sign-in will work in
TestFlight. Confirm the signed build's provisioning profile includes the
capability.

### Apple setup before an end-to-end purchase test

1. The owner reports the subscription group and all eight product IDs/prices
   have been created in App Store Connect. Confirm that each also has storefront
   availability, localized display metadata, and any required review information
   and screenshots before submitting it with an app version.
2. The separate In-App Purchase Server API key is configured as Cloudflare
   Worker secrets; never paste its `.p8` here or commit it.
3. Gateway subscription notifications are deployed in the isolated candidate;
   defer production/sandbox Server Notification URL setup until verified with
   Apple's notification test tooling. The separate Sign in with Apple account
   change endpoint remains unimplemented and blank for this candidate.
4. The owner reports a Sandbox Apple Account has been created. Sandbox purchase
   testing still requires products to be available for testing and a signed
   native build with the completed StoreKit/Gateway lifecycle implementation.

### Verification and gates

- `corepack yarn install --immutable`: passed (existing peer dependency
  warnings remain).
- `corepack yarn tsc --noEmit`: passed after StoreKit integration and purchase
  refresh updates.
- `corepack yarn lint`: still fails on two pre-existing unescaped quotation
  marks in `components/aec-knowledge-section.tsx:209`; the new StoreKit
  component passes standalone ESLint.
- Gateway `node --check` and all 213 Gateway tests pass. Wrangler Worker dry-run
  bundles the Apple Server Library and Gateway successfully (2.19 MB;
  `nodejs_compat`). Deployed Gateway version
  `cd400841-bee2-40d8-b86f-c327a23cfebc` passed live health and nonce smoke
  checks. Gateway source is committed at `b634a94` on
  `codex/apple-iap-20261120`; no iOS build has been run yet.
- iOS `corepack yarn tsc --noEmit` passes. Targeted ESLint reports no errors and
  two existing unused-symbol warnings in `lib/auth.ts` (`resilientFetch`,
  `startSignIn`).
- Release remains blocked on signed internal TestFlight device acceptance (Apple sign-in, sandbox StoreKit,
  notifications, trial, note, keyboard/layout), deploying and smoke-testing
  the Gateway candidate, privacy/reviewer metadata, and then external TestFlight
  review. Distribution should use the tested candidate; external approval does
  not guarantee App Review approval.

### Apple owner actions before end-to-end StoreKit testing

No credentials or private keys are needed in chat. The owner has created the
subscription group/products and Sandbox Apple Account and provided a separate
In-App Purchase Server API key. The `.p8` was validated locally and the key ID,
issuer ID, private key, and app bundle ID are now stored as Cloudflare Worker secrets for
`expert-ai-gateway` (account `6af68c2916e705b64ae6de82433e1e85`). This did not
deploy Worker source. Keep the `.p8` out of chat, source control, and build
artifacts. Do not set Apple notification URLs until the Gateway lifecycle
handler is complete. The owner will use the sandbox credentials on their iPhone
once the signed sandbox build is ready; do not request or record its password.

### Apple IAP credentials configured — 20 November 2026

- Located `SubscriptionKey_H8U2Q84UF4.p8` in Downloads and validated its
  PKCS#8/P-256 structure locally without displaying or copying its contents to
  source control.
- Stored `APPLE_IAP_PRIVATE_KEY`, `APPLE_IAP_KEY_ID`,
  `APPLE_IAP_ISSUER_ID`, and `APPLE_IAP_BUNDLE_ID` as Cloudflare Worker secrets
  for `expert-ai-gateway` in account `6af68c2916e705b64ae6de82433e1e85`.
- This changed only the Worker's secret configuration. No Worker source was
  deployed; signed notification verification, timely renewal/refund handling,
  and safe revocation reconciliation remain incomplete and block release.
- The owner reports that the Sandbox Apple Account is created. Device testing
  still needs a signed build after the StoreKit and Gateway lifecycle code is
  complete. Do not request or record its password.

### Sign in with Apple configuration — 20 November 2026

- The owner reports enabling Sign in with Apple on the existing primary App ID
  `com.ssvasia.expertai`.
- Leave the **Sign in with Apple Server-to-Server Notification Endpoint** blank
  for this candidate. That setting concerns Apple account changes and is not
  the StoreKit subscription notification URL. This Gateway candidate currently
  implements the latter only.
- No Service ID, Apple client secret, or auth notification URL is needed for
  the native sign-in flow. The signed app's refreshed provisioning profile and
  Gateway deployment still need verification before device testing.

### Sign in with Apple implementation status — 20 November 2026

- Owner changed scope and requested native Apple sign-in in this release.
- iOS uses `expo-apple-authentication` and a server-issued one-time raw nonce;
  the Gateway verifies Apple's signed identity token, app audience, issuer,
  validity window, nonce hash, and stable subject.
- The stable Apple subject is persisted against one Expert AI email account so
  returning users can sign in when Apple omits email. First-time users are
  matched to their verified email membership or get a basic Ghost member record.
  No access token is trusted directly from the client.
- A Sandbox/device test and production capability configuration are still
  required. Existing OTP and Google sign-in remain supported.

### Release candidate build 3 — 20 November 2026

- iOS source commit: `9ced950042083b979834ecfa7215128ed7c891a7` on `main`;
  marketing version `1.5.3`, build `3`.
- Signed IPA workflow [44772618404](https://github.com/ssv-asia/localtest-temporary/actions/runs/44772618404)
  and App Store Connect upload workflow
  [44776684500](https://github.com/ssv-asia/localtest-temporary/actions/runs/44776684500)
  succeeded. Wait for Apple processing, then confirm build 3 appears under
  internal TestFlight before installing it.
- Gateway Apple identity verification and note handling were deployed in Worker
  version `a22539a3-9e16-40ac-82ce-f387cb4a52e5`; health/nonce smoke checks and
  all 221 Gateway tests passed before/after deployment.
- Build 3 still needs physical-device acceptance, especially Sandbox purchases
  for every configured SKU and restore, Apple/Google/OTP sign-in, trial, and
  daily-note writes. Internal upload success does not prove those live Apple
  or device flows.
