export type CatalogItem = {
  id: string;
  name: string;
};

export type WorldWonder = CatalogItem & {
  prereqTech?: string;
  unlockedByLeague?: boolean;
  civilizationRequired?: string;
};

export type Religion = CatalogItem;

export type Corporation = CatalogItem & {
  headquartersBuildingClass?: string;
};

export type WorldWondersDataset = {
  schemaVersion: number;
  mod: string;
  description: string;
  worldWonders: WorldWonder[];
};

export type ReligionsDataset = {
  schemaVersion: number;
  mod: string;
  description: string;
  religions: Religion[];
};

export type CorporationsDataset = {
  schemaVersion: number;
  mod: string;
  description: string;
  corporations: Corporation[];
};

export type CatalogOption = {
  id: string;
  name: string;
};
