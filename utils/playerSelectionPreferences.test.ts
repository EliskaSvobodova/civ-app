import { describe, expect, it } from 'vitest';

import { DEFAULT_PLAYER_SELECTION_PREFERENCES } from '@/types/playerSelectionPreferences';
import { parsePreferences } from '@/utils/playerSelectionPreferences';

describe('parsePreferences', () => {
  it('returns defaults for invalid JSON', () => {
    expect(parsePreferences('not-json')).toEqual(DEFAULT_PLAYER_SELECTION_PREFERENCES);
  });

  it('keeps string slugs and boolean avoid-recent', () => {
    expect(
      parsePreferences(
        JSON.stringify({
          excludedSlugs: ['rome', 1, 'aztec'],
          avoidRecentlyPlayed: 1,
          recentGamesCount: 5,
        }),
      ),
    ).toEqual({
      excludedSlugs: ['rome', 'aztec'],
      avoidRecentlyPlayed: true,
      recentGamesCount: 5,
    });
  });

  it('clamps recentGamesCount to 1-20 and falls back when missing', () => {
    expect(parsePreferences(JSON.stringify({ recentGamesCount: 99 })).recentGamesCount).toBe(20);
    expect(parsePreferences(JSON.stringify({ recentGamesCount: 3.9 })).recentGamesCount).toBe(3);
    expect(parsePreferences(JSON.stringify({ recentGamesCount: 0 })).recentGamesCount).toBe(
      DEFAULT_PLAYER_SELECTION_PREFERENCES.recentGamesCount,
    );
    expect(parsePreferences(JSON.stringify({})).recentGamesCount).toBe(
      DEFAULT_PLAYER_SELECTION_PREFERENCES.recentGamesCount,
    );
  });
});
