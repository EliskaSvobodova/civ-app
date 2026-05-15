export type VictoryType =
  | 'domination'
  | 'science'
  | 'culture'
  | 'diplomatic'
  | 'time'
  | 'unknown';

export type MapType =
  | 'pangaea'
  | 'continents'
  | 'archipelago'
  | 'fractal'
  | 'other';

export type Difficulty =
  | 'settler'
  | 'chieftain'
  | 'warlord'
  | 'prince'
  | 'king'
  | 'emperor'
  | 'immortal'
  | 'deity';

export type GameRecord = {
  id: number;
  civilizationKey: string;
  leaderKey: string;
  mapType?: MapType;
  difficulty?: Difficulty;
  victoryType?: VictoryType;
  score?: number;
  turnCount?: number;
  won?: boolean;
  notes?: string;
  playedAt: string;
};
