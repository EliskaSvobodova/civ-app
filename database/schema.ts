import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  createdAt: text('created_at').notNull(),
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

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
