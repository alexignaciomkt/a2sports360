export type ResourceType = "TABLE" | "COURT" | "FIELD" | "BOARD" | "ARENA" | "RING" | "MAT" | "TRACK" | "STATION" | "ROOM";

// Current mapped status based on legacy game_tables
export type ResourceStatus = "available" | "occupied";

export interface GameResource {
  id: string;
  tenantId: string;
  championshipId: string;
  type: ResourceType;
  prefixGroup: string;
  displayName: string;
  displayOrder: number;
  number: number; // legacy number
  status: ResourceStatus;
  currentEncounterId: string | null;
  activeGameId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigureResourcesResult {
  success: boolean;
  created_count: number;
  existing_count: number;
  requested_quantity: number;
  total_count: number;
  reduction_requested: boolean;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources?: any[];
}

export interface ResourceOperationalSnapshot {
  resource: GameResource;
}
