import { describe, expect, it } from 'vitest';

import {
  aggregateCivilizationWins,
  aggregatePlayerWins,
  formatWinnerLabel,
  parseWinnerPlayerIds,
  serializeWinnerPlayerIds,
  type GameHistoryParticipant,
} from '@/utils/gameWins';

const alice: GameHistoryParticipant = {
  playerId: 1,
  playerName: 'Alice',
  civilizationName: 'America',
  leaderName: 'George Washington',
  civilizationKey: 'america',
};

const bob: GameHistoryParticipant = {
  playerId: 2,
  playerName: 'Bob',
  civilizationName: 'Rome',
  leaderName: 'Augustus',
  civilizationKey: 'rome',
};

describe('winner player ids', () => {
  it('serializes unique sorted ids', () => {
    expect(serializeWinnerPlayerIds([3, 1, 1, 2])).toBe('[1,2,3]');
  });

  it('parses a JSON array of numbers and ignores junk', () => {
    expect(parseWinnerPlayerIds('[1,2]')).toEqual([1, 2]);
    expect(parseWinnerPlayerIds('[1,"x",3]')).toEqual([1, 3]);
    expect(parseWinnerPlayerIds('not-json')).toEqual([]);
    expect(parseWinnerPlayerIds(null)).toEqual([]);
  });
});

describe('formatWinnerLabel', () => {
  it('returns a human name, a team label, or null', () => {
    expect(formatWinnerLabel({ kind: 'human', playerIds: [1] }, [alice, bob])).toBe('Alice');
    expect(formatWinnerLabel({ kind: 'human', playerIds: [1, 2] }, [alice, bob])).toBe(
      'Team: Alice, Bob',
    );
    expect(formatWinnerLabel({ kind: 'human', playerIds: [9] }, [alice])).toBeNull();
    expect(formatWinnerLabel(null, [alice])).toBeNull();
  });

  it('formats a known AI civilization', () => {
    expect(
      formatWinnerLabel(
        { kind: 'ai', civilizationKey: 'america', leaderKey: 'LEADER_WASHINGTON' },
        [],
      ),
    ).toBe('AI: America (George Washington)');
  });

  it('falls back to keys when the AI civilization is unknown', () => {
    expect(
      formatWinnerLabel({ kind: 'ai', civilizationKey: 'missing', leaderKey: 'LEADER_X' }, []),
    ).toBe('AI: missing (LEADER_X)');
  });
});

describe('aggregateCivilizationWins', () => {
  it('counts human winner civs and AI winner civs, sorted by wins then key', () => {
    const result = aggregateCivilizationWins(
      [
        { id: 1, winner_kind: 'human', winner_player_ids: '[1]', winner_civilization_key: null },
        { id: 2, winner_kind: 'human', winner_player_ids: '[1,2]', winner_civilization_key: null },
        {
          id: 3,
          winner_kind: 'ai',
          winner_player_ids: null,
          winner_civilization_key: 'aztec',
        },
        { id: 4, winner_kind: 'human', winner_player_ids: '[]', winner_civilization_key: null },
      ],
      [
        { game_id: 1, player_id: 1, civilization_key: 'america' },
        { game_id: 2, player_id: 1, civilization_key: 'america' },
        { game_id: 2, player_id: 2, civilization_key: 'rome' },
        { game_id: 3, player_id: 1, civilization_key: 'japan' },
      ],
    );

    expect(result).toEqual([
      { civilizationKey: 'america', wins: 2 },
      { civilizationKey: 'aztec', wins: 1 },
      { civilizationKey: 'rome', wins: 1 },
    ]);
  });
});

describe('aggregatePlayerWins', () => {
  it('counts human player ids and a single AI bucket', () => {
    const result = aggregatePlayerWins([
      { id: 1, winner_kind: 'human', winner_player_ids: '[1,2]', winner_civilization_key: null },
      { id: 2, winner_kind: 'ai', winner_player_ids: null, winner_civilization_key: 'aztec' },
      { id: 3, winner_kind: 'ai', winner_player_ids: null, winner_civilization_key: 'rome' },
    ]);

    expect(result.get('1')).toBe(1);
    expect(result.get('2')).toBe(1);
    expect(result.get('ai')).toBe(2);
  });
});
