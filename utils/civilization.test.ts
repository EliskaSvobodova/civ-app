import { describe, expect, it } from 'vitest';

import type { Civilization } from '@/types';
import { getCivilizationFlavor, getCivilizationInitials } from '@/utils/civilization';

function civ(overrides: Partial<Civilization> = {}): Civilization {
  return {
    id: 'CIVILIZATION_TEST',
    slug: 'test',
    name: 'Test',
    warlikeScore: 5,
    scienceScore: 5,
    cultureScore: 5,
    diplomaticScore: 5,
    leader: { id: 'LEADER_TEST', name: 'Test' },
    uniqueAbility: { id: 'ua', name: 'UA', description: '' },
    uniqueUnits: [],
    ...overrides,
  };
}

describe('getCivilizationInitials', () => {
  it('uses two letters from a single word', () => {
    expect(getCivilizationInitials('Rome')).toBe('RO');
  });

  it('uses the first letter of the first two words', () => {
    expect(getCivilizationInitials('The Aztecs')).toBe('TA');
  });

  it('returns ? for blank names', () => {
    expect(getCivilizationInitials('')).toBe('?');
    expect(getCivilizationInitials('   ')).toBe('?');
  });
});

describe('getCivilizationFlavor', () => {
  it('returns the first unique-unit flavor, truncated at a word boundary', () => {
    const words = Array.from({ length: 50 }, () => 'flavor').join(' ');
    expect(words.length).toBeGreaterThan(280);

    const result = getCivilizationFlavor(
      civ({ uniqueUnits: [{ id: 'u', name: 'Unit', flavor: words }] }),
    );

    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(281);
    expect(result!.endsWith('…')).toBe(true);
    expect(result!.includes('flavor')).toBe(true);
  });

  it('truncates a long word at 280 characters when there is no usable space', () => {
    const flavor = 'a'.repeat(300);
    const result = getCivilizationFlavor(
      civ({ uniqueUnits: [{ id: 'u', name: 'Unit', flavor }] }),
    );

    expect(result).toBe(`${'a'.repeat(280)}…`);
  });

  it('falls back from units to buildings to wonders, then null', () => {
    expect(
      getCivilizationFlavor(
        civ({
          uniqueUnits: [{ id: 'u', name: 'Unit' }],
          uniqueBuildings: [{ id: 'b', name: 'Building', flavor: 'From a building.' }],
        }),
      ),
    ).toBe('From a building.');

    expect(
      getCivilizationFlavor(
        civ({
          uniqueBuildings: [{ id: 'b', name: 'Building' }],
          uniqueWonders: [{ id: 'w', name: 'Wonder', flavor: 'From a wonder.' }],
        }),
      ),
    ).toBe('From a wonder.');

    expect(getCivilizationFlavor(civ())).toBeNull();
  });
});
