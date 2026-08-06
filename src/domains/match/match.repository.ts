import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { EncounterState, MatchState, MatchStatus } from "./match.types";

export class MatchRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getEncounter(encounterId: string): Promise<EncounterState | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.from as any)('encounters')
      .select('*')
      .eq('id', encounterId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      championshipId: data.championship_id,
      tenantId: data.tenant_id,
      stageId: data.stage_id,
      teamAId: data.team_a_id,
      teamBId: data.team_b_id,
      bestOf: data.best_of,
      winsRequired: data.wins_required,
      teamAWins: data.team_a_wins,
      teamBWins: data.team_b_wins,
      status: data.status,
      winnerTeamId: data.winner_team_id,
      startedAt: data.started_at,
      finishedAt: data.finished_at,
    };
  }

  async getMatchesByEncounter(encounterId: string): Promise<MatchState[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.from as any)('matches')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('game_number', { ascending: true });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((m: any) => ({
      id: m.id,
      championshipId: m.championship_id,
      encounterId: m.encounter_id,
      gameNumber: m.game_number,
      tableId: m.table_id,
      teamAId: m.team_a_id,
      teamBId: m.team_b_id,
      teamAScore: m.team_a_score,
      teamBScore: m.team_b_score,
      status: m.status as MatchStatus,
      winnerTeamId: m.winner_team_id,
      startedAt: m.started_at,
      finishedAt: m.finished_at,
    }));
  }
}
