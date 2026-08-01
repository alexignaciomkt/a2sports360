export const CHAMPIONSHIP_MODALITIES = [
  "truco_duplas",
] as const;

export type ChampionshipModality = typeof CHAMPIONSHIP_MODALITIES[number];

export const CHAMPIONSHIP_FORMATS = [
  "one_table_demo",
  "elimination",
] as const;

export type ChampionshipFormat = typeof CHAMPIONSHIP_FORMATS[number];
