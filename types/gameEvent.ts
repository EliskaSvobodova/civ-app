export type GameEventType = {
  id: number;
  key: string;
  label: string;
  isBuiltin: boolean;
};

export type GameEvent = {
  id: number;
  gameId: number;
  type: GameEventType;
  round: number;
  civilizationKey: string;
  civilizationName: string;
  targetKey: string | null;
  targetLabel: string | null;
  createdAt: string;
};

export type CreateGameEventInput = {
  eventTypeId: number;
  round: number;
  civilizationKey: string;
  targetKey?: string | null;
  targetLabel?: string | null;
};

export const BUILTIN_EVENT_TYPE_KEYS = [
  'wonder_built',
  'religion_founded',
  'religion_enhanced',
  'religion_reformed',
  'corporation_founded',
  'civ_destroyed',
  'civ_revived',
] as const;

export type BuiltinEventTypeKey = (typeof BUILTIN_EVENT_TYPE_KEYS)[number];
