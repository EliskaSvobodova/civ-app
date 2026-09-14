import type { SqliteExecutor } from '@/database/sqliteExecutor';

import { mapGamePlayerRow, mapGameRow } from './mappers/gameMapper';
import type {
  Game,
  GameDateRow,
  GameHistoryRow,
  GameMatchUpdateFields,
  GamePlayerCivRow,
  GamePlayerDbRow,
  GamePlayerRow,
  GameRow,
  GameWinnerFields,
  GameWinnerRow,
  InsertGameWithPlayersInput,
} from './types';

export interface GameRepository {
  findHistoryJoinRows(): Promise<GameHistoryRow[]>;
  findAllGameRows(): Promise<GameRow[]>;
  findGamePlayersForGames(gameIds: number[]): Promise<GamePlayerDbRow[]>;
  findRecentCivilizationSlugs(playerId: number, limit: number): Promise<string[]>;
  updateWinner(gameId: number, fields: GameWinnerFields): Promise<void>;
  updateStartedAt(gameId: number, startedAt: string): Promise<void>;
  updateMatch(gameId: number, fields: GameMatchUpdateFields): Promise<void>;
  deleteById(gameId: number): Promise<void>;
  deleteAllHistory(): Promise<void>;
  insertGameWithPlayers(
    input: InsertGameWithPlayersInput,
  ): Promise<{ game: Game; gamePlayers: GamePlayerRow[] }>;
  findGamesWithWinners(): Promise<GameWinnerRow[]>;
  findGamePlayerCivRows(gameIds: number[]): Promise<GamePlayerCivRow[]>;
  findGameDateRows(): Promise<GameDateRow[]>;
}

export class SqliteGameRepository implements GameRepository {
  constructor(private readonly executor: SqliteExecutor) {}

  async findHistoryJoinRows(): Promise<GameHistoryRow[]> {
    return this.executor.getAll<GameHistoryRow>(
      `SELECT g.id AS game_id, g.played_at, g.ended_at, p.id AS player_id, p.name AS player_name,
              gp.civilization_key, gp.leader_key,
              g.winner_kind, g.winner_player_ids, g.winner_civilization_key, g.winner_leader_key
       FROM games g
       INNER JOIN game_players gp ON gp.game_id = g.id
       INNER JOIN players p ON p.id = gp.player_id
       ORDER BY g.played_at DESC, p.name ASC`,
    );
  }

  async findAllGameRows(): Promise<GameRow[]> {
    return this.executor.getAll<GameRow>(
      `SELECT id, civilization_key, leader_key, map_type, difficulty, victory_type,
              score, turn_count, won, winner_kind, winner_player_ids,
              winner_civilization_key, winner_leader_key, notes, played_at, ended_at, created_at
       FROM games
       ORDER BY played_at ASC, id ASC`,
    );
  }

  async findGamePlayersForGames(gameIds: number[]): Promise<GamePlayerDbRow[]> {
    if (gameIds.length === 0) {
      return [];
    }

    const placeholders = gameIds.map(() => '?').join(', ');
    return this.executor.getAll<GamePlayerDbRow>(
      `SELECT id, game_id, player_id, civilization_key, leader_key
       FROM game_players
       WHERE game_id IN (${placeholders})
       ORDER BY game_id ASC, id ASC`,
      gameIds,
    );
  }

  async findRecentCivilizationSlugs(playerId: number, limit: number): Promise<string[]> {
    const rows = await this.executor.getAll<{ civilization_key: string }>(
      `SELECT gp.civilization_key
       FROM game_players gp
       INNER JOIN games g ON g.id = gp.game_id
       WHERE gp.player_id = ?
       ORDER BY g.played_at DESC
       LIMIT ?`,
      [playerId, limit],
    );
    return rows.map((row) => row.civilization_key);
  }

  async updateWinner(gameId: number, fields: GameWinnerFields): Promise<void> {
    const result = await this.executor.run(
      `UPDATE games
       SET winner_kind = ?, winner_player_ids = ?, winner_civilization_key = ?, winner_leader_key = ?
       WHERE id = ?`,
      [
        fields.winnerKind,
        fields.winnerPlayerIds,
        fields.winnerCivilizationKey,
        fields.winnerLeaderKey,
        gameId,
      ],
    );
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
  }

  async updateStartedAt(gameId: number, startedAt: string): Promise<void> {
    const result = await this.executor.run(`UPDATE games SET played_at = ? WHERE id = ?`, [
      startedAt,
      gameId,
    ]);
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
  }

  async updateMatch(gameId: number, fields: GameMatchUpdateFields): Promise<void> {
    const result = await this.executor.run(
      `UPDATE games
       SET played_at = ?, ended_at = ?, winner_kind = ?, winner_player_ids = ?,
           winner_civilization_key = ?, winner_leader_key = ?
       WHERE id = ?`,
      [
        fields.startedAt,
        fields.endedAt,
        fields.winnerKind,
        fields.winnerPlayerIds,
        fields.winnerCivilizationKey,
        fields.winnerLeaderKey,
        gameId,
      ],
    );
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
  }

  async deleteById(gameId: number): Promise<void> {
    await this.executor.run(`DELETE FROM game_events WHERE game_id = ?`, [gameId]);
    await this.executor.run(`DELETE FROM game_players WHERE game_id = ?`, [gameId]);
    const result = await this.executor.run(`DELETE FROM games WHERE id = ?`, [gameId]);
    if (result.changes === 0) {
      throw new Error('Game not found');
    }
  }

  async deleteAllHistory(): Promise<void> {
    await this.executor.run(`DELETE FROM game_events`);
    await this.executor.run(`DELETE FROM game_players`);
    await this.executor.run(`DELETE FROM games`);
  }

  async insertGameWithPlayers(
    input: InsertGameWithPlayersInput,
  ): Promise<{ game: Game; gamePlayers: GamePlayerRow[] }> {
    const gameResult = await this.executor.run(
      `INSERT INTO games (
         civilization_key, leader_key, map_type, difficulty, victory_type,
         score, turn_count, won, winner_kind, winner_player_ids,
         winner_civilization_key, winner_leader_key, notes,
         played_at, ended_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.civilizationKey,
        input.leaderKey,
        input.mapType ?? null,
        input.difficulty ?? null,
        input.victoryType ?? null,
        input.score ?? null,
        input.turnCount ?? null,
        input.won == null ? null : input.won ? 1 : 0,
        input.winnerKind ?? null,
        input.winnerPlayerIds ?? null,
        input.winnerCivilizationKey ?? null,
        input.winnerLeaderKey ?? null,
        input.notes ?? null,
        input.playedAt,
        input.endedAt ?? null,
        input.createdAt,
      ],
    );
    const gameId = gameResult.lastInsertRowId;

    const insertedPlayers: GamePlayerRow[] = [];
    for (const assignment of input.assignments) {
      const playerResult = await this.executor.run(
        `INSERT INTO game_players (game_id, player_id, civilization_key, leader_key)
         VALUES (?, ?, ?, ?)`,
        [gameId, assignment.playerId, assignment.civilizationKey, assignment.leaderKey],
      );
      const row = await this.executor.getFirst<GamePlayerDbRow>(
        `SELECT id, game_id, player_id, civilization_key, leader_key
         FROM game_players WHERE id = ?`,
        [playerResult.lastInsertRowId],
      );
      if (!row) {
        throw new Error('Failed to create game player');
      }
      insertedPlayers.push(mapGamePlayerRow(row));
    }

    const gameRow = await this.executor.getFirst<GameRow>(
      `SELECT id, civilization_key, leader_key, map_type, difficulty, victory_type,
              score, turn_count, won, winner_kind, winner_player_ids,
              winner_civilization_key, winner_leader_key, notes, played_at, ended_at, created_at
       FROM games WHERE id = ?`,
      [gameId],
    );
    if (!gameRow) {
      throw new Error('Failed to create game');
    }

    return { game: mapGameRow(gameRow), gamePlayers: insertedPlayers };
  }

  async findGamesWithWinners(): Promise<GameWinnerRow[]> {
    return this.executor.getAll<GameWinnerRow>(
      `SELECT id, winner_kind, winner_player_ids, winner_civilization_key
       FROM games
       WHERE winner_kind IS NOT NULL`,
    );
  }

  async findGamePlayerCivRows(gameIds: number[]): Promise<GamePlayerCivRow[]> {
    if (gameIds.length === 0) {
      return [];
    }

    const placeholders = gameIds.map(() => '?').join(', ');
    return this.executor.getAll<GamePlayerCivRow>(
      `SELECT game_id, player_id, civilization_key
       FROM game_players
       WHERE game_id IN (${placeholders})`,
      gameIds,
    );
  }

  async findGameDateRows(): Promise<GameDateRow[]> {
    return this.executor.getAll<GameDateRow>(
      `SELECT played_at, ended_at FROM games ORDER BY played_at ASC`,
    );
  }
}
