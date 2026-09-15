export const HISTORY_TRANSFER_FORMAT = 'civ-app-history' as const;
export const HISTORY_TRANSFER_VERSION = 1 as const;

export type HistoryTransferPlayer = {
  name: string;
};

export type HistoryTransferEventType = {
  key: string;
  label: string;
  isBuiltin: boolean;
};

export type HistoryTransferParticipant = {
  playerName: string;
  civilizationKey: string;
  leaderKey: string;
};

export type HistoryTransferWinner =
  | { kind: 'human'; playerNames: string[] }
  | { kind: 'ai'; civilizationKey: string; leaderKey: string };

export type HistoryTransferEvent = {
  eventTypeKey: string;
  round: number;
  civilizationKey: string;
  targetKey: string | null;
  targetLabel: string | null;
  createdAt: string;
};

export type HistoryTransferGame = {
  startedAt: string;
  endedAt: string | null;
  civilizationKey: string;
  leaderKey: string;
  mapType?: string | null;
  difficulty?: string | null;
  victoryType?: string | null;
  score?: number | null;
  turnCount?: number | null;
  won?: boolean | null;
  notes?: string | null;
  participants: HistoryTransferParticipant[];
  winner: HistoryTransferWinner | null;
  events: HistoryTransferEvent[];
};

export type HistoryTransferDocument = {
  format: typeof HISTORY_TRANSFER_FORMAT;
  version: typeof HISTORY_TRANSFER_VERSION;
  exportedAt: string;
  players: HistoryTransferPlayer[];
  eventTypes: HistoryTransferEventType[];
  games: HistoryTransferGame[];
};

export type HistoryImportMode = 'merge' | 'replace';

export type HistoryImportResult = {
  mode: HistoryImportMode;
  playersEnsured: number;
  eventTypesEnsured: number;
  gamesImported: number;
};
