import type { Player, PlayerRow } from '../types';

export function mapPlayerRow(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}
