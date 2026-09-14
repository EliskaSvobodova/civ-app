import type { InferSelectModel } from 'drizzle-orm';

import type { eventTypes, gameEvents, gamePlayers, games, players } from '@/database/schema';

export type Player = InferSelectModel<typeof players>;
export type Game = InferSelectModel<typeof games>;
export type GamePlayerRow = InferSelectModel<typeof gamePlayers>;
export type EventTypeRow = InferSelectModel<typeof eventTypes>;
export type GameEventRow = InferSelectModel<typeof gameEvents>;

export type PlayerRow = {
  id: number;
  name: string;
  created_at: string;
  deleted_at: string | null;
};

export type GameHistoryRow = {
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

export type GameRow = {
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

export type GamePlayerDbRow = {
  id: number;
  game_id: number;
  player_id: number;
  civilization_key: string;
  leader_key: string;
};

export type GameWinnerRow = {
  id: number;
  winner_kind: string;
  winner_player_ids: string | null;
  winner_civilization_key: string | null;
};

export type GamePlayerCivRow = {
  game_id: number;
  player_id: number;
  civilization_key: string;
};

export type GameDateRow = {
  played_at: string;
  ended_at: string | null;
};

export type GameWinnerFields = {
  winnerKind: string;
  winnerPlayerIds: string | null;
  winnerCivilizationKey: string | null;
  winnerLeaderKey: string | null;
};

export type GameMatchUpdateFields = GameWinnerFields & {
  startedAt: string;
  endedAt: string;
};

export type InsertGameWithPlayersInput = {
  civilizationKey: string;
  leaderKey: string;
  playedAt: string;
  createdAt: string;
  assignments: {
    playerId: number;
    civilizationKey: string;
    leaderKey: string;
  }[];
};

export type EventTypeDbRow = {
  id: number;
  key: string;
  label: string;
  is_builtin: number;
  created_at: string;
};

export type GameEventJoinedDbRow = {
  id: number;
  game_id: number;
  round: number;
  civilization_key: string;
  target_key: string | null;
  target_label: string | null;
  created_at: string;
  type_id: number;
  type_key: string;
  type_label: string;
  type_is_builtin: number;
};

export type InsertGameEventInput = {
  gameId: number;
  eventTypeId: number;
  round: number;
  civilizationKey: string;
  targetKey: string | null;
  targetLabel: string | null;
  createdAt: string;
};

export type InsertEventTypeInput = {
  key: string;
  label: string;
  isBuiltin: boolean;
  createdAt: string;
};
