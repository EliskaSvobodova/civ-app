import type { SqliteExecutor } from '@/database/sqliteExecutor';
import type { GameEventType } from '@/types';

import { mapEventTypeRow, mapGameEventJoinedRow } from './mappers/gameEventMapper';
import type {
  EventTypeDbRow,
  GameEventJoinedDbRow,
  InsertEventTypeInput,
  InsertGameEventInput,
} from './types';

export type GameEventRecord = ReturnType<typeof mapGameEventJoinedRow>;

export interface GameEventRepository {
  listEventTypes(): Promise<GameEventType[]>;
  findEventTypeById(id: number): Promise<GameEventType | undefined>;
  findEventTypeByKey(key: string): Promise<GameEventType | undefined>;
  findEventTypeByLabel(label: string): Promise<GameEventType | undefined>;
  insertEventType(input: InsertEventTypeInput): Promise<GameEventType>;
  listByGameId(gameId: number): Promise<GameEventRecord[]>;
  insertGameEvent(input: InsertGameEventInput): Promise<GameEventRecord>;
  deleteGameEvent(eventId: number): Promise<void>;
}

const EVENT_TYPE_SELECT =
  'SELECT id, key, label, is_builtin, created_at FROM event_types';

const GAME_EVENT_JOIN_SELECT = `SELECT
  e.id,
  e.game_id,
  e.round,
  e.civilization_key,
  e.target_key,
  e.target_label,
  e.created_at,
  t.id AS type_id,
  t.key AS type_key,
  t.label AS type_label,
  t.is_builtin AS type_is_builtin
FROM game_events e
INNER JOIN event_types t ON t.id = e.event_type_id`;

export class SqliteGameEventRepository implements GameEventRepository {
  constructor(private readonly executor: SqliteExecutor) {}

  async listEventTypes(): Promise<GameEventType[]> {
    const rows = await this.executor.getAll<EventTypeDbRow>(
      `${EVENT_TYPE_SELECT}
       ORDER BY is_builtin DESC, label COLLATE NOCASE ASC`,
    );
    return rows.map(mapEventTypeRow);
  }

  async findEventTypeById(id: number): Promise<GameEventType | undefined> {
    const row = await this.executor.getFirst<EventTypeDbRow>(
      `${EVENT_TYPE_SELECT} WHERE id = ?`,
      [id],
    );
    return row ? mapEventTypeRow(row) : undefined;
  }

  async findEventTypeByKey(key: string): Promise<GameEventType | undefined> {
    const row = await this.executor.getFirst<EventTypeDbRow>(
      `${EVENT_TYPE_SELECT} WHERE key = ?`,
      [key],
    );
    return row ? mapEventTypeRow(row) : undefined;
  }

  async findEventTypeByLabel(label: string): Promise<GameEventType | undefined> {
    const row = await this.executor.getFirst<EventTypeDbRow>(
      `${EVENT_TYPE_SELECT} WHERE lower(label) = lower(?)`,
      [label],
    );
    return row ? mapEventTypeRow(row) : undefined;
  }

  async insertEventType(input: InsertEventTypeInput): Promise<GameEventType> {
    const result = await this.executor.run(
      `INSERT INTO event_types (key, label, is_builtin, created_at)
       VALUES (?, ?, ?, ?)`,
      [input.key, input.label, input.isBuiltin ? 1 : 0, input.createdAt],
    );
    const created = await this.findEventTypeById(result.lastInsertRowId);
    if (!created) {
      throw new Error('Failed to create event type');
    }
    return created;
  }

  async listByGameId(gameId: number): Promise<GameEventRecord[]> {
    const rows = await this.executor.getAll<GameEventJoinedDbRow>(
      `${GAME_EVENT_JOIN_SELECT}
       WHERE e.game_id = ?
       ORDER BY e.round ASC, e.id ASC`,
      [gameId],
    );
    return rows.map(mapGameEventJoinedRow);
  }

  async insertGameEvent(input: InsertGameEventInput): Promise<GameEventRecord> {
    const result = await this.executor.run(
      `INSERT INTO game_events (
         game_id, event_type_id, round, civilization_key,
         target_key, target_label, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.gameId,
        input.eventTypeId,
        input.round,
        input.civilizationKey,
        input.targetKey,
        input.targetLabel,
        input.createdAt,
      ],
    );
    const row = await this.executor.getFirst<GameEventJoinedDbRow>(
      `${GAME_EVENT_JOIN_SELECT} WHERE e.id = ?`,
      [result.lastInsertRowId],
    );
    if (!row) {
      throw new Error('Failed to create game event');
    }
    return mapGameEventJoinedRow(row);
  }

  async deleteGameEvent(eventId: number): Promise<void> {
    const result = await this.executor.run(`DELETE FROM game_events WHERE id = ?`, [
      eventId,
    ]);
    if (result.changes === 0) {
      throw new Error('Game event not found');
    }
  }
}
