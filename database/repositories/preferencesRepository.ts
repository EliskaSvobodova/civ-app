import type { SqliteExecutor } from '@/database/sqliteExecutor';

export interface PreferencesRepository {
  getValue(key: string): Promise<string | undefined>;
  upsert(key: string, value: string): Promise<void>;
}

export class SqlitePreferencesRepository implements PreferencesRepository {
  constructor(private readonly executor: SqliteExecutor) {}

  async getValue(key: string): Promise<string | undefined> {
    const row = await this.executor.getFirst<{ value: string }>(
      'SELECT value FROM user_preferences WHERE key = ? LIMIT 1',
      [key],
    );
    return row?.value;
  }

  async upsert(key: string, value: string): Promise<void> {
    const existing = await this.executor.getFirst<{ id: number }>(
      'SELECT id FROM user_preferences WHERE key = ? LIMIT 1',
      [key],
    );

    if (existing) {
      await this.executor.run('UPDATE user_preferences SET value = ? WHERE key = ?', [value, key]);
      return;
    }

    await this.executor.run('INSERT INTO user_preferences (key, value) VALUES (?, ?)', [key, value]);
  }
}
