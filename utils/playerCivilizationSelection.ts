import type { PlayerSelectionPreferences } from '@/types/playerSelectionPreferences';
import type { Civilization } from '@/types';

export function filterCivilizationsForRandomPick(
  civilizations: Civilization[],
  usedSlugs: Set<string>,
  preferences: PlayerSelectionPreferences,
  recentSlugs: Set<string>,
  options?: { excludeSlug?: string },
): Civilization[] {
  const excludeSlug = options?.excludeSlug;

  const applyFilters = (
    pool: Civilization[],
    { skipExcluded, skipRecent }: { skipExcluded: boolean; skipRecent: boolean },
  ) =>
    pool.filter((civ) => {
      if (excludeSlug && civ.slug === excludeSlug) return false;
      if (usedSlugs.has(civ.slug)) return false;
      if (!skipExcluded && preferences.excludedSlugs.includes(civ.slug)) return false;
      if (!skipRecent && preferences.avoidRecentlyPlayed && recentSlugs.has(civ.slug)) {
        return false;
      }
      return true;
    });

  let pool = applyFilters(civilizations, { skipExcluded: false, skipRecent: false });

  if (pool.length === 0) {
    pool = applyFilters(civilizations, { skipExcluded: false, skipRecent: true });
  }
  if (pool.length === 0) {
    pool = applyFilters(civilizations, { skipExcluded: true, skipRecent: true });
  }
  if (pool.length === 0) {
    pool = civilizations.filter((civ) => {
      if (excludeSlug && civ.slug === excludeSlug) return false;
      return !usedSlugs.has(civ.slug);
    });
  }
  if (pool.length === 0 && excludeSlug) {
    pool = civilizations.filter((civ) => civ.slug !== excludeSlug);
  }
  if (pool.length === 0) {
    pool = civilizations;
  }

  return pool;
}

export function pickRandomCivilizationForPlayer(
  civilizations: Civilization[],
  usedSlugs: Set<string>,
  preferences: PlayerSelectionPreferences,
  recentSlugs: Set<string>,
  options?: { excludeSlug?: string },
): Civilization {
  const pool = filterCivilizationsForRandomPick(
    civilizations,
    usedSlugs,
    preferences,
    recentSlugs,
    options,
  );
  return pool[Math.floor(Math.random() * pool.length)];
}
