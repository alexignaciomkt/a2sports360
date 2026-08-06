import type { ResourceType } from "./resource.types";

export interface ResourceTypeDefinition {
  id: ResourceType;
  singular: string;
  plural: string;
  defaultPrefix: string;
  description: string;
  icon: string;
  color: string;
}

export const RESOURCE_CATALOG: Record<ResourceType, ResourceTypeDefinition> = {
  TABLE: {
    id: "TABLE",
    singular: "Mesa",
    plural: "Mesas",
    defaultPrefix: "Mesa",
    description: "Ideal para truco, sinuca, tênis de mesa, poker, etc.",
    icon: "Table2",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  },
  COURT: {
    id: "COURT",
    singular: "Quadra",
    plural: "Quadras",
    defaultPrefix: "Quadra",
    description: "Quadras esportivas de vôlei, basquete, beach tennis, futsal.",
    icon: "Square",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  },
  FIELD: {
    id: "FIELD",
    singular: "Campo",
    plural: "Campos",
    defaultPrefix: "Campo",
    description: "Campos gramados, society, beisebol.",
    icon: "Map",
    color: "bg-green-500/10 text-green-500 border-green-500/20"
  },
  BOARD: {
    id: "BOARD",
    singular: "Tabuleiro",
    plural: "Tabuleiros",
    defaultPrefix: "Tabuleiro",
    description: "Superfície para jogos de xadrez, damas, go.",
    icon: "Grid",
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  },
  ARENA: {
    id: "ARENA",
    singular: "Arena",
    plural: "Arenas",
    defaultPrefix: "Arena",
    description: "Local com arquibancada, centro de esportes multiuso.",
    icon: "Globe",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  RING: {
    id: "RING",
    singular: "Ringue",
    plural: "Ringues",
    defaultPrefix: "Ringue",
    description: "Esportes de combate, boxe, luta livre.",
    icon: "Crosshair",
    color: "bg-red-500/10 text-red-500 border-red-500/20"
  },
  MAT: {
    id: "MAT",
    singular: "Tatame",
    plural: "Tatames",
    defaultPrefix: "Tatame",
    description: "Área acolchoada para jiu-jitsu, judô, karatê.",
    icon: "Layout",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  },
  TRACK: {
    id: "TRACK",
    singular: "Pista",
    plural: "Pistas",
    defaultPrefix: "Pista",
    description: "Pistas de corrida, atletismo, natação.",
    icon: "Activity",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  },
  STATION: {
    id: "STATION",
    singular: "Estação",
    plural: "Estações",
    defaultPrefix: "Estação",
    description: "Setup para eSports, simuladores, consoles.",
    icon: "Monitor",
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
  },
  ROOM: {
    id: "ROOM",
    singular: "Sala",
    plural: "Salas",
    defaultPrefix: "Sala",
    description: "Salas fechadas, vestiários, salas de reunião.",
    icon: "DoorClosed",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  }
};

export const getResourceCatalogOptions = (): ResourceTypeDefinition[] => {
  return Object.values(RESOURCE_CATALOG);
};
