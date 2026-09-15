# History JSON import/export

**Date:** 2026-09-14  
**Status:** Approved design  
**Goal:** Export and import match history as a versioned portable JSON file from the History tab, with Merge and Replace modes.

## Problem

Match data lives only in on-device SQLite. There is no way to back up history, move it between devices/installs, or reset the DB to a known fixture for development testing.

## Decision

**Portable domain JSON** keyed by player names and event-type keys (not raw DB IDs), plus History-tab file pick/share via Expo modules.

Rejected alternatives:

- **Raw table dump:** fragile under merge (ID collisions); Replace-only is safer but not portable across reinstalls cleanly.
- **Content-hash dedup on merge:** useful later; out of scope for v1 (merge always appends games).

## Format

```json
{
  "format": "civ-app-history",
  "version": 1,
  "exportedAt": "ISO-8601",
  "players": [{ "name": "Alice" }],
  "eventTypes": [{ "key": "custom_foo", "label": "Foo", "isBuiltin": false }],
  "games": [
    {
      "startedAt": "...",
      "endedAt": "...",
      "civilizationKey": "...",
      "leaderKey": "...",
      "participants": [
        { "playerName": "Alice", "civilizationKey": "...", "leaderKey": "..." }
      ],
      "winner": { "kind": "human", "playerNames": ["Alice"] },
      "events": [
        {
          "eventTypeKey": "wonder_built",
          "round": 42,
          "civilizationKey": "...",
          "targetKey": null,
          "targetLabel": null,
          "createdAt": "..."
        }
      ]
    }
  ]
}
```

Rules:

- Identity is by **name** (players, case-insensitive match on import) and **key** (event types, civ/leader).
- Builtin event types may be omitted from `eventTypes`; customs required for any custom keys used in events.
- Human winners use `playerNames`; AI winners use civ/leader keys.
- Optional reserved match fields (`mapType`, `difficulty`, `victoryType`, `score`, `turnCount`, `notes`, `won`) are included when present for forward compatibility.
- Opaque civ/leader keys are accepted (same as DB storage).
- Reject unknown `format`, unsupported `version`, or invalid structure before any writes.

## Scope

**In scope:** players (as needed for history), custom event types, games with participants/winners/events.

**Out of scope:** user preferences, cloud sync, merge deduplication by content hash.

## Import modes

### Merge

- Ensure players by name (create missing active players).
- Ensure custom event types by key (create missing).
- Append every game as new (remap winners/events to local IDs).
- Leave existing games and preferences untouched.

### Replace (clean slate)

Destructive; requires an extra confirmation in the UI.

- Delete all `game_events`, `game_players`, `games`.
- Hard-delete all players, then recreate from the file (clean IDs for testing).
- Delete custom event types whose keys are not in the file; never delete builtins; add missing customs from the file.
- Insert all games from the file.
- Preferences unchanged.
- Resulting history + roster should match the file.

Imports run in a SQLite transaction when available; otherwise ordered operations with fail-loud errors (no silent partial success messaging).

## UI

History tab (`app/(tabs)/history.tsx`):

1. **Export** — choose Share (system share sheet) or Save to Downloads (Android SAF / iOS Documents / web download).
2. **Import** — choose Merge or Replace; Replace needs a second confirm.
3. Document picker → validate → import → reload list → alert with counts / errors.

## Modules

| Piece | Role |
| ----- | ---- |
| `types/historyTransfer.ts` | Document types + `format` / `version` constants |
| `services/historyTransferService.ts` | Build, validate, merge/replace import |
| `utils/historyTransferFiles.ts` | Document picker, temp write, sharing |
| Repository bulk helpers | Clear history; hard-delete players; delete orphan custom event types |
| Expo packages | `expo-document-picker`, `expo-file-system`, `expo-sharing` |

## Architecture

```text
HistoryScreen → historyTransferFiles + historyTransferService
historyTransferService → PlayerRepository / GameRepository / GameEventRepository
historyTransferFiles → DocumentPicker / FileSystem / Sharing
```

## Error handling

- Invalid JSON or schema → alert; no DB writes.
- Runtime import failure → surface message; transaction rollback when supported.
- Cancelled picker / share → no-op (not an error).

## Verification

- `npm run typecheck`
- Manual: export → merge into existing data → replace from same file → history and players match file; builtin event types remain
