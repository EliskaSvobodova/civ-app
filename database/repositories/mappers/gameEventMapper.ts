import type { GameEventType } from '@/types';

import type { EventTypeDbRow, GameEventJoinedDbRow } from '../types';

export function mapEventTypeRow(row: EventTypeDbRow): GameEventType {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    isBuiltin: row.is_builtin === 1,
  };
}

export function mapGameEventJoinedRow(row: GameEventJoinedDbRow): {
  id: number;
  gameId: number;
  type: GameEventType;
  round: number;
  civilizationKey: string;
  targetKey: string | null;
  targetLabel: string | null;
  createdAt: string;
} {
  return {
    id: row.id,
    gameId: row.game_id,
    type: {
      id: row.type_id,
      key: row.type_key,
      label: row.type_label,
      isBuiltin: row.type_is_builtin === 1,
    },
    round: row.round,
    civilizationKey: row.civilization_key,
    targetKey: row.target_key,
    targetLabel: row.target_label,
    createdAt: row.created_at,
  };
}
