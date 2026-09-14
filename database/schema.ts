import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  civilizationKey: text('civilization_key').notNull(),
  leaderKey: text('leader_key').notNull(),
  mapType: text('map_type'),
  difficulty: text('difficulty'),
  victoryType: text('victory_type'),
  score: integer('score'),
  turnCount: integer('turn_count'),
  won: integer('won', { mode: 'boolean' }),
  winnerKind: text('winner_kind'),
  winnerPlayerIds: text('winner_player_ids'),
  winnerCivilizationKey: text('winner_civilization_key'),
  winnerLeaderKey: text('winner_leader_key'),
  notes: text('notes'),
  playedAt: text('played_at').notNull(),
  endedAt: text('ended_at'),
  createdAt: text('created_at').notNull(),
});

export const players = sqliteTable(
  'players',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    uniqueIndex('players_name_active_unique')
      .on(table.name)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export const gamePlayers = sqliteTable('game_players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id),
  civilizationKey: text('civilization_key').notNull(),
  leaderKey: text('leader_key').notNull(),
});

export const userPreferences = sqliteTable('user_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const eventTypes = sqliteTable('event_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  isBuiltin: integer('is_builtin', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(),
});

export const gameEvents = sqliteTable('game_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id),
  eventTypeId: integer('event_type_id')
    .notNull()
    .references(() => eventTypes.id),
  round: integer('round').notNull(),
  civilizationKey: text('civilization_key').notNull(),
  targetKey: text('target_key'),
  targetLabel: text('target_label'),
  createdAt: text('created_at').notNull(),
});
