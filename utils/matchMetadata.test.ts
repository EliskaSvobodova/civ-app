import { describe, expect, it } from 'vitest';

import {
  DIFFICULTY_OPTIONS,
  MAP_TYPE_OPTIONS,
  MATCH_NONE_OPTION_ID,
  VICTORY_TYPE_OPTIONS,
  labelDifficulty,
  labelMapType,
  labelVictoryType,
  optionIdToNullable,
  parseOptionalNonNegativeInt,
  selectValueOrNone,
  truncateNotes,
} from '@/utils/matchMetadata';

describe('matchMetadata options', () => {
  it('puts None first and omits unknown victory', () => {
    expect(MAP_TYPE_OPTIONS[0]?.id).toBe(MATCH_NONE_OPTION_ID);
    expect(DIFFICULTY_OPTIONS[0]?.id).toBe(MATCH_NONE_OPTION_ID);
    expect(VICTORY_TYPE_OPTIONS[0]?.id).toBe(MATCH_NONE_OPTION_ID);
    expect(VICTORY_TYPE_OPTIONS.some((o) => o.id === 'unknown')).toBe(false);
    expect(MAP_TYPE_OPTIONS.map((o) => o.id)).toContain('pangaea');
    expect(DIFFICULTY_OPTIONS.map((o) => o.id)).toContain('deity');
  });
});

describe('matchMetadata labels', () => {
  it('returns null for empty and human labels for known values', () => {
    expect(labelMapType(null)).toBeNull();
    expect(labelMapType('continents')).toBe('Continents');
    expect(labelDifficulty('emperor')).toBe('Emperor');
    expect(labelVictoryType('science')).toBe('Science');
  });
});

describe('select none helpers', () => {
  it('round-trips none and real ids', () => {
    expect(selectValueOrNone(null)).toBe(MATCH_NONE_OPTION_ID);
    expect(selectValueOrNone('prince')).toBe('prince');
    expect(optionIdToNullable(MATCH_NONE_OPTION_ID)).toBeNull();
    expect(optionIdToNullable('prince')).toBe('prince');
  });
});

describe('parseOptionalNonNegativeInt', () => {
  it('parses empty, integers, and rejects bad input', () => {
    expect(parseOptionalNonNegativeInt('')).toEqual({ ok: true, value: null });
    expect(parseOptionalNonNegativeInt('  ')).toEqual({ ok: true, value: null });
    expect(parseOptionalNonNegativeInt('42')).toEqual({ ok: true, value: 42 });
    expect(parseOptionalNonNegativeInt('0')).toEqual({ ok: true, value: 0 });
    expect(parseOptionalNonNegativeInt('-1').ok).toBe(false);
    expect(parseOptionalNonNegativeInt('3.5').ok).toBe(false);
    expect(parseOptionalNonNegativeInt('abc').ok).toBe(false);
  });
});

describe('truncateNotes', () => {
  it('returns short notes unchanged and truncates long ones', () => {
    expect(truncateNotes('short')).toBe('short');
    const long = 'a'.repeat(130);
    expect(truncateNotes(long).endsWith('…')).toBe(true);
    expect(truncateNotes(long).length).toBe(121);
  });
});
