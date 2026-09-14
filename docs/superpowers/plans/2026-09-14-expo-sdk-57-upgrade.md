# Expo SDK 57 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade civ-app from Expo SDK 54 to SDK 57 so `npm start` works with Expo Go SDK 57, with all Expo packages (especially `expo-sqlite`) aligned.

**Architecture:** Single-jump dependency upgrade (`expo@^57` ≥ 57.0.17), then apply known SDK 55/56 config and Expo Router import migrations. Keep the managed EAS `preview` profile unchanged; do not run `eas build` unless the user explicitly asks.

**Tech Stack:** Expo SDK 57, Expo Router, expo-sqlite, Drizzle ORM, React Native (SDK-bundled), NativeWind, React Native Paper, patch-package (remove obsolete nav patches).

**Spec:** `docs/superpowers/specs/2026-09-14-expo-sdk-57-upgrade-design.md`

## Global Constraints

- Target Expo SDK **57**; resolved `expo` version must be **≥ 57.0.17** when available on npm.
- Align every Expo package with `npx expo install --fix` — never leave `expo-sqlite` on a foreign major.
- Keep `@expo/vector-icons` as an explicit dependency.
- **Never run `eas build` (any profile) without explicit user approval** — free preview quota is limited.
- Do not add `expo-dev-client` in this work.
- Database layer (`database/client.ts` and drizzle usage) stays unchanged unless doctor/runtime forces an API fix.
- Prefer frequent commits after each independently verifiable task.

## File structure (expected touch set)

| File | Role after this plan |
|---|---|
| `package.json` / `package-lock.json` | SDK 57 deps; no `@react-navigation/native`; no obsolete patches / possibly no `patch-package` |
| `app.json` | SDK 55+ config (no `newArchEnabled`, no `edgeToEdgeEnabled`) |
| `components/providers/AppProviders.tsx` | `ThemeProvider` from `expo-router/react-navigation` |
| `constants/navigationTheme.ts` | `DefaultTheme` / `Theme` from `expo-router/react-navigation` |
| `components/ui/Screen.tsx` | `useIsFocused` from `expo-router/react-navigation` |
| `patches/*` | Deleted |
| `README.md` | SDK 57 + patch notes updated |
| `eas.json` | Unchanged |

---

### Task 1: Stop Metro and remove obsolete React Navigation patches

**Files:**
- Delete: `patches/@react-navigation+elements+2.9.18.patch`
- Delete: `patches/@react-navigation+bottom-tabs+7.16.1.patch`
- Modify: `package.json` (remove `postinstall` / `patch-package` if `patches/` becomes empty)
- Modify: `package-lock.json` (only if removing `patch-package`)

**Interfaces:**
- Consumes: none
- Produces: clean install that no longer applies broken `@react-navigation/*` patches after the SDK jump

- [ ] **Step 1: Stop the Expo/Metro process**

If a terminal is running `npm start`, stop it (Ctrl+C). Confirm no Metro process is bound to the project before changing dependencies.

- [ ] **Step 2: Delete the two patch files**

Delete:

- `patches/@react-navigation+elements+2.9.18.patch`
- `patches/@react-navigation+bottom-tabs+7.16.1.patch`

If `patches/` is empty, delete the empty directory as well.

- [ ] **Step 3: Remove `patch-package` wiring when no patches remain**

In `package.json`, if there are no remaining files under `patches/`:

1. Remove the script: `"postinstall": "patch-package"`
2. Remove `"patch-package"` from `devDependencies`
3. Run: `npm uninstall patch-package`

Expected: `package.json` has no `postinstall` and no `patch-package` entry; `npm ls patch-package` reports it is not installed.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git add -u patches
git commit -m "$(cat <<'EOF'
Remove React Navigation patches before SDK 57 upgrade.

SDK 56 forks navigation into expo-router; these patch-package files will not apply.
EOF
)"
```

On Windows PowerShell, if heredoc is awkward, use:

```powershell
git commit -m "Remove React Navigation patches before SDK 57 upgrade.`n`nSDK 56 forks navigation into expo-router; these patch-package files will not apply."
```

---

### Task 2: Upgrade Expo to SDK 57 and align dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: clean tree from Task 1 (no failing `postinstall` patches)
- Produces: `expo` ≥ 57.0.17; `expo-sqlite` and other Expo packages at SDK 57–compatible versions from `expo install --fix`

- [ ] **Step 1: Install Expo SDK 57**

Run from repo root:

```bash
npm install expo@^57.0.0
```

- [ ] **Step 2: Confirm `expo` version floor**

Run:

```bash
node -p "require('expo/package.json').version"
```

Expected: a version string ≥ `57.0.17` (for example `57.0.17` or higher). If npm resolved an earlier 57.0.x below 57.0.17, run:

```bash
npm install expo@57.0.17
```

(or newer) and re-check.

- [ ] **Step 3: Align all Expo-related packages**

```bash
npx expo install --fix
```

Accept the proposed version changes. This must update `expo-sqlite` off `~16.0.10` onto the SDK 57–bundled major (expect something like `~57.x`, not `16.x` and not a random foreign major).

- [ ] **Step 4: Verify critical package alignment**

```bash
npm ls expo expo-sqlite react-native react-native-reanimated react-native-worklets --depth=0
```

Expected:

- `expo@57.x.y` with `y` such that full version ≥ 57.0.17
- `expo-sqlite` major matching the SDK 57 scheme (not `16.0.10`)
- No `INVALID` / peer dependency errors that `expo-doctor` will later treat as fatal

Also confirm `@expo/vector-icons` remains listed under `dependencies` in `package.json`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Upgrade Expo dependencies to SDK 57."
```

---

### Task 3: Update `app.json` for SDK 55+ rules

**Files:**
- Modify: `app.json`

**Interfaces:**
- Consumes: SDK 57 tooling from Task 2
- Produces: config without removed keys (`newArchEnabled`, `edgeToEdgeEnabled`)

- [ ] **Step 1: Remove obsolete keys**

Edit `app.json` so the Expo config no longer includes:

- top-level `"newArchEnabled": true`
- `"android.edgeToEdgeEnabled": true`

Keep `android.package`, `android.predictiveBackGestureEnabled`, plugins, and `extra.eas.projectId` unchanged.

Resulting shape (relevant sections):

```json
{
  "expo": {
    "name": "civ-app",
    "slug": "civ-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "civapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "predictiveBackGestureEnabled": false,
      "package": "com.elizabetas.civapp"
    }
  }
}
```

(Other existing keys under `web`, `plugins`, `experiments`, `extra` stay as they are today.)

- [ ] **Step 2: Commit**

```bash
git add app.json
git commit -m "Drop SDK 55-removed Expo config flags."
```

---

### Task 4: Migrate `@react-navigation/*` imports to Expo Router

**Files:**
- Modify: `components/providers/AppProviders.tsx`
- Modify: `constants/navigationTheme.ts`
- Modify: `components/ui/Screen.tsx`
- Modify: `package.json` / `package-lock.json` (remove direct `@react-navigation/native` if still present)

**Interfaces:**
- Consumes: Expo Router from SDK 57 (`expo-router/react-navigation` export)
- Produces: app code with zero `@react-navigation/*` imports

- [ ] **Step 1: Run the official codemod (preferred)**

From repo root, target app source dirs (this repo has no `src/` folder):

```bash
npx expo-codemod sdk-56-expo-router-react-navigation-replace components constants app
```

If the codemod fails or skips files, continue with Step 2 manual edits.

- [ ] **Step 2: Ensure these exact imports (manual fallback / verification)**

`components/providers/AppProviders.tsx`:

```tsx
import { ThemeProvider } from 'expo-router/react-navigation';
```

`constants/navigationTheme.ts`:

```tsx
import { DefaultTheme, type Theme } from 'expo-router/react-navigation';
```

`components/ui/Screen.tsx`:

```tsx
import { useIsFocused } from 'expo-router/react-navigation';
```

Leave the rest of each file unchanged.

- [ ] **Step 3: Confirm no remaining app imports**

```bash
rg "from ['\"]@react-navigation" --glob "*.{ts,tsx,js,jsx}"
```

Expected: no matches under app source (ignore `node_modules` if the tool includes it; restrict to project folders if needed).

- [ ] **Step 4: Remove the direct `@react-navigation/native` dependency**

```bash
npm uninstall @react-navigation/native
```

Expected: it is gone from `package.json` `dependencies`.

- [ ] **Step 5: Commit**

```bash
git add components/providers/AppProviders.tsx constants/navigationTheme.ts components/ui/Screen.tsx package.json package-lock.json
git commit -m "Migrate React Navigation imports to expo-router."
```

---

### Task 5: Doctor, Expo Go smoke test, and README

**Files:**
- Modify: `README.md` (SDK version + patches row)

**Interfaces:**
- Consumes: Tasks 1–4 complete tree
- Produces: verified local/dev path; docs match SDK 57

- [ ] **Step 1: Run Expo Doctor**

```bash
npx expo-doctor@latest
```

Expected: all checks pass, or only warnings that are documented and acceptable. Fix any dependency mismatches with `npx expo install --fix` and re-run until clean enough to ship.

- [ ] **Step 2: Start the app**

```bash
npm start
```

Open on the Android device with **Expo Go SDK 57**.

Expected:

- No `Project is incompatible with this version of Expo Go` error
- Bundle loads
- App boots past `DatabaseProvider` (migrations apply)
- Tabs / core navigation work

If Metro cache is stale after the upgrade:

```bash
npx expo start -c
```

- [ ] **Step 3: Update README stack table**

In `README.md`, change the framework row from Expo `~54` to `~57`, and update or remove the Patches row (no React Navigation patches remain). Example:

| Field | Value |
|---|---|
| App framework | React Native + Expo (~57) |
| Patches | none (or omit the row) |

Do not add instructions that run `eas build` automatically.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Document Expo SDK 57 after upgrade verification."
```

---

### Task 6: Optional EAS preview build (USER GATE — do not run unprompted)

**Files:** none required (uses existing `eas.json` `preview` profile)

**Interfaces:**
- Consumes: verified SDK 57 tree from Task 5
- Produces: installable APK only when the user spends quota on purpose

- [ ] **Step 1: Ask the user before any command**

Do **not** run this task unless the user explicitly says to run a preview build. Message them first, e.g. “Dev path looks good. Want me to run `eas build --platform android --profile preview` now? It will use one of your limited free builds.”

- [ ] **Step 2: Only after approval, build**

```bash
eas build --platform android --profile preview
```

Expected: build succeeds on EAS.

- [ ] **Step 3: Install and smoke-test the APK**

Confirm cold start works and SQLite/DB init does not crash (`NativeDatabase` / `SharedRef` class of failure from the old mismatch must not return).

- [ ] **Step 4: No commit required** unless build-related config had to change (it should not).

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Jump to SDK 57 / `expo` ≥ 57.0.17 | Task 2 |
| `expo install --fix` / aligned `expo-sqlite` | Task 2 |
| Keep `@expo/vector-icons` explicit | Task 2 Step 4 |
| Remove nav patches | Task 1 |
| `app.json` remove `newArchEnabled` / `edgeToEdgeEnabled` | Task 3 |
| Migrate `@react-navigation` imports | Task 4 |
| Doctor + Expo Go verification | Task 5 |
| README light update | Task 5 |
| No EAS build without asking | Task 6 gated + Global Constraints |
| Leave DB layer alone | Global Constraints / no DB task |
| No `expo-dev-client` | Global Constraints / out of scope |

No placeholders remain. Types/import targets match Expo’s SDK 55→56 migration table (`expo-router/react-navigation`).
