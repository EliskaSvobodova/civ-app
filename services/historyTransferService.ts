import { createSqliteExecutor, getRepositories } from '@/database';
import type {
  HistoryImportMode,
  HistoryImportResult,
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

function normalizeName(name: string): string {
  return name.trim();
}

function nameKey(name: string): string {
  return normalizeName(name).toLowerCase();
}

function parseWinnerPlayerIds(raw: string | null): number[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is number => typeof value === 'number');
  } catch {
    return [];
  }
}

function serializeWinnerPlayerIds(playerIds: number[]): string {
  return JSON.stringify([...new Set(playerIds)].sort((a, b) => a - b));
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

function validateWinner(
  value: unknown,
  gameIndex: number,
): HistoryTransferWinner | null {
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

function winnerFieldsFromTransfer(
  winner: HistoryTransferWinner | null,
  playerIdByName: Map<string, number>,
): {
  winnerKind: string | null;
  winnerPlayerIds: string | null;
  winnerCivilizationKey: string | null;
  winnerLeaderKey: string | null;
} {
  if (!winner) {
    return {
      winnerKind: null,
      winnerPlayerIds: null,
      winnerCivilizationKey: null,
      winnerLeaderKey: null,
    };
  }
  if (winner.kind === 'human') {
    const ids = winner.playerNames.map((playerName) => {
      const id = playerIdByName.get(nameKey(playerName));
      if (id == null) {
        throw new Error(`Winner player not found: ${playerName}`);
      }
      return id;
    });
    return {
      winnerKind: 'human',
      winnerPlayerIds: serializeWinnerPlayerIds(ids),
      winnerCivilizationKey: null,
      winnerLeaderKey: null,
    };
  }
  return {
    winnerKind: 'ai',
    winnerPlayerIds: null,
    winnerCivilizationKey: winner.civilizationKey,
    winnerLeaderKey: winner.leaderKey,
  };
}

async function ensurePlayers(
  names: string[],
  options: { recreateAll: boolean },
): Promise<{ playerIdByName: Map<string, number>; ensured: number }> {
  const { players } = getRepositories();
  const now = new Date().toISOString();
  const uniqueNames: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = nameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueNames.push(normalizeName(name));
  }

  if (options.recreateAll) {
    await players.hardDeleteAll();
  }

  const playerIdByName = new Map<string, number>();
  let ensured = 0;

  for (const name of uniqueNames) {
    let player = await players.findActiveByName(name);
    if (!player) {
      player = await players.insert(name, now);
      ensured += 1;
    }
    playerIdByName.set(nameKey(name), player.id);
  }

  return { playerIdByName, ensured };
}

async function ensureEventTypes(
  documentTypes: HistoryTransferEventType[],
  requiredKeys: string[],
  options: { deleteMissingCustoms: boolean },
): Promise<{ eventTypeIdByKey: Map<string, number>; ensured: number }> {
  const { gameEvents } = getRepositories();
  const now = new Date().toISOString();

  if (options.deleteMissingCustoms) {
    const keepKeys = documentTypes.filter((type) => !type.isBuiltin).map((type) => type.key);
    await gameEvents.deleteCustomEventTypesNotIn(keepKeys);
  }

  let ensured = 0;
  for (const type of documentTypes) {
    if (type.isBuiltin) {
      continue;
    }
    const existing = await gameEvents.findEventTypeByKey(type.key);
    if (!existing) {
      await gameEvents.insertEventType({
        key: type.key,
        label: type.label,
        isBuiltin: false,
        createdAt: now,
      });
      ensured += 1;
    }
  }

  const eventTypeIdByKey = new Map<string, number>();
  const allTypes = await gameEvents.listEventTypes();
  for (const type of allTypes) {
    eventTypeIdByKey.set(type.key, type.id);
  }

  for (const key of requiredKeys) {
    if (!eventTypeIdByKey.has(key)) {
      throw new Error(`Unknown event type key: ${key}`);
    }
  }

  return { eventTypeIdByKey, ensured };
}

async function importGames(
  games: HistoryTransferGame[],
  playerIdByName: Map<string, number>,
  eventTypeIdByKey: Map<string, number>,
): Promise<number> {
  const { games: gameRepo, gameEvents } = getRepositories();
  const now = new Date().toISOString();
  let imported = 0;

  for (const game of games) {
    const winner = winnerFieldsFromTransfer(game.winner, playerIdByName);
    const { game: inserted } = await gameRepo.insertGameWithPlayers({
      civilizationKey: game.civilizationKey,
      leaderKey: game.leaderKey,
      playedAt: game.startedAt,
      createdAt: now,
      endedAt: game.endedAt,
      mapType: game.mapType,
      difficulty: game.difficulty,
      victoryType: game.victoryType,
      score: game.score,
      turnCount: game.turnCount,
      won: game.won,
      notes: game.notes,
      ...winner,
      assignments: game.participants.map((participant) => {
        const playerId = playerIdByName.get(nameKey(participant.playerName));
        if (playerId == null) {
          throw new Error(`Player not found: ${participant.playerName}`);
        }
        return {
          playerId,
          civilizationKey: participant.civilizationKey,
          leaderKey: participant.leaderKey,
        };
      }),
    });

    for (const event of game.events) {
      const eventTypeId = eventTypeIdByKey.get(event.eventTypeKey);
      if (eventTypeId == null) {
        throw new Error(`Unknown event type key: ${event.eventTypeKey}`);
      }
      await gameEvents.insertGameEvent({
        gameId: inserted.id,
        eventTypeId,
        round: event.round,
        civilizationKey: event.civilizationKey,
        targetKey: event.targetKey,
        targetLabel: event.targetLabel,
        createdAt: event.createdAt,
      });
    }

    imported += 1;
  }

  return imported;
}

export async function exportHistoryDocument(): Promise<HistoryTransferDocument> {
  const { games, players, gameEvents } = getRepositories();
  const gameRows = await games.findAllGameRows();
  const gameIds = gameRows.map((row) => row.id);
  const gamePlayerRows = await games.findGamePlayersForGames(gameIds);
  const eventRows = await gameEvents.listByGameIds(gameIds);
  const eventTypes = await gameEvents.listEventTypes();
  const namesById = await players.findNamesByIds([
    ...new Set(gamePlayerRows.map((row) => row.player_id)),
  ]);

  const playersByGame = new Map<number, typeof gamePlayerRows>();
  for (const row of gamePlayerRows) {
    const list = playersByGame.get(row.game_id) ?? [];
    list.push(row);
    playersByGame.set(row.game_id, list);
  }

  const eventsByGame = new Map<number, typeof eventRows>();
  for (const row of eventRows) {
    const list = eventsByGame.get(row.gameId) ?? [];
    list.push(row);
    eventsByGame.set(row.gameId, list);
  }

  const playerNameSet = new Map<string, HistoryTransferPlayer>();
  for (const name of namesById.values()) {
    playerNameSet.set(nameKey(name), { name });
  }

  const transferGames: HistoryTransferGame[] = gameRows.map((row) => {
    const participants = (playersByGame.get(row.id) ?? []).map((participant) => {
      const playerName = namesById.get(participant.player_id);
      if (!playerName) {
        throw new Error(`Missing player name for id ${participant.player_id}`);
      }
      playerNameSet.set(nameKey(playerName), { name: playerName });
      return {
        playerName,
        civilizationKey: participant.civilization_key,
        leaderKey: participant.leader_key,
      };
    });

    let winner: HistoryTransferWinner | null = null;
    if (row.winner_kind === 'human') {
      const winnerIds = parseWinnerPlayerIds(row.winner_player_ids);
      const playerNames = winnerIds.map((id) => {
        const name = namesById.get(id);
        if (!name) {
          throw new Error(`Missing winner player name for id ${id}`);
        }
        playerNameSet.set(nameKey(name), { name });
        return name;
      });
      winner = playerNames.length > 0 ? { kind: 'human', playerNames } : null;
    } else if (row.winner_kind === 'ai' && row.winner_civilization_key) {
      winner = {
        kind: 'ai',
        civilizationKey: row.winner_civilization_key,
        leaderKey: row.winner_leader_key ?? row.winner_civilization_key,
      };
    }

    const game: HistoryTransferGame = {
      startedAt: row.played_at,
      endedAt: row.ended_at,
      civilizationKey: row.civilization_key,
      leaderKey: row.leader_key,
      participants,
      winner,
      events: (eventsByGame.get(row.id) ?? []).map((event) => ({
        eventTypeKey: event.type.key,
        round: event.round,
        civilizationKey: event.civilizationKey,
        targetKey: event.targetKey,
        targetLabel: event.targetLabel,
        createdAt: event.createdAt,
      })),
    };

    if (row.map_type != null) game.mapType = row.map_type;
    if (row.difficulty != null) game.difficulty = row.difficulty;
    if (row.victory_type != null) game.victoryType = row.victory_type;
    if (row.score != null) game.score = row.score;
    if (row.turn_count != null) game.turnCount = row.turn_count;
    if (row.won != null) game.won = Boolean(row.won);
    if (row.notes != null) game.notes = row.notes;

    return game;
  });

  // Include active roster players even if not in history (useful for replace fixtures).
  for (const player of await players.findAllActive()) {
    playerNameSet.set(nameKey(player.name), { name: player.name });
  }

  return {
    format: HISTORY_TRANSFER_FORMAT,
    version: HISTORY_TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    players: Array.from(playerNameSet.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    ),
    eventTypes: eventTypes
      .filter((type) => !type.isBuiltin)
      .map((type) => ({
        key: type.key,
        label: type.label,
        isBuiltin: type.isBuiltin,
      })),
    games: transferGames,
  };
}

export async function importHistory(
  document: HistoryTransferDocument,
  mode: HistoryImportMode,
): Promise<HistoryImportResult> {
  const validated = validateHistoryDocument(document);
  const executor = createSqliteExecutor();

  return executor.withTransaction(async () => {
    const { games } = getRepositories();

    if (mode === 'replace') {
      await games.deleteAllHistory();
    }

    const playerNames = [
      ...validated.players.map((player) => player.name),
      ...validated.games.flatMap((game) => [
        ...game.participants.map((participant) => participant.playerName),
        ...(game.winner?.kind === 'human' ? game.winner.playerNames : []),
      ]),
    ];

    const { playerIdByName, ensured: playersEnsured } = await ensurePlayers(playerNames, {
      recreateAll: mode === 'replace',
    });

    const requiredEventKeys = [
      ...new Set(validated.games.flatMap((game) => game.events.map((event) => event.eventTypeKey))),
    ];

    const { eventTypeIdByKey, ensured: eventTypesEnsured } = await ensureEventTypes(
      validated.eventTypes,
      requiredEventKeys,
      { deleteMissingCustoms: mode === 'replace' },
    );

    const gamesImported = await importGames(
      validated.games,
      playerIdByName,
      eventTypeIdByKey,
    );

    return {
      mode,
      playersEnsured,
      eventTypesEnsured,
      gamesImported,
    };
  });
}
