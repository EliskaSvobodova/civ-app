import { getRepositories } from '@/database';
import {
  DEFAULT_PLAYER_SELECTION_PREFERENCES,
  type PlayerSelectionPreferences,
} from '@/types/playerSelectionPreferences';

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
  const value = await getRepositories().preferences.getValue(preferenceKey(playerId));
  return value ? parsePreferences(value) : { ...DEFAULT_PLAYER_SELECTION_PREFERENCES };
}

export async function savePlayerSelectionPreferences(
  playerId: number,
  preferences: PlayerSelectionPreferences,
): Promise<void> {
  const value = JSON.stringify({
    excludedSlugs: preferences.excludedSlugs,
    avoidRecentlyPlayed: preferences.avoidRecentlyPlayed,
    recentGamesCount: preferences.recentGamesCount,
  });
  await getRepositories().preferences.upsert(preferenceKey(playerId), value);
}
