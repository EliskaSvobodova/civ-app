# Civ App

A mobile companion app for **Sid Meier’s Civilization V** (Vox Populi mod) players focused on:

* browsing civilization and leader reference data,
* multiplayer-friendly random leader assignment,
* match history and win tracking,
* and lightweight statistics.

The project is intentionally designed as:

* offline-first,
* lightweight,
* easy to maintain,
* and optimized for rapid AI-assisted development using Cursor.


# Core Features

## Civilization library (implemented)

* Browse all **43 Vox Populi** civilizations from static JSON (`assets/data/civilizations.json`)
* Expand list rows for leader, unique ability, units, buildings, and wonders
* View warlike / science / culture / diplomatic scores (0–10 rated by AI according to the unique features)
* Open a full-detail modal per civilization
* Jump to match history filtered by civilization


## Civilization selection (implemented)

* Create and manage named players (soft-delete supported in the database)
* Build a **New Game** roster by selecting players
* Random civilization assignment per player with **no duplicate civs** in the same session
* Per-player selection preferences:
  * exclude specific civilizations,
  * optionally avoid recently played civs (configurable lookback window),
  * with graceful fallback when the filtered pool is empty
* Reroll a single player’s assignment
* Hand-pick a civilization from the full list (respecting uniqueness within the session)
* **Commit** a game to local storage (participants + civ/leader keys)


## Match history (implemented)

* List committed games with start/end dates and participants
* Record and edit winners (human players or an AI civilization)
* Delete games from history
* Filter history by civilization (from the Library tab)


## Leaderboard & statistics (implemented)

* Top civilizations and top players by win count
* Custom **game length** axis chart (days from start to end) when enough completed games exist


## Planned / not yet in the UI

The database schema and TypeScript types reserve fields for richer match metadata that is not wired up yet:

* map type, difficulty, victory type, score, turn count, notes
* weighted randomization (e.g. prefer less warlike civs)
* offering multiple random choices per player
* game events and “strongest civs encountered” tracking
* cloud sync, accounts, and production analytics (e.g. Sentry)


# Project Goals

## Primary Goals

* Create a useful companion app for Civilization V (Vox Populi) players
* Explore AI-assisted (“vibe coding”) development workflows


# Technology Stack

| Area | Choice |
| ---- | ------ |
| App framework | React Native + Expo (~54) |
| Language | TypeScript |
| Routing | Expo Router (file-based, typed routes) |
| Local database | Expo SQLite + Drizzle ORM (migrations via `drizzle-kit`) |
| UI styling | NativeWind (Tailwind) + React Native Paper (Material) |
| Fonts | Bodoni Moda (`@expo-google-fonts/bodoni-moda`) |
| State | Zustand (minimal global state, e.g. database readiness) |
| Civ V content | Static JSON (`assets/data/civilizations.json`) |
| Charts | Custom React Native components (no third-party chart library) |
| Auth / backend | None — local-only |
| Patches | `patch-package` (React Navigation tab/element tweaks) |


# Architecture Overview

The application follows a modular, feature-oriented layout.

## Key principles

* Offline-first: all game and player data lives in on-device SQLite
* Strong TypeScript typing across services, schema, and UI
* Business logic in `services/` and `utils/`, screens stay thin
* Reusable UI under `components/` (civilization, game, player, stats, ui)
* Minimal global state (`store/appStore.ts` tracks DB readiness only)


## Data access

* **`database/sqliteExecutor.ts`** — single entry point for async SQL via expo-sqlite `$client`
* **`database/repositories/`** — `PlayerRepository`, `GameRepository`, `PreferencesRepository` (SQL + row mappers)
* **`services/`** — validation, domain assembly, and civilization enrichment; no direct SQL


# Data Model

## Static content (`assets/data/civilizations.json`)

* `CivilizationsDataset` with mod name, schema version, and `Civilization[]`
* Each civilization: slug, leader, uniques, and four balance scores

## SQLite tables (`database/schema.ts`)

| Table | Purpose |
| ----- | ------- |
| `games` | One row per committed session; legacy single-civ columns plus winner metadata and optional match fields |
| `game_players` | Many-to-many: which player played which civ/leader in a game |
| `players` | Named participants (`deleted_at` for soft delete) |
| `user_preferences` | Key/value store (e.g. per-player selection preferences as JSON) |

Migrations live in `database/migrations/` and run at startup via `DatabaseProvider`.


# App structure

Four top tabs (`app/(tabs)/`):

| Tab | Route | Role |
| --- | ----- | ---- |
| Library | `index` | Civilization reference list |
| Select | `select` | New game setup, random picks, commit |
| History | `history` | Committed games; optional `?civ=` filter |
| Leaderboard | `stats` | Win leaderboards and game-length chart |


# Project structure

```txt
app/                    # Expo Router screens and layouts
  (tabs)/               # Main tab screens
  _layout.tsx           # Root stack, fonts, providers
components/
  civilization/         # List items, details, scores, emblems
  game/                 # Match edit modal
  player/               # Selection preferences modal
  providers/            # Theme, Paper, database bootstrap
  stats/                # Game length chart
  ui/                   # Screen, cards, headings, icons
constants/              # Theme, colors, navigation theme
database/               # Drizzle schema, client, migrations
  repositories/         # Player, game, preferences data access
  sqliteExecutor.ts     # Async SQL wrapper for all platforms
services/               # Civilization, game, player, preferences APIs
store/                  # Zustand stores
types/                  # Shared TypeScript types
utils/                  # Selection logic, date helpers
assets/data/            # civilizations.json
assets/fonts/           # Space Mono (bundled)
```


# Development setup

## Requirements

* Node.js (LTS)
* npm
* Expo Go (recommended) or a dev build (Android Studio / Xcode for emulators)
* Git

## Install

```bash
npm install
```

(`postinstall` runs `patch-package` automatically.)

## Run

```bash
npm start          # Expo dev server
npm run android    # Open on Android
npm run ios        # Open on iOS
npm run web        # Open in browser (SQLite uses async open on web)
```

## Database (schema changes)

After editing `database/schema.ts`:

```bash
npm run db:generate   # Generate a new Drizzle migration
npm run db:studio     # Optional: Drizzle Studio
```

Migrations are applied when the app starts.


# Android APK (preview build)

Standalone APKs are produced with **EAS Build**, not `expo start` / Expo Go. The `preview` profile in `eas.json` builds an internally distributed `.apk`.

## One-time setup

* Expo account
* EAS CLI (`npm install -g eas-cli`, then `eas login`)

The Android application id is already set (`com.elizabetas.civapp`). Let EAS generate and store the keystore on the first build.

## Cloud build (installable APK)

```bash
npx expo-doctor
npx expo install --check
eas build --platform android --profile preview
```

When the build finishes, download the `.apk` from the Expo dashboard (or the install URL EAS prints). On the phone, allow installs from unknown sources, then install the file.


# License

Original source code in this repository is licensed under the [MIT License](LICENSE).

Civilization V names, rules, flavor text, and other game or Vox Populi content (including `assets/data/civilizations.json`) are **not** covered by that license. Those materials remain the property of their respective owners.


# Disclaimer

Civilization V and related assets are property of their respective owners.

This project is an unofficial fan-made companion application and is not affiliated with or endorsed by Firaxis Games, 2K, or Vox Populi mod authors.
