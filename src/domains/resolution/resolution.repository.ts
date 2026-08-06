import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { ResolveFinishedGameResult, ResolutionOutcome } from "./resolution.types";

export class ResolutionRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async resolveFinishedGame(
    tenantId: string,
    championshipId: string,
    encounterId: string,
    matchId: string
  ): Promise<ResolveFinishedGameResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)('resolve_finished_game', {
      p_tenant_id: tenantId,
      p_championship_id: championshipId,
      p_encounter_id: encounterId,
      p_match_id: matchId,
    });

    if (error) {
      throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = data;

    return {
      success: result.success,
      idempotent: result.idempotent,
      outcome: result.outcome as ResolutionOutcome,
      encounterId: result.encounter_id,
      resolvedGameId: result.resolved_game_id,
      nextGameId: result.next_game_id,
      nextGameNumber: result.next_game_number,
      winnerTeamId: result.winner_team_id,
      resourceId: result.resource_id,
    };
  }
}
