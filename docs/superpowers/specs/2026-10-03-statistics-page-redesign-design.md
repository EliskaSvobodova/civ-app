# Statistics page redesign

**Date:** 2026-10-03  
**Status:** Approved design  
**Goal:** Clarify top-civilization win sources (human vs AI), rank team winners as team entities, and make the game-length day axis easier to read with at least five whole-day ticks.

## Problem

The Statistics tab already shows top civilizations, top players, and a game-length scatter axis, but:

1. Civilization win counts are a single total — players cannot see how many wins came from human winners vs AI winners.
2. Team wins credit each human individually, so teams never appear as leaderboard entities.
3. The game-length chart only labels about three day values, which makes it hard to read how many days each point represents.

## Decision

**Extend existing aggregation in `utils/gameWins.ts`**, keep `stats.tsx` as presentation, and fix tick generation in `GameLengthAxisChart`.

Rejected alternatives:

- **Parallel aggregators only for stats:** extra indirection; nothing else depends on today’s per-player team credit.
- **UI-only counting in the screen:** harder to test and reuse.

## Top civilizations

### Data

Extend `CivilizationWinCount`:

| Field | Meaning |
| --- | --- |
| `civilizationKey` | Civilization key |
| `wins` | Total wins (`humanWins + aiWins`) |
| `humanWins` | Wins where a human winner played that civ |
| `aiWins` | Wins where that civ was the AI winner |

Ranking remains by `wins` descending, then `civilizationKey` ascending. Service still returns top 3.

Counting rules stay the same as today for *which* civs get credit; only the split is new:

- Human winner → increment `humanWins` (and `wins`) for each winner participant’s civilization.
- AI winner → increment `aiWins` (and `wins`) for `winner_civilization_key`.

### UI

One secondary line under the civilization header:

`{wins} wins · {humanWins} human, {aiWins} AI`

Always show both human and AI counts (including zeros). Keep existing “win/wins” pluralization for the total.

## Top players

### Data

One leaderboard entry per **winning entity** per match:

| Winner | Entity key | Display name |
| --- | --- | --- |
| Solo human | single player id | Player name |
| Team (2+ humans) | sorted unique player ids | `Team: Name1, Name2` (match-history style) |
| AI | shared `ai` bucket | `AI` |

Rules:

- A team win increments **only** that team entity — it does **not** add to any solo total.
- The same player set in any order maps to the same team entry.
- Alice solo and Team: Alice, Bob are distinct entries and can both appear.
- AI remains one bucket across all AI civilizations (“Any civilization” subtitle unchanged).
- Rank by wins descending, then name (case-insensitive); still show top 3.

### UI

Reuse the existing player card shell. Name is the entity label; win line stays `{n} win(s)` with no human/AI split. List keys must identify teams stably (not only a single `playerId`).

## Game length axis

- Plot positions still use each match’s real duration in whole days.
- Axis scale: `axisMax = max(maxDays, 4)`.
- Always render **five** tick labels using whole days only (never fractions):
  - `ticks[i] = round(i * axisMax / 4)` for `i = 0..4`
  - Deduplicate only if rounding collapses values (should not happen when `axisMax >= 4`); endpoints remain `0` and `axisMax`.
- Examples: `maxDays = 2` → `axisMax = 4` → `0, 1, 2, 3, 4`; `maxDays = 10` → `0, 3, 5, 8, 10`.
- Chart caption and “show when ≥ 3 durations” threshold unchanged.

## Scope

**In scope:** civilization win breakdown, team-aware player leaderboard, game-length tick labels/scale floor.

**Out of scope:** changing how many entries are shown (still top 3), new chart types, filtering by date/player, redesign of other Statistics empty states.

## Touch points

- `utils/gameWins.ts` — types + aggregation
- `services/gameService.ts` — resolve names for solo/team entries
- `app/(tabs)/stats.tsx` — civ win copy; stable keys for teams
- `components/stats/GameLengthAxisChart.tsx` — axis max + five integer ticks
- `utils/gameWins.test.ts` (+ chart tick helper test if tick logic is extracted)

## Error handling

Unchanged: failed stats load clears leaderboards and durations; no new failure modes.

## Tests

- Civilization aggregation splits human vs AI; totals and sort order correct.
- Team win → one team entry; id order does not create duplicates; solo + overlapping team stay separate; AI bucket unchanged.
- Chart ticks: short span floors to max 4 with five whole-day labels; longer spans still yield five whole-day labels including 0 and axis max.
