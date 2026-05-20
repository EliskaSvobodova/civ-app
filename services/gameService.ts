import { desc, eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { Platform } from 'react-native';

import { gamePlayers, games, getDatabase, players } from '@/database';
import type { Civilization } from '@/types';

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
  playerName: string;
  civilizationName: string;
  leaderName: string;
  civilizationKey: string;
};

export type GameHistoryEntry = {
  id: number;
  startedAt: string;
  participants: GameHistoryParticipant[];
};

type GameHistoryRow = {
  game_id: number;
  created_at: string;
  player_name: string;
  civilization_key: string;
  leader_key: string;
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
  notes: string | null;
  played_at: string;
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
    notes: row.notes,
    playedAt: row.played_at,
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

function resolveParticipant(
  playerName: string,
  civilizationKey: string,
  leaderKey: string,
): GameHistoryParticipant {
  const civilization = getCivilizationByKey(civilizationKey);
  return {
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
      entry = {
        id: row.game_id,
        startedAt: row.created_at,
        participants: [],
      };
      byGame.set(row.game_id, entry);
    }
    entry.participants.push(
      resolveParticipant(row.player_name, row.civilization_key, row.leader_key),
    );
  }

  return Array.from(byGame.values());
}

export async function getGameHistory(): Promise<GameHistoryEntry[]> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const rows = await sqlite.getAllAsync<GameHistoryRow>(
      `SELECT g.id AS game_id, g.created_at, p.name AS player_name,
              gp.civilization_key, gp.leader_key
       FROM games g
       INNER JOIN game_players gp ON gp.game_id = g.id
       INNER JOIN players p ON p.id = gp.player_id
       ORDER BY g.created_at DESC, p.name ASC`,
    );
    return groupGameHistoryRows(rows);
  }

  const db = getDatabase();
  const rows = await db
    .select({
      gameId: games.id,
      createdAt: games.createdAt,
      playerName: players.name,
      civilizationKey: gamePlayers.civilizationKey,
      leaderKey: gamePlayers.leaderKey,
    })
    .from(games)
    .innerJoin(gamePlayers, eq(gamePlayers.gameId, games.id))
    .innerJoin(players, eq(players.id, gamePlayers.playerId))
    .orderBy(desc(games.createdAt), players.name);

  return groupGameHistoryRows(
    rows.map((row) => ({
      game_id: row.gameId,
      created_at: row.createdAt,
      player_name: row.playerName,
      civilization_key: row.civilizationKey,
      leader_key: row.leaderKey,
    })),
  );
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
      `INSERT INTO games (civilization_key, leader_key, played_at, created_at)
       VALUES (?, ?, ?, ?)`,
      civilizationKey,
      leaderKey,
      now,
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
              score, turn_count, won, notes, played_at, created_at
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
