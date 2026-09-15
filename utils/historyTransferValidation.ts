import type {
  HistoryTransferDocument,
  HistoryTransferEvent,
  HistoryTransferEventType,
  HistoryTransferGame,
  HistoryTransferParticipant,
  HistoryTransferPlayer,
  HistoryTransferWinner,
} from '@/types';
import { HISTORY_TRANSFER_FORMAT, HISTORY_TRANSFER_VERSION } from '@/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function normalizeName(name: string): string {
  return name.trim();
}

export function nameKey(name: string): string {
  return normalizeName(name).toLowerCase();
}

function optionalStringField(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in record)) {
    return undefined;
  }
  const value = record[key];
  if (value === null || typeof value === 'string') {
    return value;
  }
  throw new Error(`Invalid ${key}`);
}

function optionalNumberField(
  record: Record<string, unknown>,
  key: string,
): number | null | undefined {
  if (!(key in record)) {
    return undefined;
  }
  const value = record[key];
  if (value === null || typeof value === 'number') {
    return value;
  }
  throw new Error(`Invalid ${key}`);
}

function optionalBooleanField(
  record: Record<string, unknown>,
  key: string,
): boolean | null | undefined {
  if (!(key in record)) {
    return undefined;
  }
  const value = record[key];
  if (value === null || typeof value === 'boolean') {
    return value;
  }
  throw new Error(`Invalid ${key}`);
}

function validatePlayer(value: unknown, index: number): HistoryTransferPlayer {
  if (!isRecord(value) || !isNonEmptyString(value.name)) {
    throw new Error(`Invalid players[${index}]`);
  }
  return { name: normalizeName(value.name) };
}

function validateEventType(value: unknown, index: number): HistoryTransferEventType {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.key) ||
    !isNonEmptyString(value.label) ||
    typeof value.isBuiltin !== 'boolean'
  ) {
    throw new Error(`Invalid eventTypes[${index}]`);
  }
  return {
    key: value.key.trim(),
    label: value.label.trim(),
    isBuiltin: value.isBuiltin,
  };
}

function validateParticipant(
  value: unknown,
  gameIndex: number,
  participantIndex: number,
): HistoryTransferParticipant {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.playerName) ||
    !isNonEmptyString(value.civilizationKey) ||
    !isNonEmptyString(value.leaderKey)
  ) {
    throw new Error(`Invalid games[${gameIndex}].participants[${participantIndex}]`);
  }
  return {
    playerName: normalizeName(value.playerName),
    civilizationKey: value.civilizationKey.trim(),
    leaderKey: value.leaderKey.trim(),
  };
}

function validateWinner(value: unknown, gameIndex: number): HistoryTransferWinner | null {
  if (value === null) {
    return null;
  }
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new Error(`Invalid games[${gameIndex}].winner`);
  }
  if (value.kind === 'human') {
    if (!Array.isArray(value.playerNames) || value.playerNames.length === 0) {
      throw new Error(`Invalid games[${gameIndex}].winner.playerNames`);
    }
    const playerNames = value.playerNames.map((name, index) => {
      if (!isNonEmptyString(name)) {
        throw new Error(`Invalid games[${gameIndex}].winner.playerNames[${index}]`);
      }
      return normalizeName(name);
    });
    return { kind: 'human', playerNames };
  }
  if (value.kind === 'ai') {
    if (!isNonEmptyString(value.civilizationKey) || !isNonEmptyString(value.leaderKey)) {
      throw new Error(`Invalid games[${gameIndex}].winner AI keys`);
    }
    return {
      kind: 'ai',
      civilizationKey: value.civilizationKey.trim(),
      leaderKey: value.leaderKey.trim(),
    };
  }
  throw new Error(`Invalid games[${gameIndex}].winner.kind`);
}

function validateEvent(
  value: unknown,
  gameIndex: number,
  eventIndex: number,
): HistoryTransferEvent {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.eventTypeKey) ||
    typeof value.round !== 'number' ||
    !Number.isInteger(value.round) ||
    value.round < 0 ||
    !isNonEmptyString(value.civilizationKey) ||
    !isNullableString(value.targetKey) ||
    !isNullableString(value.targetLabel) ||
    !isNonEmptyString(value.createdAt)
  ) {
    throw new Error(`Invalid games[${gameIndex}].events[${eventIndex}]`);
  }
  return {
    eventTypeKey: value.eventTypeKey.trim(),
    round: value.round,
    civilizationKey: value.civilizationKey.trim(),
    targetKey: value.targetKey,
    targetLabel: value.targetLabel,
    createdAt: value.createdAt,
  };
}

function validateGame(value: unknown, index: number): HistoryTransferGame {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.startedAt) ||
    !isNullableString(value.endedAt) ||
    !isNonEmptyString(value.civilizationKey) ||
    !isNonEmptyString(value.leaderKey) ||
    !Array.isArray(value.participants) ||
    value.participants.length === 0 ||
    !Array.isArray(value.events)
  ) {
    throw new Error(`Invalid games[${index}]`);
  }

  const participants = value.participants.map((participant, participantIndex) =>
    validateParticipant(participant, index, participantIndex),
  );
  const winner = validateWinner(value.winner ?? null, index);
  const events = value.events.map((event, eventIndex) =>
    validateEvent(event, index, eventIndex),
  );

  const game: HistoryTransferGame = {
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    civilizationKey: value.civilizationKey.trim(),
    leaderKey: value.leaderKey.trim(),
    participants,
    winner,
    events,
  };

  const mapType = optionalStringField(value, 'mapType');
  if (mapType !== undefined) game.mapType = mapType;
  const difficulty = optionalStringField(value, 'difficulty');
  if (difficulty !== undefined) game.difficulty = difficulty;
  const victoryType = optionalStringField(value, 'victoryType');
  if (victoryType !== undefined) game.victoryType = victoryType;
  const score = optionalNumberField(value, 'score');
  if (score !== undefined) game.score = score;
  const turnCount = optionalNumberField(value, 'turnCount');
  if (turnCount !== undefined) game.turnCount = turnCount;
  const won = optionalBooleanField(value, 'won');
  if (won !== undefined) game.won = won;
  const notes = optionalStringField(value, 'notes');
  if (notes !== undefined) game.notes = notes;

  return game;
}

export function validateHistoryDocument(value: unknown): HistoryTransferDocument {
  if (!isRecord(value)) {
    throw new Error('History file must be a JSON object');
  }
  if (value.format !== HISTORY_TRANSFER_FORMAT) {
    throw new Error(`Unsupported format (expected ${HISTORY_TRANSFER_FORMAT})`);
  }
  if (value.version !== HISTORY_TRANSFER_VERSION) {
    throw new Error(`Unsupported version (expected ${HISTORY_TRANSFER_VERSION})`);
  }
  if (!isNonEmptyString(value.exportedAt)) {
    throw new Error('Missing exportedAt');
  }
  if (!Array.isArray(value.players) || !Array.isArray(value.eventTypes) || !Array.isArray(value.games)) {
    throw new Error('players, eventTypes, and games must be arrays');
  }

  const players = value.players.map(validatePlayer);
  const eventTypes = value.eventTypes.map(validateEventType);
  const games = value.games.map(validateGame);

  const playerNames = new Set(players.map((player) => nameKey(player.name)));
  for (const game of games) {
    for (const participant of game.participants) {
      if (!playerNames.has(nameKey(participant.playerName))) {
        throw new Error(
          `Game participant "${participant.playerName}" is missing from players list`,
        );
      }
    }
    if (game.winner?.kind === 'human') {
      for (const winnerName of game.winner.playerNames) {
        if (!playerNames.has(nameKey(winnerName))) {
          throw new Error(`Winner "${winnerName}" is missing from players list`);
        }
      }
    }
  }

  return {
    format: HISTORY_TRANSFER_FORMAT,
    version: HISTORY_TRANSFER_VERSION,
    exportedAt: value.exportedAt,
    players,
    eventTypes,
    games,
  };
}
