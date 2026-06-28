import type { SqliteExecutor } from '@/database/sqliteExecutor';

import { mapPlayerRow } from './mappers/playerMapper';
import type { Player, PlayerRow } from './types';

export interface PlayerRepository {
  findAllActive(): Promise<Player[]>;
  findActiveByName(name: string): Promise<Player | undefined>;
  insert(name: string, createdAt: string): Promise<Player>;
  softDelete(id: number, deletedAt: string): Promise<void>;
  findNamesByIds(ids: number[]): Promise<Map<number, string>>;
}

export class SqlitePlayerRepository implements PlayerRepository {
  constructor(private readonly executor: SqliteExecutor) {}

  async findAllActive(): Promise<Player[]> {
    const rows = await this.executor.getAll<PlayerRow>(
      'SELECT id, name, created_at, deleted_at FROM players WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(mapPlayerRow);
  }

  async findActiveByName(name: string): Promise<Player | undefined> {
    const row = await this.executor.getFirst<PlayerRow>(
      'SELECT id, name, created_at, deleted_at FROM players WHERE lower(name) = lower(?) AND deleted_at IS NULL LIMIT 1',
      [name],
    );
    return row ? mapPlayerRow(row) : undefined;
  }

  async insert(name: string, createdAt: string): Promise<Player> {
    const result = await this.executor.run(
      'INSERT INTO players (name, created_at) VALUES (?, ?)',
      [name, createdAt],
    );
    const row = await this.executor.getFirst<PlayerRow>(
      'SELECT id, name, created_at, deleted_at FROM players WHERE id = ?',
      [result.lastInsertRowId],
    );
    if (!row) {
      throw new Error('Failed to create player');
    }
    return mapPlayerRow(row);
  }

  async softDelete(id: number, deletedAt: string): Promise<void> {
    const result = await this.executor.run(
      'UPDATE players SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL',
      [deletedAt, id],
    );
    if (result.changes === 0) {
      throw new Error('Player not found');
    }
  }

  async findNamesByIds(ids: number[]): Promise<Map<number, string>> {
    if (ids.length === 0) {
      return new Map();
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await this.executor.getAll<{ id: number; name: string }>(
      `SELECT id, name FROM players WHERE id IN (${placeholders})`,
      ids,
    );
    return new Map(rows.map((row) => [row.id, row.name]));
  }
}
