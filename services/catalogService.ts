import corporationsData from '@/assets/data/corporations.json';
import religionsData from '@/assets/data/religions.json';
import worldWondersData from '@/assets/data/worldWonders.json';
import type {
  CatalogOption,
  Corporation,
  CorporationsDataset,
  Religion,
  ReligionsDataset,
  WorldWonder,
  WorldWondersDataset,
} from '@/types';

import { getAllCivilizations } from './civilizationService';

const worldWondersDataset = worldWondersData as WorldWondersDataset;
const religionsDataset = religionsData as ReligionsDataset;
const corporationsDataset = corporationsData as CorporationsDataset;

export function getWorldWonders(): WorldWonder[] {
  return worldWondersDataset.worldWonders;
}

export function getReligions(): Religion[] {
  return religionsDataset.religions;
}

export function getCorporations(): Corporation[] {
  return corporationsDataset.corporations;
}

/** World wonders plus unique wonders from the civ catalog, deduped by id. */
export function getWonderOptions(): CatalogOption[] {
  const byId = new Map<string, CatalogOption>();

  for (const wonder of getWorldWonders()) {
    byId.set(wonder.id, { id: wonder.id, name: wonder.name });
  }

  for (const civilization of getAllCivilizations()) {
    for (const wonder of civilization.uniqueWonders ?? []) {
      if (!byId.has(wonder.id)) {
        byId.set(wonder.id, { id: wonder.id, name: wonder.name });
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCivilizationOptions(): CatalogOption[] {
  return getAllCivilizations()
    .map((civilization) => ({
      id: civilization.slug,
      name: civilization.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
