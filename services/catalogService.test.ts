import { describe, expect, it } from 'vitest';

import {
  getCivilizationOptions,
  getWonderOptions,
} from '@/services/catalogService';
import {
  getCivilizationByKey,
  getCivilizationBySlug,
} from '@/services/civilizationService';

describe('catalogService', () => {
  it('returns civilization options sorted by name with slug ids', () => {
    const options = getCivilizationOptions();
    const names = options.map((option) => option.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));

    expect(options.length).toBeGreaterThan(0);
    expect(names).toEqual(sorted);
    expect(options.find((option) => option.id === 'america')?.name).toBe('America');
  });

  it('dedupes wonder options by id and includes unique civ wonders', () => {
    const options = getWonderOptions();
    const ids = options.map((option) => option.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('BUILDING_ALHAMBRA');
    expect(ids).toContain('BUILDING_SMITHSONIAN_INSTITUTION');

    const names = options.map((option) => option.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('civilizationService lookups', () => {
  it('resolves America by slug and by game type id', () => {
    const bySlug = getCivilizationBySlug('america');
    const byKey = getCivilizationByKey('CIVILIZATION_AMERICA');

    expect(bySlug?.name).toBe('America');
    expect(byKey?.slug).toBe('america');
    expect(getCivilizationByKey('america')?.id).toBe('CIVILIZATION_AMERICA');
  });

  it('returns undefined for unknown keys', () => {
    expect(getCivilizationBySlug('not-a-civ')).toBeUndefined();
    expect(getCivilizationByKey('CIVILIZATION_MISSING')).toBeUndefined();
  });
});
