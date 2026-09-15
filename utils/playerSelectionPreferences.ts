import {
  DEFAULT_PLAYER_SELECTION_PREFERENCES,
  type PlayerSelectionPreferences,
} from '@/types/playerSelectionPreferences';

export function parsePreferences(value: string): PlayerSelectionPreferences {
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
