import { desc, eq, inArray, isNotNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { Platform } from 'react-native';

import { gamePlayers, games, getDatabase, players } from '@/database';
import type { Civilization } from '@/types';
import { gameDurationDays } from '@/utils/gameDateTime';

import {
  getCivilizationByKey,
  getCivilizationSlug,
  getLeaderKey,
} from './civilizationService';

export type Game = InferSelectModel<typeof games>;
export type GamePlayerRow = InferSelectModel<typeof gamePlayers>;

export type CreateGameAssignment = {
  playerId: number;
  civilization: Civilization;
};

export type GameHistoryParticipant = {
  playerId: number;
  playerName: string;
  civilizationName: string;
  leaderName: string;
  civilizationKey: string;
};

export type GameWinner =
  | { kind: 'human'; playerIds: number[] }
  | { kind: 'ai'; civilizationKey: string; leaderKey: string };

export type UpdateGameWinnerInput = GameWinner;

export type UpdateGameMatchInput = {
  startedAt: string;
  endedAt: string;
  winner: UpdateGameWinnerInput;
};

export type GameHistoryEntry = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  participants: GameHistoryParticipant[];
  winner: GameWinner | null;
  winnerLabel: string | null;
};

export type CivilizationWinCount = {
  civilizationKey: string;
  wins: number;
};

export type PlayerWinLeaderboardEntry = {
  kind: 'human' | 'ai';
  playerId: number | null;
  name: string;
  wins: number;
};

const AI_LEADERBOARD_KEY = 'ai';

type GameHistoryRow = {
  game_id: number;
  played_at: string;
  ended_at: string | null;
  player_id: number;
  player_name: string;
  civilization_key: string;
  leader_key: string;
  winner_kind: string | null;
  winner_player_ids: string | null;
  winner_civilization_key: string | null;
  winner_leader_key: string | null;
};

type GameRow = {
  id: number;
  civilization_key: string;
  leader_key: string;
  map_type: string | null;
  difficulty: string | null;
  victory_type: string | null;
  score: number | null;
  turn_count: number | null;
  won: number | null;
  winner_kind: string | null;
  winner_player_ids: string | null;
  winner_civilization_key: string | null;
  winner_leader_key: string | null;
  notes: string | null;
  played_at: string;
  ended_at: string | null;
  created_at: string;
};

type GamePlayerDbRow = {
  id: number;
  game_id: number;
  player_id: number;
  civilization_key: string;
  leader_key: string;
};

function mapGameRow(row: GameRow): Game {
  return {
    id: row.id,
    civilizationKey: row.civilization_key,
    leaderKey: row.leader_key,
    mapType: row.map_type,
    difficulty: row.difficulty,
    victoryType: row.victory_type,
    score: row.score,
    turnCount: row.turn_count,
    won: row.won === null ? null : Boolean(row.won),
    winnerKind: row.winner_kind,
    winnerPlayerIds: row.winner_player_ids,
    winnerCivilizationKey: row.winner_civilization_key,
    winnerLeaderKey: row.winner_leader_key,
    notes: row.notes,
    playedAt: row.played_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

function mapGamePlayerRow(row: GamePlayerDbRow): GamePlayerRow {
  return {
    id: row.id,
    gameId: row.game_id,
    playerId: row.player_id,
    civilizationKey: row.civilization_key,
    leaderKey: row.leader_key,
  };
}

function useAsyncSqlite(): boolean {
  return Platform.OS === 'web';
}

function parseWinnerPlayerIds(raw: string | null): number[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is number => typeof value === 'number');
  } catch {
    return [];
  }
}

function serializeWinnerPlayerIds(playerIds: number[]): string {
  return JSON.stringify([...new Set(playerIds)].sort((a, b) => a - b));
}

function parseWinnerFromRow(row: GameHistoryRow): GameWinner | null {
  if (row.winner_kind === 'human') {
    const playerIds = parseWinnerPlayerIds(row.winner_player_ids);
    return playerIds.length > 0 ? { kind: 'human', playerIds } : null;
  }
  if (row.winner_kind === 'ai' && row.winner_civilization_key) {
    return {
      kind: 'ai',
      civilizationKey: row.winner_civilization_key,
      leaderKey: row.winner_leader_key ?? row.winner_civilization_key,
    };
  }
  return null;
}

function formatWinnerLabel(
  winner: GameWinner | null,
  participants: GameHistoryParticipant[],
): string | null {
  if (!winner) {
    return null;
  }

  if (winner.kind === 'ai') {
    const civilization = getCivilizationByKey(winner.civilizationKey);
    const civName = civilization?.name ?? winner.civilizationKey;
    const leaderName = civilization?.leader.name ?? winner.leaderKey;
    return `AI: ${civName} (${leaderName})`;
  }

  const names = winner.playerIds
    .map((playerId) => participants.find((participant) => participant.playerId === playerId))
    .filter((participant): participant is GameHistoryParticipant => participant != null)
    .map((participant) => participant.playerName);

  if (names.length === 0) {
    return null;
  }

  if (names.length === 1) {
    return names[0];
  }

  return `Team: ${names.join(', ')}`;
}

function resolveParticipant(
  playerId: number,
  playerName: string,
  civilizationKey: string,
  leaderKey: string,
): GameHistoryParticipant {
  const civilization = getCivilizationByKey(civilizationKey);
  return {
    playerId,
    playerName,
    civilizationKey,
    civilizationName: civilization?.name ?? civilizationKey,
    leaderName: civilization?.leader.name ?? leaderKey,
  };
}

function groupGameHistoryRows(rows: GameHistoryRow[]): GameHistoryEntry[] {
  const byGame = new Map<number, GameHistoryEntry>();

  for (const row of rows) {
    let entry = byGame.get(row.game_id);
    if (!entry) {
      const winner = parseWinnerFromRow(row);
      entry = {
        id: row.game_id,
        startedAt: row.played_at,
        endedAt: row.ended_at,
        participants: [],
        winner,
        winnerLabel: null,
      };
      byGame.set(row.game_id, entry);
    }
    entry.participants.push(
      resolveParticipant(
        row.player_id,
        row.player_name,
        row.civilization_key,
        row.leader_key,
      ),
    );
  }

  for (const entry of byGame.values()) {
    entry.winnerLabel = formatWinnerLabel(entry.winner, entry.participants);
  }

  return Array.from(byGame.values());
}

export async function getGameHistory(): Promise<GameHistoryEntry[]> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const rows = await sqlite.getAllAsync<GameHistoryRow>(
      `SELECT g.id AS game_id, g.played_at, g.ended_at, p.id AS player_id, p.name AS player_name,
              gp.civilization_key, gp.leader_key,
              g.winner_kind, g.winner_player_ids, g.winner_civilization_key, g.winner_leader_key
       FROM games g
       INNER JOIN game_players gp ON gp.game_id = g.id
       INNER JOIN players p ON p.id = gp.player_id
       ORDER BY g.played_at DESC, p.name ASC`,
    );
    return groupGameHistoryRows(rows);
  }

  const db = getDatabase();
  const rows = await db
    .select({
      gameId: games.id,
      playedAt: games.playedAt,
      endedAt: games.endedAt,
      playerId: players.id,
      playerName: players.name,
      civilizationKey: gamePlayers.civilizationKey,
      leaderKey: gamePlayers.leaderKey,
      winnerKind: games.winnerKind,
      winnerPlayerIds: games.winnerPlayerIds,
      winnerCivilizationKey: games.winnerCivilizationKey,
      winnerLeaderKey: games.winnerLeaderKey,
    })
    .from(games)
    .innerJoin(gamePlayers, eq(gamePlayers.gameId, games.id))
    .innerJoin(players, eq(players.id, gamePlayers.playerId))
    .orderBy(desc(games.playedAt), players.name);

  return groupGameHistoryRows(
    rows.map((row) => ({
      game_id: row.gameId,
      played_at: row.playedAt,
      ended_at: row.endedAt,
      player_id: row.playerId,
      player_name: row.playerName,
      civilization_key: row.civilizationKey,
      leader_key: row.leaderKey,
      winner_kind: row.winnerKind,
      winner_player_ids: row.winnerPlayerIds,
      winner_civilization_key: row.winnerCivilizationKey,
      winner_leader_key: row.winnerLeaderKey,
    })),
  );
}

function winnerFields(winner: UpdateGameWinnerInput) {
  return {
    winnerKind: winner.kind,
    winnerPlayerIds:
      winner.kind === 'human' ? serializeWinnerPlayerIds(winner.playerIds) : null,
    winnerCivilizationKey: winner.kind === 'ai' ? winner.civilizationKey : null,
    winnerLeaderKey: winner.kind === 'ai' ? winner.leaderKey : null,
  };
}

export async function updateGameWinner(
  gameId: number,
  winner: UpdateGameWinnerInput,
): Promise<void> {
  const { winnerKind, winnerPlayerIds, winnerCivilizationKey, winnerLeaderKey } =
    winnerFields(winner);

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const result = await sqlite.runAsync(
      `UPDATE games
       SET winner_kind = ?, winner_player_ids = ?, winner_civilization_key = ?, winner_leader_key = ?
       WHERE id = ?`,
      winnerKind,
      winnerPlayerIds,
      winnerCivilizationKey,
      winnerLeaderKey,
      gameId,
    );
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
    return;
  }

  const db = getDatabase();
  const updated = await db
    .update(games)
    .set({
      winnerKind,
      winnerPlayerIds,
      winnerCivilizationKey,
      winnerLeaderKey,
    })
    .where(eq(games.id, gameId))
    .returning({ id: games.id });

  if (updated.length === 0) {
    throw new Error('Game not found');
  }
}

export async function updateGameStartedAt(gameId: number, startedAt: string): Promise<void> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const result = await sqlite.runAsync(
      `UPDATE games SET played_at = ? WHERE id = ?`,
      startedAt,
      gameId,
    );
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
    return;
  }

  const db = getDatabase();
  const updated = await db
    .update(games)
    .set({ playedAt: startedAt })
    .where(eq(games.id, gameId))
    .returning({ id: games.id });

  if (updated.length === 0) {
    throw new Error('Game not found');
  }
}

export async function deleteGame(gameId: number): Promise<void> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    await sqlite.runAsync(`DELETE FROM game_players WHERE game_id = ?`, gameId);
    const result = await sqlite.runAsync(`DELETE FROM games WHERE id = ?`, gameId);
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
    return;
  }

  const db = getDatabase();
  await db.delete(gamePlayers).where(eq(gamePlayers.gameId, gameId));
  const deleted = await db
    .delete(games)
    .where(eq(games.id, gameId))
    .returning({ id: games.id });

  if (deleted.length === 0) {
    throw new Error('Game not found');
  }
}

export async function updateGameMatch(
  gameId: number,
  input: UpdateGameMatchInput,
): Promise<void> {
  const { winnerKind, winnerPlayerIds, winnerCivilizationKey, winnerLeaderKey } =
    winnerFields(input.winner);

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const result = await sqlite.runAsync(
      `UPDATE games
       SET played_at = ?, ended_at = ?, winner_kind = ?, winner_player_ids = ?,
           winner_civilization_key = ?, winner_leader_key = ?
       WHERE id = ?`,
      input.startedAt,
      input.endedAt,
      winnerKind,
      winnerPlayerIds,
      winnerCivilizationKey,
      winnerLeaderKey,
      gameId,
    );
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
    return;
  }

  const db = getDatabase();
  const updated = await db
    .update(games)
    .set({
      playedAt: input.startedAt,
      endedAt: input.endedAt,
      winnerKind,
      winnerPlayerIds,
      winnerCivilizationKey,
      winnerLeaderKey,
    })
    .where(eq(games.id, gameId))
    .returning({ id: games.id });

  if (updated.length === 0) {
    throw new Error('Game not found');
  }
}

export async function createGame(
  assignments: CreateGameAssignment[],
): Promise<{ game: Game; gamePlayers: GamePlayerRow[] }> {
  if (assignments.length === 0) {
    throw new Error('At least one player is required');
  }

  const first = assignments[0];
  const civilizationKey = getCivilizationSlug(first.civilization);
  const leaderKey = getLeaderKey(first.civilization);
  const now = new Date().toISOString();

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;

    const gameResult = await sqlite.runAsync(
      `INSERT INTO games (civilization_key, leader_key, played_at, ended_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      civilizationKey,
      leaderKey,
      now,
      null,
      now,
    );
    const gameId = gameResult.lastInsertRowId;

    const insertedPlayers: GamePlayerRow[] = [];
    for (const assignment of assignments) {
      const civKey = getCivilizationSlug(assignment.civilization);
      const leadKey = getLeaderKey(assignment.civilization);
      const playerResult = await sqlite.runAsync(
        `INSERT INTO game_players (game_id, player_id, civilization_key, leader_key)
         VALUES (?, ?, ?, ?)`,
        gameId,
        assignment.playerId,
        civKey,
        leadKey,
      );
      const row = await sqlite.getFirstAsync<GamePlayerDbRow>(
        `SELECT id, game_id, player_id, civilization_key, leader_key
         FROM game_players WHERE id = ?`,
        playerResult.lastInsertRowId,
      );
      if (!row) {
        throw new Error('Failed to create game player');
      }
      insertedPlayers.push(mapGamePlayerRow(row));
    }

    const gameRow = await sqlite.getFirstAsync<GameRow>(
      `SELECT id, civilization_key, leader_key, map_type, difficulty, victory_type,
              score, turn_count, won, notes, played_at, ended_at, created_at
       FROM games WHERE id = ?`,
      gameId,
    );
    if (!gameRow) {
      throw new Error('Failed to create game');
    }

    return { game: mapGameRow(gameRow), gamePlayers: insertedPlayers };
  }

  const db = getDatabase();

  const [game] = await db
    .insert(games)
    .values({
      civilizationKey,
      leaderKey,
      playedAt: now,
      endedAt: null,
      createdAt: now,
    })
    .returning();

  if (!game) {
    throw new Error('Failed to create game');
  }

  const insertedPlayers = await db
    .insert(gamePlayers)
    .values(
      assignments.map((assignment) => ({
        gameId: game.id,
        playerId: assignment.playerId,
        civilizationKey: getCivilizationSlug(assignment.civilization),
        leaderKey: getLeaderKey(assignment.civilization),
      })),
    )
    .returning();

  return { game, gamePlayers: insertedPlayers };
}

type GameWinnerRow = {
  id: number;
  winner_kind: string;
  winner_player_ids: string | null;
  winner_civilization_key: string | null;
};

type GamePlayerCivRow = {
  game_id: number;
  player_id: number;
  civilization_key: string;
};

async function fetchGamesWithWinners(): Promise<GameWinnerRow[]> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    return sqlite.getAllAsync<GameWinnerRow>(
      `SELECT id, winner_kind, winner_player_ids, winner_civilization_key
       FROM games
       WHERE winner_kind IS NOT NULL`,
    );
  }

  const db = getDatabase();
  const gameRows = await db
    .select({
      id: games.id,
      winnerKind: games.winnerKind,
      winnerPlayerIds: games.winnerPlayerIds,
      winnerCivilizationKey: games.winnerCivilizationKey,
    })
    .from(games)
    .where(isNotNull(games.winnerKind));

  return gameRows.map((row) => ({
    id: row.id,
    winner_kind: row.winnerKind!,
    winner_player_ids: row.winnerPlayerIds,
    winner_civilization_key: row.winnerCivilizationKey,
  }));
}

async function fetchGamePlayerRows(gameIds: number[]): Promise<GamePlayerCivRow[]> {
  if (gameIds.length === 0) {
    return [];
  }

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const placeholders = gameIds.map(() => '?').join(', ');
    return sqlite.getAllAsync<GamePlayerCivRow>(
      `SELECT game_id, player_id, civilization_key
       FROM game_players
       WHERE game_id IN (${placeholders})`,
      ...gameIds,
    );
  }

  const db = getDatabase();
  const playerRows = await db
    .select({
      gameId: gamePlayers.gameId,
      playerId: gamePlayers.playerId,
      civilizationKey: gamePlayers.civilizationKey,
    })
    .from(gamePlayers)
    .where(inArray(gamePlayers.gameId, gameIds));

  return playerRows.map((row) => ({
    game_id: row.gameId,
    player_id: row.playerId,
    civilization_key: row.civilizationKey,
  }));
}

async function resolvePlayerNames(playerIds: number[]): Promise<Map<number, string>> {
  if (playerIds.length === 0) {
    return new Map();
  }

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const placeholders = playerIds.map(() => '?').join(', ');
    const rows = await sqlite.getAllAsync<{ id: number; name: string }>(
      `SELECT id, name FROM players WHERE id IN (${placeholders})`,
      ...playerIds,
    );
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  const db = getDatabase();
  const rows = await db
    .select({ id: players.id, name: players.name })
    .from(players)
    .where(inArray(players.id, playerIds));

  return new Map(rows.map((row) => [row.id, row.name]));
}

function aggregateCivilizationWins(
  gameRows: GameWinnerRow[],
  playerRows: GamePlayerCivRow[],
): CivilizationWinCount[] {
  const playersByGame = new Map<number, GamePlayerCivRow[]>();
  for (const row of playerRows) {
    const list = playersByGame.get(row.game_id) ?? [];
    list.push(row);
    playersByGame.set(row.game_id, list);
  }

  const winCounts = new Map<string, number>();

  const increment = (civilizationKey: string) => {
    winCounts.set(civilizationKey, (winCounts.get(civilizationKey) ?? 0) + 1);
  };

  for (const game of gameRows) {
    if (game.winner_kind === 'ai' && game.winner_civilization_key) {
      increment(game.winner_civilization_key);
      continue;
    }

    if (game.winner_kind !== 'human') {
      continue;
    }

    const winnerPlayerIds = parseWinnerPlayerIds(game.winner_player_ids);
    if (winnerPlayerIds.length === 0) {
      continue;
    }

    const participants = playersByGame.get(game.id) ?? [];
    const winnerIdSet = new Set(winnerPlayerIds);
    for (const participant of participants) {
      if (winnerIdSet.has(participant.player_id)) {
        increment(participant.civilization_key);
      }
    }
  }

  return Array.from(winCounts.entries())
    .map(([civilizationKey, wins]) => ({ civilizationKey, wins }))
    .sort((a, b) => b.wins - a.wins || a.civilizationKey.localeCompare(b.civilizationKey));
}

function aggregatePlayerWins(gameRows: GameWinnerRow[]): Map<string, number> {
  const winCounts = new Map<string, number>();

  const increment = (key: string) => {
    winCounts.set(key, (winCounts.get(key) ?? 0) + 1);
  };

  for (const game of gameRows) {
    if (game.winner_kind === 'ai') {
      increment(AI_LEADERBOARD_KEY);
      continue;
    }

    if (game.winner_kind !== 'human') {
      continue;
    }

    for (const playerId of parseWinnerPlayerIds(game.winner_player_ids)) {
      increment(String(playerId));
    }
  }

  return winCounts;
}

function sortPlayerLeaderboard(
  entries: PlayerWinLeaderboardEntry[],
): PlayerWinLeaderboardEntry[] {
  return entries.sort(
    (a, b) => b.wins - a.wins || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}

export async function getTopCivilizationsByWins(
  limit = 3,
): Promise<CivilizationWinCount[]> {
  if (limit <= 0) {
    return [];
  }

  const gameRows = await fetchGamesWithWinners();
  if (gameRows.length === 0) {
    return [];
  }

  const playerRows = await fetchGamePlayerRows(gameRows.map((row) => row.id));
  return aggregateCivilizationWins(gameRows, playerRows).slice(0, limit);
}

export async function getTopPlayersByWins(
  limit = 3,
): Promise<PlayerWinLeaderboardEntry[]> {
  if (limit <= 0) {
    return [];
  }

  const gameRows = await fetchGamesWithWinners();
  if (gameRows.length === 0) {
    return [];
  }

  const winCounts = aggregatePlayerWins(gameRows);
  if (winCounts.size === 0) {
    return [];
  }

  const humanPlayerIds = Array.from(winCounts.keys())
    .filter((key) => key !== AI_LEADERBOARD_KEY)
    .map((key) => Number(key))
    .filter((id) => Number.isFinite(id));

  const namesById = await resolvePlayerNames(humanPlayerIds);

  const entries: PlayerWinLeaderboardEntry[] = [];
  for (const [key, wins] of winCounts.entries()) {
    if (key === AI_LEADERBOARD_KEY) {
      entries.push({ kind: 'ai', playerId: null, name: 'AI', wins });
      continue;
    }

    const playerId = Number(key);
    if (!Number.isFinite(playerId)) {
      continue;
    }

    entries.push({
      kind: 'human',
      playerId,
      name: namesById.get(playerId) ?? `Player ${playerId}`,
      wins,
    });
  }

  return sortPlayerLeaderboard(entries).slice(0, limit);
}

type GameDateRow = {
  played_at: string;
  ended_at: string | null;
};

export async function getGameDurationDays(): Promise<number[]> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const rows = await sqlite.getAllAsync<GameDateRow>(
      `SELECT played_at, ended_at FROM games ORDER BY played_at ASC`,
    );
    return rows.map((row) =>
      gameDurationDays(row.played_at, row.ended_at ?? row.played_at),
    );
  }

  const db = getDatabase();
  const rows = await db
    .select({
      playedAt: games.playedAt,
      endedAt: games.endedAt,
    })
    .from(games)
    .orderBy(games.playedAt);

  return rows.map((row) =>
    gameDurationDays(row.playedAt, row.endedAt ?? row.playedAt),
  );
}
