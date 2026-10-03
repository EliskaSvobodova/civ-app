import { getRepositories } from '@/database';
import type { Game, GameHistoryRow, GamePlayerRow } from '@/database/repositories';
import type { Civilization } from '@/types';
import { gameDurationDays } from '@/utils/gameDateTime';
import {
  AI_LEADERBOARD_KEY,
  aggregateCivilizationWins,
  aggregatePlayerWins,
  formatWinnerLabel,
  parseWinnerFromRow,
  parseWinnerPlayerIds,
  sortPlayerLeaderboard,
  winnerFields,
  type CivilizationWinCount,
  type GameHistoryParticipant,
  type GameWinner,
  type PlayerWinLeaderboardEntry,
} from '@/utils/gameWins';

import {
  getCivilizationByKey,
  getCivilizationSlug,
  getLeaderKey,
} from './civilizationService';

export type { Game, GamePlayerRow } from '@/database/repositories';
export type {
  CivilizationWinCount,
  GameHistoryParticipant,
  GameWinner,
  PlayerWinLeaderboardEntry,
} from '@/utils/gameWins';

export type CreateGameAssignment = {
  playerId: number;
  civilization: Civilization;
};

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
  const rows = await getRepositories().games.findHistoryJoinRows();
  return groupGameHistoryRows(rows);
}

export async function getRecentCivilizationSlugsForPlayer(
  playerId: number,
  gameCount: number,
): Promise<string[]> {
  const limit = Math.max(1, Math.min(Math.floor(gameCount), 20));
  return getRepositories().games.findRecentCivilizationSlugs(playerId, limit);
}

export async function updateGameWinner(
  gameId: number,
  winner: UpdateGameWinnerInput,
): Promise<void> {
  await getRepositories().games.updateWinner(gameId, winnerFields(winner));
}

export async function updateGameStartedAt(gameId: number, startedAt: string): Promise<void> {
  await getRepositories().games.updateStartedAt(gameId, startedAt);
}

export async function deleteGame(gameId: number): Promise<void> {
  await getRepositories().games.deleteById(gameId);
}

export async function updateGameMatch(
  gameId: number,
  input: UpdateGameMatchInput,
): Promise<void> {
  const winner = winnerFields(input.winner);
  await getRepositories().games.updateMatch(gameId, {
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    ...winner,
  });
}

export async function createGame(
  assignments: CreateGameAssignment[],
): Promise<{ game: Game; gamePlayers: GamePlayerRow[] }> {
  if (assignments.length === 0) {
    throw new Error('At least one player is required');
  }

  const first = assignments[0];
  const now = new Date().toISOString();

  return getRepositories().games.insertGameWithPlayers({
    civilizationKey: getCivilizationSlug(first.civilization),
    leaderKey: getLeaderKey(first.civilization),
    playedAt: now,
    createdAt: now,
    assignments: assignments.map((assignment) => ({
      playerId: assignment.playerId,
      civilizationKey: getCivilizationSlug(assignment.civilization),
      leaderKey: getLeaderKey(assignment.civilization),
    })),
  });
}

export async function getTopCivilizationsByWins(
  limit = 3,
): Promise<CivilizationWinCount[]> {
  if (limit <= 0) {
    return [];
  }

  const { games } = getRepositories();
  const gameRows = await games.findGamesWithWinners();
  if (gameRows.length === 0) {
    return [];
  }

  const playerRows = await games.findGamePlayerCivRows(gameRows.map((row) => row.id));
  return aggregateCivilizationWins(gameRows, playerRows).slice(0, limit);
}

export async function getTopPlayersByWins(
  limit = 3,
): Promise<PlayerWinLeaderboardEntry[]> {
  if (limit <= 0) {
    return [];
  }

  const { games, players } = getRepositories();
  const gameRows = await games.findGamesWithWinners();
  if (gameRows.length === 0) {
    return [];
  }

  const winCounts = aggregatePlayerWins(gameRows);
  if (winCounts.size === 0) {
    return [];
  }

  const humanPlayerIds = new Set<number>();
  for (const key of winCounts.keys()) {
    if (key === AI_LEADERBOARD_KEY) {
      continue;
    }
    for (const playerId of parseWinnerPlayerIds(key)) {
      humanPlayerIds.add(playerId);
    }
  }

  const namesById = await players.findNamesByIds(Array.from(humanPlayerIds));

  const entries: PlayerWinLeaderboardEntry[] = [];
  for (const [key, wins] of winCounts.entries()) {
    if (key === AI_LEADERBOARD_KEY) {
      entries.push({ kind: 'ai', playerIds: [], name: 'AI', wins });
      continue;
    }

    const playerIds = parseWinnerPlayerIds(key);
    if (playerIds.length === 0) {
      continue;
    }

    const names = playerIds.map(
      (playerId) => namesById.get(playerId) ?? `Player ${playerId}`,
    );

    if (playerIds.length === 1) {
      entries.push({ kind: 'human', playerIds, name: names[0], wins });
      continue;
    }

    entries.push({ kind: 'team', playerIds, name: `Team: ${names.join(', ')}`, wins });
  }

  return sortPlayerLeaderboard(entries).slice(0, limit);
}

export async function getGameDurationDays(): Promise<number[]> {
  const rows = await getRepositories().games.findGameDateRows();
  return rows.map((row) => gameDurationDays(row.played_at, row.ended_at ?? row.played_at));
}
