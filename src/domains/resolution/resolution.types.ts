export type ResolutionOutcome = 'encounter_finished' | 'next_game_started';

export interface ResolveFinishedGameResult {
  success: boolean;
  idempotent: boolean;
  outcome: ResolutionOutcome;
  encounterId: string;
  resolvedGameId: string;
  nextGameId?: string | null;
  nextGameNumber?: number | null;
  winnerTeamId?: string | null;
  resourceId?: string | null;
}
