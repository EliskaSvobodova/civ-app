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
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
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

    async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
      await client.execAsync('BEGIN IMMEDIATE');
      try {
        const result = await fn();
        await client.execAsync('COMMIT');
        return result;
      } catch (error) {
        try {
          await client.execAsync('ROLLBACK');
        } catch {
          // Ignore rollback failures after a failed transaction.
        }
        throw error;
      }
    },
  };
}
