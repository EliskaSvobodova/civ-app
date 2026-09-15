import { describe, expect, it, vi } from 'vitest';

import type { Civilization } from '@/types';
import type { PlayerSelectionPreferences } from '@/types/playerSelectionPreferences';
import {
  filterCivilizationsForRandomPick,
  pickRandomCivilizationForPlayer,
} from '@/utils/playerCivilizationSelection';

function civ(slug: string): Civilization {
  return {
    id: `CIVILIZATION_${slug.toUpperCase()}`,
    slug,
    name: slug,
    warlikeScore: 5,
    scienceScore: 5,
    cultureScore: 5,
    diplomaticScore: 5,
    leader: { id: `LEADER_${slug.toUpperCase()}`, name: slug },
    uniqueAbility: { id: 'ua', name: 'UA', description: '' },
    uniqueUnits: [],
  };
}

const catalog = [civ('america'), civ('rome'), civ('aztec'), civ('japan')];

const prefs = (
  overrides: Partial<PlayerSelectionPreferences> = {},
): PlayerSelectionPreferences => ({
  excludedSlugs: [],
  avoidRecentlyPlayed: false,
  recentGamesCount: 3,
  ...overrides,
});

function slugs(civilizations: Civilization[]): string[] {
  return civilizations.map((civilization) => civilization.slug).sort();
}

describe('filterCivilizationsForRandomPick', () => {
  it('keeps unused civs that are not excluded or recent', () => {
    const pool = filterCivilizationsForRandomPick(
      catalog,
      new Set(['america']),
      prefs({ excludedSlugs: ['rome'], avoidRecentlyPlayed: true }),
      new Set(['aztec']),
    );

    expect(slugs(pool)).toEqual(['japan']);
  });

  it('falls back to recent civs when nothing else is unused and allowed', () => {
    const pool = filterCivilizationsForRandomPick(
      catalog,
      new Set(['america']),
      prefs({ excludedSlugs: ['rome'], avoidRecentlyPlayed: true }),
      new Set(['aztec', 'japan']),
    );

    expect(slugs(pool)).toEqual(['aztec', 'japan']);
  });

  it('falls back to excluded civs when the unused pool is otherwise empty', () => {
    const pool = filterCivilizationsForRandomPick(
      catalog,
      new Set(['america', 'aztec', 'japan']),
      prefs({ excludedSlugs: ['rome'], avoidRecentlyPlayed: true }),
      new Set(['rome']),
    );

    expect(slugs(pool)).toEqual(['rome']);
  });

  it('falls back to unused civs only when exclude and recent filters empty the pool', () => {
    const pool = filterCivilizationsForRandomPick(
      catalog,
      new Set(['america']),
      prefs({ excludedSlugs: ['rome', 'aztec', 'japan'], avoidRecentlyPlayed: true }),
      new Set(['rome', 'aztec', 'japan']),
    );

    expect(slugs(pool)).toEqual(['aztec', 'japan', 'rome']);
  });

  it('on reroll, excludes the current slug before using used civs as a last resort', () => {
    const pool = filterCivilizationsForRandomPick(
      catalog,
      new Set(['america', 'rome', 'aztec', 'japan']),
      prefs(),
      new Set(),
      { excludeSlug: 'america' },
    );

    expect(slugs(pool)).toEqual(['aztec', 'japan', 'rome']);
    expect(pool.some((civilization) => civilization.slug === 'america')).toBe(false);
  });

  it('returns the full catalog when every stricter fallback is empty', () => {
    const onlyAmerica = [civ('america')];
    const pool = filterCivilizationsForRandomPick(
      onlyAmerica,
      new Set(['america']),
      prefs({ excludedSlugs: ['america'], avoidRecentlyPlayed: true }),
      new Set(['america']),
    );

    expect(slugs(pool)).toEqual(['america']);
  });
});

describe('pickRandomCivilizationForPlayer', () => {
  it('picks a civilization from the filtered pool', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    const picked = pickRandomCivilizationForPlayer(
      catalog,
      new Set(['america', 'rome']),
      prefs(),
      new Set(),
    );

    expect(picked.slug).toBe('aztec');
    random.mockRestore();
  });
});
