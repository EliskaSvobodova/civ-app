import { createSqliteExecutor, type SqliteExecutor } from '@/database/sqliteExecutor';

import { SqliteGameEventRepository, type GameEventRepository } from './gameEventRepository';
import { SqliteGameRepository, type GameRepository } from './gameRepository';
import { SqlitePlayerRepository, type PlayerRepository } from './playerRepository';
import {
  SqlitePreferencesRepository,
  type PreferencesRepository,
} from './preferencesRepository';

export type Repositories = {
  players: PlayerRepository;
  games: GameRepository;
  preferences: PreferencesRepository;
  gameEvents: GameEventRepository;
};

export function createRepositories(executor: SqliteExecutor): Repositories {
  const players = new SqlitePlayerRepository(executor);
  return {
    players,
    games: new SqliteGameRepository(executor),
    preferences: new SqlitePreferencesRepository(executor),
    gameEvents: new SqliteGameEventRepository(executor),
  };
}

let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!cached) {
    cached = createRepositories(createSqliteExecutor());
  }
  return cached;
}

export function resetRepositories(): void {
  cached = null;
}

export type { GameEventRepository } from './gameEventRepository';
export type { GameRepository } from './gameRepository';
export type { PlayerRepository } from './playerRepository';
export type { PreferencesRepository } from './preferencesRepository';
export type {
  EventTypeDbRow,
  EventTypeRow,
  Game,
  GameDateRow,
  GameEventJoinedDbRow,
  GameEventRow,
  GameHistoryRow,
  GameMatchUpdateFields,
  GamePlayerCivRow,
  GamePlayerDbRow,
  GamePlayerRow,
  GameRow,
  GameWinnerFields,
  GameWinnerRow,
  InsertEventTypeInput,
  InsertGameEventInput,
  InsertGameWithPlayersInput,
  Player,
  PlayerRow,
} from './types';
