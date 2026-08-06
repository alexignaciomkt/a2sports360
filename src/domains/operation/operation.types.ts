// Operation Engine V2 — Types
// Somente tipos com comportamento real implementado.

// --- Estados (espelham o banco) ---

export type EncounterStatus = 'scheduled' | 'in_progress' | 'finished';
export type ResourceStatus = 'available' | 'occupied';

// --- Contexto Operacional (legacy, mantido) ---

export type OperationalAction = 'dispatch' | 'resume' | 'wait' | 'intervention_required';

export type OperationContext =
  | {
      state: 'table_available_encounter_waiting';
      action: 'dispatch';
      nextEncounterId: string;
      message: string;
    }
  | {
      state: 'encounter_in_progress';
      action: 'resume';
      currentEncounterId: string;
      activeGameId: string;
      message: string;
    }
  | {
      state: 'table_available_no_match';
      action: 'wait';
      message: string;
    }
  | {
      state: 'inconsistent_state';
      action: 'intervention_required';
      message: string;
    };

// --- Dispatch Queue (Sprint 14) ---

export interface DispatchAssignment {
  encounter_id: string;
  resource_id: string;
  resource_name: string;
  active_game_id: string;
}

export interface SkippedEncounter {
  encounter_id: string;
  reason: string;
}

export interface DispatchQueueResult {
  success: boolean;
  dispatched_count: number;
  waiting_count: number;
  skipped_count: number;
  available_resources_remaining: number;
  dispatches: DispatchAssignment[];
  skipped: SkippedEncounter[];
}

// --- Operational Snapshot (para futuro dashboard) ---

export interface DashboardResource {
  id: string;
  displayName: string;
  status: ResourceStatus;
  currentEncounterId: string | null;
  activeGameId: string | null;
}

export interface DashboardEncounter {
  id: string;
  teamAName: string;
  teamBName: string;
  status: EncounterStatus;
}

export interface OperationalDashboardSnapshot {
  totalResources: number;
  availableResources: number;
  occupiedResources: number;
  scheduledEncounters: number;
  inProgressEncounters: number;
  finishedEncounters: number;
  currentDispatches: DispatchAssignment[];
  waitingCount: number;
  resources: DashboardResource[];
  waitingEncounters: DashboardEncounter[];
  inProgressEncounterDetails: DashboardEncounter[];
}
