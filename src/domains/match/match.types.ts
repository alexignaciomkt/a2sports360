export type EncounterStatus = 'scheduled' | 'in_progress' | 'finished';
export type MatchStatus = 'scheduled' | 'in_progress' | 'finished';

export interface EncounterState {
  id: string;
  championshipId: string;
  tenantId: string;
  stageId: string;
  teamAId: string;
  teamBId: string;
  bestOf: number;
  winsRequired: number;
  teamAWins: number;
  teamBWins: number;
  status: EncounterStatus;
  winnerTeamId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface MatchState {
  id: string;
  championshipId: string;
  encounterId: string | null;
  gameNumber: number | null;
  tableId: string | null;
  teamAId: string;
  teamBId: string;
  teamAScore: number;
  teamBScore: number;
  status: MatchStatus;
  winnerTeamId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface PrepareNextGameResult {
  canCreate: boolean;
  reason?: string;
  payload?: {
    encounterId: string;
    championshipId: string;
    teamAId: string;
    teamBId: string;
    gameNumber: number;
    status: MatchStatus;
  };
}

export interface PrepareEncounterFinishResult {
  canFinish: boolean;
  reason?: string;
  payload?: {
    encounterId: string;
    status: EncounterStatus;
    winnerTeamId: string;
    finishedAt: string;
  };
}
