import civilizationsData from '@/assets/data/civilizations.json';
import type { Civilization, CivilizationsDataset } from '@/types';

const dataset = civilizationsData as CivilizationsDataset;
const civilizations = dataset.civilizations;

export function getCivilizationsDataset(): CivilizationsDataset {
  return dataset;
}

export function getAllCivilizations(): Civilization[] {
  return civilizations;
}

export function getCivilizationBySlug(slug: string): Civilization | undefined {
  return civilizations.find((civ) => civ.slug === slug);
}

/** Resolves by slug (preferred) or game type id. */
export function getCivilizationByKey(key: string): Civilization | undefined {
  return civilizations.find((civ) => civ.slug === key || civ.id === key);
}

export function getCivilizationSlug(civilization: Civilization): string {
  return civilization.slug;
}

export function getLeaderKey(civilization: Civilization): string {
  return civilization.leader.id;
}

export function pickRandomCivilization(): Civilization {
  const index = Math.floor(Math.random() * civilizations.length);
  return civilizations[index];
}
