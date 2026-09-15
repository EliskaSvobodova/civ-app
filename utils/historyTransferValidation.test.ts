import { describe, expect, it } from 'vitest';

import { HISTORY_TRANSFER_FORMAT, HISTORY_TRANSFER_VERSION } from '@/types';
import { validateHistoryDocument } from '@/utils/historyTransferValidation';

function validDocument(overrides: Record<string, unknown> = {}) {
  return {
    format: HISTORY_TRANSFER_FORMAT,
    version: HISTORY_TRANSFER_VERSION,
    exportedAt: '2024-01-01T00:00:00.000Z',
    players: [{ name: ' Alice ' }],
    eventTypes: [{ key: 'custom_foo', label: ' Foo ', isBuiltin: false }],
    games: [
      {
        startedAt: '2024-01-01T12:00:00.000Z',
        endedAt: null,
        civilizationKey: ' america ',
        leaderKey: ' washington ',
        participants: [
          {
            playerName: ' Alice ',
            civilizationKey: ' america ',
            leaderKey: ' washington ',
          },
        ],
        winner: { kind: 'human', playerNames: [' Alice '] },
        events: [
          {
            eventTypeKey: ' wonder_built ',
            round: 0,
            civilizationKey: ' america ',
            targetKey: null,
            targetLabel: null,
            createdAt: '2024-01-01T13:00:00.000Z',
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('validateHistoryDocument', () => {
  it('accepts a versioned document and trims names and keys', () => {
    const document = validateHistoryDocument(validDocument());

    expect(document.format).toBe(HISTORY_TRANSFER_FORMAT);
    expect(document.version).toBe(HISTORY_TRANSFER_VERSION);
    expect(document.players[0].name).toBe('Alice');
    expect(document.games[0].civilizationKey).toBe('america');
    expect(document.games[0].participants[0].playerName).toBe('Alice');
    expect(document.games[0].winner).toEqual({ kind: 'human', playerNames: ['Alice'] });
    expect(document.games[0].events[0].eventTypeKey).toBe('wonder_built');
  });

  it('accepts an AI winner', () => {
    const document = validateHistoryDocument(
      validDocument({
        games: [
          {
            startedAt: '2024-01-01T12:00:00.000Z',
            endedAt: '2024-01-02T12:00:00.000Z',
            civilizationKey: 'rome',
            leaderKey: 'augustus',
            participants: [
              { playerName: 'Alice', civilizationKey: 'rome', leaderKey: 'augustus' },
            ],
            winner: { kind: 'ai', civilizationKey: ' aztec ', leaderKey: ' montezuma ' },
            events: [],
          },
        ],
      }),
    );

    expect(document.games[0].winner).toEqual({
      kind: 'ai',
      civilizationKey: 'aztec',
      leaderKey: 'montezuma',
    });
  });

  it('rejects the wrong format or version', () => {
    expect(() => validateHistoryDocument(validDocument({ format: 'other' }))).toThrow(
      'Unsupported format (expected civ-app-history)',
    );
    expect(() => validateHistoryDocument(validDocument({ version: 2 }))).toThrow(
      'Unsupported version (expected 1)',
    );
  });

  it('rejects a non-object payload', () => {
    expect(() => validateHistoryDocument([])).toThrow('History file must be a JSON object');
  });

  it('rejects a missing exportedAt', () => {
    const { exportedAt: _exportedAt, ...payload } = validDocument();
    expect(() => validateHistoryDocument(payload)).toThrow('Missing exportedAt');
  });

  it('rejects a participant who is not in the players list', () => {
    expect(() =>
      validateHistoryDocument(
        validDocument({
          games: [
            {
              startedAt: '2024-01-01T12:00:00.000Z',
              endedAt: null,
              civilizationKey: 'america',
              leaderKey: 'washington',
              participants: [
                { playerName: 'Bob', civilizationKey: 'america', leaderKey: 'washington' },
              ],
              winner: null,
              events: [],
            },
          ],
        }),
      ),
    ).toThrow('Game participant "Bob" is missing from players list');
  });

  it('rejects a human winner who is not in the players list', () => {
    expect(() =>
      validateHistoryDocument(
        validDocument({
          games: [
            {
              startedAt: '2024-01-01T12:00:00.000Z',
              endedAt: null,
              civilizationKey: 'america',
              leaderKey: 'washington',
              participants: [
                { playerName: 'Alice', civilizationKey: 'america', leaderKey: 'washington' },
              ],
              winner: { kind: 'human', playerNames: ['Bob'] },
              events: [],
            },
          ],
        }),
      ),
    ).toThrow('Winner "Bob" is missing from players list');
  });

  it('rejects a negative event round', () => {
    expect(() =>
      validateHistoryDocument(
        validDocument({
          games: [
            {
              startedAt: '2024-01-01T12:00:00.000Z',
              endedAt: null,
              civilizationKey: 'america',
              leaderKey: 'washington',
              participants: [
                { playerName: 'Alice', civilizationKey: 'america', leaderKey: 'washington' },
              ],
              winner: null,
              events: [
                {
                  eventTypeKey: 'wonder_built',
                  round: -1,
                  civilizationKey: 'america',
                  targetKey: null,
                  targetLabel: null,
                  createdAt: '2024-01-01T13:00:00.000Z',
                },
              ],
            },
          ],
        }),
      ),
    ).toThrow('Invalid games[0].events[0]');
  });
});
