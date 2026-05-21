DROP INDEX `players_name_unique`;--> statement-breakpoint
ALTER TABLE `players` ADD `deleted_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `players_name_active_unique` ON `players` (`name`) WHERE "players"."deleted_at" is null;