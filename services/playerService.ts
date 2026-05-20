import { asc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { Platform } from 'react-native';

import { getDatabase, players } from '@/database';

export type Player = InferSelectModel<typeof players>;

type PlayerRow = {
  id: number;
  name: string;
  created_at: string;
};

function mapPlayerRow(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

/** Drizzle uses sync SQLite APIs; on web those time out — use expo-sqlite async instead. */
function useAsyncSqlite(): boolean {
  return Platform.OS === 'web';
}

export async function getAllPlayers(): Promise<Player[]> {
  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const rows = await sqlite.getAllAsync<PlayerRow>(
      'SELECT id, name, created_at FROM players ORDER BY name ASC',
    );
    return rows.map(mapPlayerRow);
  }

  const db = getDatabase();
  return db.select().from(players).orderBy(asc(players.name));
}

export async function createPlayer(name: string): Promise<Player> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Player name is required');
  }

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const createdAt = new Date().toISOString();
    const result = await sqlite.runAsync(
      'INSERT INTO players (name, created_at) VALUES (?, ?)',
      trimmed,
      createdAt,
    );
    const row = await sqlite.getFirstAsync<PlayerRow>(
      'SELECT id, name, created_at FROM players WHERE id = ?',
      result.lastInsertRowId,
    );
    if (!row) {
      throw new Error('Failed to create player');
    }
    return mapPlayerRow(row);
  }

  const db = getDatabase();
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
}
