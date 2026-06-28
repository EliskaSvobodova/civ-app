import { getRepositories } from '@/database';
import type {
  Game,
  GameHistoryRow,
  GamePlayerCivRow,
  GamePlayerRow,
  GameWinnerRow,
} from '@/database/repositories';
import type { Civilization } from '@/types';
import { gameDurationDays } from '@/utils/gameDateTime';

import {
  getCivilizationByKey,
  getCivilizationSlug,
  getLeaderKey,
} from './civilizationService';

export type { Game, GamePlayerRow } from '@/database/repositories';

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

function winnerFields(winner: UpdateGameWinnerInput) {
  return {
    winnerKind: winner.kind,
    winnerPlayerIds:
      winner.kind === 'human' ? serializeWinnerPlayerIds(winner.playerIds) : null,
    winnerCivilizationKey: winner.kind === 'ai' ? winner.civilizationKey : null,
    winnerLeaderKey: winner.kind === 'ai' ? winner.leaderKey : null,
  };
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

  const humanPlayerIds = Array.from(winCounts.keys())
    .filter((key) => key !== AI_LEADERBOARD_KEY)
    .map((key) => Number(key))
    .filter((id) => Number.isFinite(id));

  const namesById = await players.findNamesByIds(humanPlayerIds);

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

export async function getGameDurationDays(): Promise<number[]> {
  const rows = await getRepositories().games.findGameDateRows();
  return rows.map((row) => gameDurationDays(row.played_at, row.ended_at ?? row.played_at));
}
