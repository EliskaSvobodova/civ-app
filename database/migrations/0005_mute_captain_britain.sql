CREATE TABLE `event_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`is_builtin` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_types_key_unique` ON `event_types` (`key`);--> statement-breakpoint
CREATE TABLE `game_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`event_type_id` integer NOT NULL,
	`round` integer NOT NULL,
	`civilization_key` text NOT NULL,
	`target_key` text,
	`target_label` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_type_id`) REFERENCES `event_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT OR IGNORE INTO `event_types` (`key`, `label`, `is_builtin`, `created_at`) VALUES
	('wonder_built', 'Wonder built', 1, '1970-01-01T00:00:00.000Z'),
	('religion_founded', 'Religion founded', 1, '1970-01-01T00:00:00.000Z'),
	('religion_enhanced', 'Religion enhanced', 1, '1970-01-01T00:00:00.000Z'),
	('religion_reformed', 'Religion reformed', 1, '1970-01-01T00:00:00.000Z'),
	('corporation_founded', 'Corporation founded', 1, '1970-01-01T00:00:00.000Z'),
	('civ_destroyed', 'Civilization destroyed', 1, '1970-01-01T00:00:00.000Z'),
	('civ_revived', 'Civilization revived', 1, '1970-01-01T00:00:00.000Z');
