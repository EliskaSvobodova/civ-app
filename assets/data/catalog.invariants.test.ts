import { describe, expect, it } from 'vitest';

import civilizationsData from '@/assets/data/civilizations.json';
import corporationsData from '@/assets/data/corporations.json';
import religionsData from '@/assets/data/religions.json';
import worldWondersData from '@/assets/data/worldWonders.json';
import type {
  CivilizationsDataset,
  CorporationsDataset,
  ReligionsDataset,
  WorldWondersDataset,
} from '@/types';

const civilizations = (civilizationsData as CivilizationsDataset).civilizations;
const worldWonders = (worldWondersData as WorldWondersDataset).worldWonders;
const religions = (religionsData as ReligionsDataset).religions;
const corporations = (corporationsData as CorporationsDataset).corporations;

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

describe('catalog invariants', () => {
  it('gives every civilization a unique slug and id', () => {
    const slugs = civilizations.map((civilization) => civilization.slug);
    const ids = civilizations.map((civilization) => civilization.id);

    expect(slugs.length).toBeGreaterThan(0);
    expect(uniqueIds(slugs)).toHaveLength(slugs.length);
    expect(uniqueIds(ids)).toHaveLength(ids.length);
  });

  it('keeps balance scores in 0-10', () => {
    for (const civilization of civilizations) {
      for (const score of [
        civilization.warlikeScore,
        civilization.scienceScore,
        civilization.cultureScore,
        civilization.diplomaticScore,
      ]) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      }
    }
  });

  it('requires a leader and at least one unique unit', () => {
    for (const civilization of civilizations) {
      expect(civilization.leader.id).toBeTruthy();
      expect(civilization.leader.name).toBeTruthy();
      expect(civilization.uniqueUnits.length).toBeGreaterThan(0);
    }
  });

  it('gives wonders, religions, and corporations unique ids', () => {
    const wonderIds = worldWonders.map((wonder) => wonder.id);
    const religionIds = religions.map((religion) => religion.id);
    const corporationIds = corporations.map((corporation) => corporation.id);

    expect(uniqueIds(wonderIds)).toHaveLength(wonderIds.length);
    expect(uniqueIds(religionIds)).toHaveLength(religionIds.length);
    expect(uniqueIds(corporationIds)).toHaveLength(corporationIds.length);
  });
});
