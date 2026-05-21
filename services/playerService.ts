import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { Platform } from 'react-native';

import { getDatabase, players } from '@/database';

export type Player = InferSelectModel<typeof players>;

type PlayerRow = {
  id: number;
  name: string;
  created_at: string;
  deleted_at: string | null;
};

function mapPlayerRow(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

/** Drizzle uses sync SQLite APIs; on web those time out — use expo-sqlite async instead. */
function useAsyncSqlite(): boolean {
  return Platform.OS === 'web';
}

const DUPLICATE_NAME_ERROR = 'A player with this name already exists';

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('UNIQUE constraint failed');
}

async function findPlayerByName(name: string): Promise<Player | null> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const row = await sqlite.getFirstAsync<PlayerRow>(
      'SELECT id, name, created_at, deleted_at FROM players WHERE lower(name) = lower(?) AND deleted_at IS NULL LIMIT 1',
      name,
    );
    return row ? mapPlayerRow(row) : null;
  }

  const db = getDatabase();
  const [player] = await db
    .select()
    .from(players)
    .where(and(sql`lower(${players.name}) = lower(${name})`, isNull(players.deletedAt)))
    .limit(1);

  return player ?? null;
}

export async function getAllPlayers(): Promise<Player[]> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const rows = await sqlite.getAllAsync<PlayerRow>(
      'SELECT id, name, created_at, deleted_at FROM players WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(mapPlayerRow);
  }

  const db = getDatabase();
  return db
    .select()
    .from(players)
    .where(isNull(players.deletedAt))
    .orderBy(asc(players.name));
}

export async function deletePlayer(playerId: number): Promise<void> {
  const deletedAt = new Date().toISOString();

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const result = await sqlite.runAsync(
      'UPDATE players SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL',
      deletedAt,
      playerId,
    );
    if (result.changes === 0) {
      throw new Error('Player not found');
    }
    return;
  }

  const db = getDatabase();
  const updated = await db
    .update(players)
    .set({ deletedAt })
    .where(and(eq(players.id, playerId), isNull(players.deletedAt)))
    .returning({ id: players.id });

  if (updated.length === 0) {
    throw new Error('Player not found');
  }
}

export async function createPlayer(name: string): Promise<Player> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Player name is required');
  }

  const existing = await findPlayerByName(trimmed);
  if (existing) {
    throw new Error(DUPLICATE_NAME_ERROR);
  }

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const createdAt = new Date().toISOString();
    let result: { lastInsertRowId: number };
    try {
      result = await sqlite.runAsync(
        'INSERT INTO players (name, created_at) VALUES (?, ?)',
        trimmed,
        createdAt,
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error(DUPLICATE_NAME_ERROR);
      }
      throw error;
    }
    const row = await sqlite.getFirstAsync<PlayerRow>(
      'SELECT id, name, created_at, deleted_at FROM players WHERE id = ?',
      result.lastInsertRowId,
    );
    if (!row) {
      throw new Error('Failed to create player');
    }
    return mapPlayerRow(row);
  }

  const db = getDatabase();
  try {
    const [player] = await db
      .insert(players)
      .values({
        name: trimmed,
        createdAt: new Date().toISOString(),
      })
      .returning();

    if (!player) {
      throw new Error('Failed to create player');
    }

    return player;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error(DUPLICATE_NAME_ERROR);
    }
    throw error;
  }
}
