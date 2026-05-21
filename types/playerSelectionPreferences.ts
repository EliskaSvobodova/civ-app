export type PlayerSelectionPreferences = {
  /** Civilization slugs excluded from random selection for this player. */
  excludedSlugs: string[];
  /** When true, recently played civilizations are avoided when possible. */
  avoidRecentlyPlayed: boolean;
  /** How many most recent games to consider when avoidRecentlyPlayed is enabled. */
  recentGamesCount: number;
};

export const DEFAULT_PLAYER_SELECTION_PREFERENCES: PlayerSelectionPreferences = {
  excludedSlugs: [],
  avoidRecentlyPlayed: false,
  recentGamesCount: 3,
};
