import { describe, expect, it } from 'vitest';

import { gameLengthAxisMax, gameLengthAxisTicks } from '@/utils/gameLengthAxis';

describe('gameLengthAxisMax', () => {
  it('floors the axis at 4 whole days', () => {
    expect(gameLengthAxisMax(2)).toBe(4);
    expect(gameLengthAxisMax(4)).toBe(4);
    expect(gameLengthAxisMax(10)).toBe(10);
  });
});

describe('gameLengthAxisTicks', () => {
  it('returns five whole-day ticks when the span is short', () => {
    expect(gameLengthAxisTicks(2)).toEqual([0, 1, 2, 3, 4]);
  });

  it('returns five whole-day ticks spanning 0 to maxDays', () => {
    expect(gameLengthAxisTicks(10)).toEqual([0, 3, 5, 8, 10]);
  });
});
