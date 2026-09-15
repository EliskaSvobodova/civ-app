import { getRepositories } from '@/database';
import {
  DEFAULT_PLAYER_SELECTION_PREFERENCES,
  type PlayerSelectionPreferences,
} from '@/types/playerSelectionPreferences';
import { parsePreferences } from '@/utils/playerSelectionPreferences';

function preferenceKey(playerId: number): string {
  return `player_selection_prefs:${playerId}`;
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
