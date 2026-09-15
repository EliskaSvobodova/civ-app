import type {
  GameHistoryRow,
  GamePlayerCivRow,
  GameWinnerRow,
} from '@/database/repositories/types';
import { getCivilizationByKey } from '@/services/civilizationService';

export const AI_LEADERBOARD_KEY = 'ai';

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

export function parseWinnerPlayerIds(raw: string | null): number[] {
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

export function serializeWinnerPlayerIds(playerIds: number[]): string {
  return JSON.stringify([...new Set(playerIds)].sort((a, b) => a - b));
}

export function winnerFields(winner: GameWinner) {
  return {
    winnerKind: winner.kind,
    winnerPlayerIds:
      winner.kind === 'human' ? serializeWinnerPlayerIds(winner.playerIds) : null,
    winnerCivilizationKey: winner.kind === 'ai' ? winner.civilizationKey : null,
    winnerLeaderKey: winner.kind === 'ai' ? winner.leaderKey : null,
  };
}

export function parseWinnerFromRow(row: GameHistoryRow): GameWinner | null {
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

export function formatWinnerLabel(
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

export function aggregateCivilizationWins(
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

export function aggregatePlayerWins(gameRows: GameWinnerRow[]): Map<string, number> {
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

export function sortPlayerLeaderboard(
  entries: PlayerWinLeaderboardEntry[],
): PlayerWinLeaderboardEntry[] {
  return entries.sort(
    (a, b) => b.wins - a.wins || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
