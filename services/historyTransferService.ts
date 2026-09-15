import { createSqliteExecutor, getRepositories } from '@/database';
import type {
  HistoryImportMode,
  HistoryImportResult,
  HistoryTransferDocument,
  HistoryTransferEventType,
  HistoryTransferGame,
  HistoryTransferPlayer,
  HistoryTransferWinner,
} from '@/types';
import { HISTORY_TRANSFER_FORMAT, HISTORY_TRANSFER_VERSION } from '@/types';
import { parseWinnerPlayerIds, serializeWinnerPlayerIds } from '@/utils/gameWins';
import {
  nameKey,
  normalizeName,
  validateHistoryDocument,
} from '@/utils/historyTransferValidation';

export { validateHistoryDocument } from '@/utils/historyTransferValidation';

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
