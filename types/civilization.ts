export type GameTypeRef = {
  id: string;
  name: string;
};

export type Leader = {
  id: string;
  name: string;
};

export type UniqueAbility = {
  id: string;
  name: string;
  description: string;
};

export type UniqueUnit = {
  id: string;
  name: string;
  replaces?: GameTypeRef;
  strategy?: string;
  flavor?: string;
  promotions?: string[];
};

export type UniqueBuildingKind = 'nationalWonder' | 'uniqueBuilding';

export type UniqueBuilding = {
  id: string;
  name: string;
  kind?: UniqueBuildingKind;
  replaces?: GameTypeRef;
  strategy?: string;
  description?: string;
  flavor?: string;
};

export type UniqueWonderFocus = 'culture' | 'science' | 'production';

export type UniqueWonder = {
  id: string;
  name: string;
  exclusiveGroup?: string;
  requires?: string;
  focus?: UniqueWonderFocus;
  flavor?: string;
  strategy?: string;
};

export type Civilization = {
  id: string;
  slug: string;
  name: string;
  /** 0 = weakest, 10 = strongest — see assets/data/civilizations.json */
  warlikeScore: number;
  scienceScore: number;
  cultureScore: number;
  diplomaticScore: number;
  leader: Leader;
  uniqueAbility: UniqueAbility;
  uniqueUnits: UniqueUnit[];
  uniqueBuildings?: UniqueBuilding[];
  uniqueWonders?: UniqueWonder[];
};

export type CivilizationsDataset = {
  schemaVersion: number;
  mod: string;
  description: string;
  civilizations: Civilization[];
};
