import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { ResolutionRepository } from "./resolution.repository";
import { ResolveFinishedGameResult } from "./resolution.types";

export class ResolutionService {
  private repository: ResolutionRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new ResolutionRepository(supabase);
  }

  async resolveFinishedGame(
    tenantId: string,
    championshipId: string,
    encounterId: string,
    matchId: string
  ): Promise<ResolveFinishedGameResult> {
    return this.repository.resolveFinishedGame(tenantId, championshipId, encounterId, matchId);
  }
}
