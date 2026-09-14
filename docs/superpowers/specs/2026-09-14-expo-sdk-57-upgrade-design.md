# Upgrade civ-app from Expo SDK 54 to SDK 57

**Date:** 2026-09-14  
**Status:** Approved design  
**Goal:** Make `npm start` (Expo Go SDK 57) and `eas build --platform android --profile preview` both work on one aligned dependency set.

## Problem

The project is healthy on **Expo SDK 54** (`expo@~54.0.37`, `expo-sqlite@~16.0.10`). `expo-doctor` passes. Commit `3cbd7fe` correctly pinned `expo-sqlite` to the SDK 54 native module after `expo-sqlite@55` crashed Android (`SharedRef` / `NativeDatabase` mismatch).

That is unrelated to the current failure: **Expo Go on device is SDK 57**, while the project remains SDK 54. Expo Go only runs the SDK it was built for.

## Decision

**Single jump SDK 54 → 57** with a known migration checklist (Approach 1). Do not stay on 54 with an older Expo Go, and do not add `expo-dev-client` in this change.

Rationale:

- App is small, already on New Architecture (`newArchEnabled: true`).
- Most risk is known config/import work (SDK 55 config removals, SDK 56 Expo Router / React Navigation fork), not unknown native surface area.
- SDK 57 from 56 is intentionally a small upgrade; landing on ≥ `expo@57.0.17` also avoids Hermes V1 memory / startup regressions that affect Reanimated / worklets (this app uses both).

Rejected alternatives:

- **Incremental 54→55→56→57:** safer attribution, slower; same end state for this repo size.
- **SDK 57 + development builds:** future-proof against Expo Go churn; out of scope for this fix.

## Target state

| Concern | Target |
|---|---|
| Expo SDK | 57 (`expo@^57.0.0`, prefer ≥ **57.0.17**) |
| Native modules | All Expo packages aligned via `npx expo install --fix` |
| `expo-sqlite` | SDK 57–bundled major (unified scheme ≈ `~57.x`), never a foreign major |
| Dev | `npm start` opens in Expo Go SDK 57 |
| Preview | `eas build --platform android --profile preview` produces a working APK (DB opens) |

## Scope

### In scope

1. Upgrade `expo` and align all Expo-related dependencies with SDK 57.
2. Update `app.json` for SDK 55+ config rules.
3. Migrate app imports off `@react-navigation/*` to Expo Router entry points (SDK 56).
4. Remove or replace obsolete `patch-package` patches for `@react-navigation/*`.
5. Verify with `expo-doctor` and Expo Go. **Do not run an EAS preview build unless the user explicitly asks** (limited free build quota).
6. Light README notes if install/run docs mention SDK 54–specific guidance.

### Out of scope

- Introducing `expo-dev-client` / changing the EAS `development` workflow beyond what the upgrade requires.
- Feature work, schema/migration changes, or UI refactors.
- iOS store submission.
- Running `eas build` (any profile) without explicit user approval.

## Migration checklist

### Dependencies

1. Stop Metro if running.
2. `npm install expo@^57.0.0` (ensure resolved version ≥ 57.0.17 when available).
3. `npx expo install --fix` so every Expo package matches the installed SDK — especially **`expo-sqlite`**.
4. Keep `@expo/vector-icons` as an explicit dependency (required since SDK 56).
5. Reassess `patch-package` patches under `patches/`:
   - Current patches retarget `pointerEvents` on `@react-navigation/elements` and `@react-navigation/bottom-tabs`.
   - SDK 56 forks navigation into `expo-router`; these patches will not apply to the old package versions and should be **removed** unless rewritten against the new packages after upgrade (prefer remove first; re-add only if a real bug returns).
6. If patches are removed, drop unused patch entries / confirm `postinstall` still succeeds.

### `app.json`

- Remove `android.edgeToEdgeEnabled` (removed in SDK 55; edge-to-edge is mandatory on modern Android targets).
- Remove `newArchEnabled` (always-on / ignored from SDK 55+).
- Leave `android.package` (`com.elizabetas.civapp`), plugins (`expo-router`, `expo-sqlite`, `expo-font`), and EAS `projectId` unchanged unless tooling requires a change.

### Application code

Known `@react-navigation/native` imports (must move for SDK 56+):

- `components/providers/AppProviders.tsx` — `ThemeProvider`
- `constants/navigationTheme.ts` — `DefaultTheme`, `Theme`
- `components/ui/Screen.tsx` — `useIsFocused`

Migrate via `npx expo-codemod sdk-56-expo-router-react-navigation-replace` and/or manual rewrites to `expo-router` / `expo-router/react-navigation` per Expo’s SDK 55→56 router migration guide.

Database layer (`database/client.ts`, drizzle + `openDatabaseSync` / `openDatabaseAsync`) stays as-is unless runtime or doctor reports an API break.

### EAS / native projects

- Managed workflow: no checked-in `android/` / `ios/` trees expected; EAS regenerates natives.
- Keep existing `eas.json` `preview` profile (`distribution: internal`, Android `buildType: apk`).
- A **new** preview APK is required to fully prove production parity after the upgrade (old SDK 54 APKs do not count), but **do not start that build during implementation** unless the user explicitly requests it — free EAS preview quota is limited.

## Verification

**Default (implementation complete without spending a build):**

1. `npx expo-doctor` — clean (or only documented, accepted warnings).
2. `npm start` — project loads in **Expo Go SDK 57** on Android (no “incompatible SDK” error).
3. Smoke: app boots, DB provider/migrations run, core navigation works.

**Only when the user asks (consumes EAS quota):**

4. `eas build --platform android --profile preview` — build succeeds; install APK; confirm launch without the historical `expo-sqlite` / `NativeDatabase` crash.

## Risks

| Risk | Mitigation |
|---|---|
| Debugging across three SDK deltas at once | Apply checklist from SDK 55/56/57 changelogs before testing; use doctor early |
| `expo-sqlite` major mismatch again | Only install via `expo install --fix`; never floating `^` across SDK majors |
| Navigation patches break install | Delete patches first; only reintroduce if needed |
| Hermes / Reanimated memory issues on early 57 | Pin / resolve `expo` ≥ 57.0.17 |

## Success criteria

- One dependency tree on SDK 57.
- Dev: Expo Go SDK 57 works with `npm start`.
- Prod preview: **deferred** until the user explicitly requests an EAS build; then a new Android APK from `preview` must launch and use SQLite successfully.
