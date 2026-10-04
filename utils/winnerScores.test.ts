import { describe, expect, it } from 'vitest';

import { formatWinnerScoresLabel, parseHumanWinnerScores } from '@/utils/winnerScores';

describe('parseHumanWinnerScores', () => {
  it('allows all blank', () => {
    expect(
      parseHumanWinnerScores([
        { playerId: 1, playerName: 'Alice', raw: '' },
        { playerId: 2, playerName: 'Bob', raw: '  ' },
      ]),
    ).toEqual({
      ok: true,
      values: [
        { playerId: 1, score: null },
        { playerId: 2, score: null },
      ],
    });
  });

  it('requires all when any filled', () => {
    const result = parseHumanWinnerScores([
      { playerId: 1, playerName: 'Alice', raw: '1200' },
      { playerId: 2, playerName: 'Bob', raw: '' },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/every winning player/i);
    }
  });

  it('accepts all filled', () => {
    expect(
      parseHumanWinnerScores([
        { playerId: 1, playerName: 'Alice', raw: '1200' },
        { playerId: 2, playerName: 'Bob', raw: '980' },
      ]),
    ).toEqual({
      ok: true,
      values: [
        { playerId: 1, score: 1200 },
        { playerId: 2, score: 980 },
      ],
    });
  });

  it('rejects invalid integers', () => {
    expect(
      parseHumanWinnerScores([{ playerId: 1, playerName: 'Alice', raw: '-1' }]).ok,
    ).toBe(false);
  });
});

describe('formatWinnerScoresLabel', () => {
  it('formats named scores and omits blanks', () => {
    expect(
      formatWinnerScoresLabel([
        { playerName: 'Alice', score: 1200 },
        { playerName: 'Bob', score: null },
        { playerName: 'Carol', score: 980 },
      ]),
    ).toBe('Alice 1200 · Carol 980');
    expect(formatWinnerScoresLabel([{ playerName: 'Alice', score: null }])).toBeNull();
  });
});
