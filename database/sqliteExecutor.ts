import type { SQLiteBindValue } from 'expo-sqlite';

import type { AppDatabase } from './client';
import { getDatabase } from './client';

export type SqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface SqliteExecutor {
  getAll<T>(sql: string, params?: readonly SQLiteBindValue[]): Promise<T[]>;
  getFirst<T>(sql: string, params?: readonly SQLiteBindValue[]): Promise<T | undefined>;
  run(sql: string, params?: readonly SQLiteBindValue[]): Promise<SqlRunResult>;
}

export function createSqliteExecutor(db: AppDatabase = getDatabase()): SqliteExecutor {
  const client = db.$client;

  return {
    getAll<T>(sql: string, params: readonly SQLiteBindValue[] = []): Promise<T[]> {
      return client.getAllAsync<T>(sql, ...params);
    },

    async getFirst<T>(sql: string, params: readonly SQLiteBindValue[] = []): Promise<T | undefined> {
      const row = await client.getFirstAsync<T>(sql, ...params);
      return row ?? undefined;
    },

    run(sql: string, params: readonly SQLiteBindValue[] = []): Promise<SqlRunResult> {
      return client.runAsync(sql, ...params);
    },
  };
}
