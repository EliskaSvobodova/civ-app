ALTER TABLE `game_players` ADD `score` integer;
--> statement-breakpoint
UPDATE game_players
SET score = (
  SELECT g.score FROM games g
  WHERE g.id = game_players.game_id
    AND g.winner_kind = 'human'
    AND g.score IS NOT NULL
    AND g.winner_player_ids = '[' || game_players.player_id || ']'
);
--> statement-breakpoint
UPDATE games
SET score = NULL
WHERE winner_kind = 'human'
  AND score IS NOT NULL
  AND winner_player_ids IS NOT NULL
  AND instr(winner_player_ids, ',') = 0;