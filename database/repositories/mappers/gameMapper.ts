import type { Game, GamePlayerDbRow, GamePlayerRow, GameRow } from '../types';

export function mapGameRow(row: GameRow): Game {
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

export function mapGamePlayerRow(row: GamePlayerDbRow): GamePlayerRow {
  return {
    id: row.id,
    gameId: row.game_id,
    playerId: row.player_id,
    civilizationKey: row.civilization_key,
    leaderKey: row.leader_key,
  };
}
