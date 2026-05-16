import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import * as schema from './schema';

const DATABASE_NAME = 'civ-app.db';
const OPEN_OPTIONS = { enableChangeListener: true } as const;

export type AppDatabase = ReturnType<typeof createDrizzle>;

function createDrizzle(sqlite: SQLiteDatabase) {
  return drizzle(sqlite, { schema });
}

let db: AppDatabase | null = null;

export async function initDatabase(): Promise<AppDatabase> {
  if (db) {
    return db;
  }

  const sqlite =
    Platform.OS === 'web'
      ? await openDatabaseAsync(DATABASE_NAME, OPEN_OPTIONS)
      : openDatabaseSync(DATABASE_NAME, OPEN_OPTIONS);

  db = createDrizzle(sqlite);
  return db;
}

export function getDatabase(): AppDatabase {
  if (!db) {
    throw new Error('Database not initialized. Ensure DatabaseProvider is mounted.');
  }
  return db;
}
