# Statistics Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show human/AI split on top civilizations, rank team winners as team entities, and label the game-length axis with five whole-day ticks.

**Architecture:** Extend pure aggregators in `utils/gameWins.ts`, extract axis-tick helpers next to the chart, wire names in `gameService`, update `stats.tsx` copy/keys. TDD for aggregation and ticks; UI follows types.

**Tech Stack:** Expo/React Native, TypeScript, Vitest

## Global Constraints

- Civ win line: `{wins} wins · {humanWins} human, {aiWins} AI` (always both counts)
- Team win does not increment solo totals; same sorted player set = one entry
- Axis: `axisMax = max(maxDays, 4)`; ticks `round(i * axisMax / 4)` for `i = 0..4`; whole days only
- Top 3 limits and empty-state thresholds unchanged

## File Structure

| File | Responsibility |
| --- | --- |
| `utils/gameWins.ts` | Civ win split + entity-keyed player wins |
| `utils/gameWins.test.ts` | Aggregation tests |
| `utils/gameLengthAxis.ts` | Axis max + tick helpers |
| `utils/gameLengthAxis.test.ts` | Tick tests |
| `components/stats/GameLengthAxisChart.tsx` | Use helpers for scale/ticks |
| `services/gameService.ts` | Build solo/team/AI leaderboard entries |
| `app/(tabs)/stats.tsx` | Civ copy + stable list keys |

---

### Task 1: Civilization win human/AI split

**Files:**
- Modify: `utils/gameWins.ts`
- Modify: `utils/gameWins.test.ts`
- Modify: `app/(tabs)/stats.tsx` (display)

**Interfaces:**
- Produces: `CivilizationWinCount = { civilizationKey, wins, humanWins, aiWins }`

- [x] **Step 1: Update failing tests for civ aggregation**

```ts
expect(result).toEqual([
  { civilizationKey: 'america', wins: 2, humanWins: 2, aiWins: 0 },
  { civilizationKey: 'aztec', wins: 1, humanWins: 0, aiWins: 1 },
  { civilizationKey: 'rome', wins: 1, humanWins: 1, aiWins: 0 },
]);
```

- [x] **Step 2: Run test — expect FAIL** on missing fields

- [x] **Step 3: Implement split in `aggregateCivilizationWins`**

- [x] **Step 4: Update stats card to show one-line breakdown; run tests PASS**

- [x] **Step 5: Commit** `feat: show human/AI split on civilization wins`

---

### Task 2: Team-aware player leaderboard

**Files:**
- Modify: `utils/gameWins.ts`, `utils/gameWins.test.ts`
- Modify: `services/gameService.ts`
- Modify: `app/(tabs)/stats.tsx`

**Interfaces:**
- Produces: `PlayerWinLeaderboardEntry = { kind: 'human' \| 'team' \| 'ai'; playerIds: number[]; name: string; wins: number }`
- `aggregatePlayerWins` keys: `ai` or `serializeWinnerPlayerIds(ids)` (`"[1]"`, `"[1,2]"`)

- [x] **Step 1: Failing tests** — team win one key; reordered ids same key; solo + team separate; AI unchanged

- [x] **Step 2: Run — FAIL**

- [x] **Step 3: Implement aggregation + service name resolution + stats keys** (`ai` / `human-{id}` / `team-{ids}`)

- [x] **Step 4: Tests PASS**

- [x] **Step 5: Commit** `feat: rank team winners as leaderboard entities`

---

### Task 3: Game length five whole-day ticks

**Files:**
- Create: `utils/gameLengthAxis.ts`, `utils/gameLengthAxis.test.ts`
- Modify: `components/stats/GameLengthAxisChart.tsx`

**Interfaces:**
- Produces: `gameLengthAxisMax(maxDays)`, `gameLengthAxisTicks(maxDays)`

- [x] **Step 1: Failing tests** — maxDays 2 → `[0,1,2,3,4]`; maxDays 10 → `[0,3,5,8,10]`

- [x] **Step 2: Run — FAIL**

- [x] **Step 3: Implement helpers; chart uses `axisMax` for positions and ticks**

- [x] **Step 4: Tests PASS + typecheck**

- [x] **Step 5: Commit** `fix: show five whole-day ticks on game length axis`
