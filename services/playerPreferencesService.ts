import { eq } from 'drizzle-orm';
import { Platform } from 'react-native';

import { getDatabase, userPreferences } from '@/database';
import {
  DEFAULT_PLAYER_SELECTION_PREFERENCES,
  type PlayerSelectionPreferences,
} from '@/types/playerSelectionPreferences';

function useAsyncSqlite(): boolean {
  return Platform.OS === 'web';
}

function preferenceKey(playerId: number): string {
  return `player_selection_prefs:${playerId}`;
}

function parsePreferences(value: string): PlayerSelectionPreferences {
  try {
    const parsed = JSON.parse(value) as Partial<PlayerSelectionPreferences>;
    return {
      excludedSlugs: Array.isArray(parsed.excludedSlugs)
        ? parsed.excludedSlugs.filter((slug): slug is string => typeof slug === 'string')
        : [],
      avoidRecentlyPlayed: Boolean(parsed.avoidRecentlyPlayed),
      recentGamesCount:
        typeof parsed.recentGamesCount === 'number' && parsed.recentGamesCount > 0
          ? Math.min(Math.floor(parsed.recentGamesCount), 20)
          : DEFAULT_PLAYER_SELECTION_PREFERENCES.recentGamesCount,
    };
  } catch {
    return { ...DEFAULT_PLAYER_SELECTION_PREFERENCES };
  }
}

export async function getPlayerSelectionPreferences(
  playerId: number,
): Promise<PlayerSelectionPreferences> {
  const key = preferenceKey(playerId);

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const row = await sqlite.getFirstAsync<{ value: string }>(
      'SELECT value FROM user_preferences WHERE key = ? LIMIT 1',
      key,
    );
    return row ? parsePreferences(row.value) : { ...DEFAULT_PLAYER_SELECTION_PREFERENCES };
  }

  const db = getDatabase();
  const [row] = await db
    .select({ value: userPreferences.value })
    .from(userPreferences)
    .where(eq(userPreferences.key, key))
    .limit(1);

  return row ? parsePreferences(row.value) : { ...DEFAULT_PLAYER_SELECTION_PREFERENCES };
}

export async function savePlayerSelectionPreferences(
  playerId: number,
  preferences: PlayerSelectionPreferences,
): Promise<void> {
  const key = preferenceKey(playerId);
  const value = JSON.stringify({
    excludedSlugs: preferences.excludedSlugs,
    avoidRecentlyPlayed: preferences.avoidRecentlyPlayed,
    recentGamesCount: preferences.recentGamesCount,
  });

  if (useAsyncSqlite()) {
    const sqlite = getDatabase().$client;
    const existing = await sqlite.getFirstAsync<{ id: number }>(
      'SELECT id FROM user_preferences WHERE key = ? LIMIT 1',
      key,
    );
    if (existing) {
      await sqlite.runAsync('UPDATE user_preferences SET value = ? WHERE key = ?', value, key);
      return;
    }
    await sqlite.runAsync('INSERT INTO user_preferences (key, value) VALUES (?, ?)', key, value);
    return;
  }

  const db = getDatabase();
  const existing = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userPreferences).set({ value }).where(eq(userPreferences.key, key));
    return;
  }

  await db.insert(userPreferences).values({ key, value });
}
