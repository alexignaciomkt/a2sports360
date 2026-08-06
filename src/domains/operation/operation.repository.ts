import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { DispatchQueueResult } from "./operation.types";

export class OperationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getNextScheduledEncounter(tenantId: string, championshipId: string) {
    const { data, error } = await this.supabase.from('encounters')
      .select('*')
      .eq('championship_id', championshipId)
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getScheduledEncounters(tenantId: string, championshipId: string) {
    const { data, error } = await this.supabase.from('encounters')
      .select('*')
      .eq('championship_id', championshipId)
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getEncounterById(encounterId: string) {
    const { data, error } = await this.supabase.from('encounters')
      .select('*')
      .eq('id', encounterId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async dispatchEncounterToResource(tenantId: string, championshipId: string, encounterId: string, resourceId: string) {
    const { data, error } = await this.supabase.rpc('dispatch_encounter_to_resource', {
      p_tenant_id: tenantId,
      p_championship_id: championshipId,
      p_encounter_id: encounterId,
      p_resource_id: resourceId
    });

    if (error) throw error;
    return data;
  }

  async processDispatchQueue(tenantId: string, championshipId: string): Promise<DispatchQueueResult> {
    const { data, error } = await this.supabase.rpc('process_dispatch_queue', {
      p_tenant_id: tenantId,
      p_championship_id: championshipId
    });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = data;
    return {
      success: result.success,
      dispatched_count: result.dispatched_count,
      waiting_count: result.waiting_count,
      skipped_count: result.skipped_count,
      available_resources_remaining: result.available_resources_remaining,
      dispatches: result.dispatches || [],
      skipped: result.skipped || []
    };
  }

  async getEncounterCounts(tenantId: string, championshipId: string) {
    const [scheduled, inProgress, finished] = await Promise.all([
      this.supabase.from('encounters')
        .select('id', { count: 'exact', head: true })
        .eq('championship_id', championshipId)
        .eq('tenant_id', tenantId)
        .eq('status', 'scheduled'),
      this.supabase.from('encounters')
        .select('id', { count: 'exact', head: true })
        .eq('championship_id', championshipId)
        .eq('tenant_id', tenantId)
        .eq('status', 'in_progress'),
      this.supabase.from('encounters')
        .select('id', { count: 'exact', head: true })
        .eq('championship_id', championshipId)
        .eq('tenant_id', tenantId)
        .eq('status', 'finished'),
    ]);

    return {
      scheduled: scheduled.count || 0,
      inProgress: inProgress.count || 0,
      finished: finished.count || 0,
    };
  }

  async getEncountersWithTeams(tenantId: string, championshipId: string, statuses: string[]) {
    const { data, error } = await this.supabase
      .from('encounters')
      .select(`
        id,
        status,
        team_a:team_a_id (name),
        team_b:team_b_id (name)
      `)
      .eq('championship_id', championshipId)
      .eq('tenant_id', tenantId)
      .in('status', statuses)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
