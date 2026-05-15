# Civ App

A mobile companion app for **Sid Meier’s Civilization V** players focused on:

* intelligent civilization selection,
* leader pick history tracking,
* and long-term gameplay statistics.

The project is intentionally designed as:

* **offline-first**,
* lightweight,
* easy to maintain,
* and optimized for rapid AI-assisted development using Cursor

---

# Core Features

## Civilization selection

* Completely random civilization selection
* Random selection from custom subsets - civilizations not played recently
* Weighted randomization based on player preferences - non-warmonger civilizations
* Multiplayer-compatible leader selection - unique civilization for each player according to his/her preferences
* Configurable multi-choice (the app offers the number of leaders to choose from)
* Storing each player's final selection

---

## Match History & Statistics

* win/loss results,
* victory conditions,
* civilization used,
* game score,
* map type,
* difficulty,
* turn count,
* strongest civilizations encountered,
* notable game events,
* multiplayer participants,
* and custom notes.

---

# Project Goals

## Primary Goals

* Create a useful companion app for Civilization V players
* Explore AI-assisted (“vibe coding”) development workflows

---

# Technology Stack

- App Framework
    - React Native - A cross-platform framework for building native mobile apps using React and JavaScript/TypeScript. It allows you to share most code between iOS and Android while still rendering native UI components.
    - Expo - A development platform and toolkit built around React Native. It simplifies setup, builds, updates, device APIs, and deployment, making mobile development faster and easier—especially for solo or small-team projects.
    - TypeScript - A typed superset of JavaScript that improves code reliability, autocomplete, refactoring, and long-term maintainability. Particularly valuable as the app grows in complexity.
- Local Database
    - Expo SQLite - A lightweight embedded SQL database that runs directly on the device. Ideal for offline-first apps and storing structured game/session data locally without requiring a backend.
    - Drizzle ORM - A modern TypeScript ORM with strong type safety and SQL-like schema definitions. It provides a clean developer experience while keeping database queries explicit and performant.
- UI
    - NativeWind - A Tailwind CSS-style utility framework for React Native. It enables fast, consistent styling using utility classes while keeping UI code concise and scalable.
    - React Native Paper - A Material Design component library for React Native. It provides polished prebuilt components like buttons, dialogs, cards, menus, and forms with consistent theming support.
- Navigation
    - Expo Router - A file-based routing system for Expo and React Native inspired by Next.js. It simplifies navigation structure, deep linking, nested layouts, and screen organization.
- State Management
    - Zustand - A lightweight and minimal state management library for React. It avoids boilerplate while making global app state simple, fast, and scalable.
- Charts & Statistics
    - Victory Native XL - A charting library designed for React Native with strong support for customizable and animated data visualizations such as line charts, bar charts, and pie charts.
    - or React Native Chart Kit - A simpler charting library focused on quick setup and common mobile chart types. Useful for lightweight dashboards and basic statistics screens.
- Data Source for Civ V Content
    - static JSON files
- Authentication
    - local-only app for now
- Analytics (later)
    - Sentry - An error tracking and performance monitoring platform. It helps detect crashes, log issues, and monitor app stability in production environments.

---

# Architecture Overview

The application follows a modular, feature-oriented architecture.

## Key Principles

* Offline-first design
* Strong TypeScript typing
* Clear separation of concerns
* Reusable UI components
* Minimal global state
* Scalable folder organization

---

# Data Model Overview

Planned core entities:

* Civilization
* Leader
* Game
* Player
* MatchResult
* GameEvent
* VictoryType
* MapType
* Difficulty
* UserPreferences

---

# Project Structure

Example project structure:

```txt
app/
components/
database/
hooks/
services/
store/
types/
assets/data/
```

## Folder Responsibilities

| Folder         | Purpose                      |
| -------------- | ---------------------------- |
| `app/`         | Screens and routing          |
| `components/`  | Reusable UI components       |
| `database/`    | Database schema and queries  |
| `hooks/`       | Custom React hooks           |
| `services/`    | Business logic and utilities |
| `store/`       | Zustand state stores         |
| `types/`       | Shared TypeScript types      |
| `assets/data/` | Static Civilization V data   |

---

# Development Setup

## Requirements

* Node.js (LTS)
* npm
* Expo CLI
* Android Studio
* Cursor
* Git

---

## Recommended Commands

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm start
```

### Launch Android emulator

```bash
npm run android
```

---

# License

TBD

---

# Disclaimer

Civilization V and related assets are property of their respective owners.

This project is an unofficial fan-made companion application and is not affiliated with or endorsed by Firaxis Games or 2K.
