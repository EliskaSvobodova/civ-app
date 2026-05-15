import civilizationsData from '@/assets/data/civilizations.json';
import type { Civilization } from '@/types';

const civilizations = civilizationsData as Civilization[];

export function getAllCivilizations(): Civilization[] {
  return civilizations;
}

export function getCivilizationByKey(key: string): Civilization | undefined {
  return civilizations.find((civ) => civ.key === key);
}

export function pickRandomCivilization(): Civilization {
  const index = Math.floor(Math.random() * civilizations.length);
  return civilizations[index];
}
